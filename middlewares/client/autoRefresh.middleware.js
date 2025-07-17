import { verifyRefreshToken, generateTokenPair, getRefreshTokenExpiry } from '../../helpers/jwt.js';
import User from '../../models/user.model.js';

export async function autoRefreshToken(req, res, next) {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        // Nếu không có access token nhưng có refresh token, thử refresh
        if (!accessToken && refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);
            
            if (decoded && decoded.userType === 'user') {
                const user = await User.findOne({
                    _id: decoded.id,
                    refreshToken: refreshToken,
                    deleted: false
                });

                if (user && (!user.refreshTokenExpires || new Date() <= user.refreshTokenExpires)) {
                    // Generate new token pair
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair(user, 'user');
                    
                    // Update refresh token in database
                    await User.updateOne(
                        { _id: user._id },
                        {
                            refreshToken: newRefreshToken,
                            refreshTokenExpires: getRefreshTokenExpiry(newRefreshToken)
                        }
                    );

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
            }
        }
        
        next();
    } catch (error) {
        console.error('Auto refresh token error:', error);
        next();
    }
}
