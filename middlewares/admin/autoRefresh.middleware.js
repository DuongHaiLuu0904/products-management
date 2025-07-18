import { verifyRefreshToken, generateTokenPair, getRefreshTokenExpiry } from '../../helpers/jwt.js';
import Account from '../../models/account.model.js';

export async function autoRefreshToken(req, res, next) {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        // Nếu không có access token nhưng có refresh token, thử refresh
        if (!accessToken && refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);
            
            if (decoded && decoded.userType === 'account') {
                try {
                    const user = await Account.findOne({
                        _id: decoded.id,
                        refreshToken: refreshToken,
                        deleted: false
                    }).lean(); // Sử dụng lean() để tăng performance

                    if (user && (!user.refreshTokenExpires || new Date() <= user.refreshTokenExpires)) {
                        // Generate new token pair
                        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair(user, 'account');
                        
                        // Update refresh token in database với timeout
                        await Account.updateOne(
                            { _id: user._id },
                            {
                                refreshToken: newRefreshToken,
                                refreshTokenExpires: getRefreshTokenExpiry(newRefreshToken)
                            }
                        ).maxTimeMS(5000); // Timeout 5 giây

                        // Set new cookies
                        res.cookie('accessToken', newAccessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 15 * 60 * 1000 // 15 phút
                        });
                        
                        res.cookie('refreshToken', newRefreshToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
                        });
                    }
                } catch (dbError) {
                    // Chỉ log lỗi database quan trọng, bỏ qua ECONNRESET
                    if (dbError.code !== 'ECONNRESET' && dbError.errno !== -4077) {
                        console.error('Database error in auto refresh:', dbError.message);
                    }
                    // Không block request nếu có lỗi database
                }
            }
        }
        
        next();
    } catch (error) {
        // Chỉ log lỗi nghiêm trọng, bỏ qua network errors
        if (error.code !== 'ECONNRESET' && error.errno !== -4077) {
            console.error('Auto refresh token error:', error.message);
        }
        next();
    }
}
