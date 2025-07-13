const { verifyRefreshToken, generateTokenPair, getRefreshTokenExpiry } = require('../../helpers/jwt');
const Account = require('../../models/account.model');

module.exports.autoRefreshToken = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        // Nếu không có access token nhưng có refresh token, thử refresh
        if (!accessToken && refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);
            
            if (decoded && decoded.userType === 'account') {
                const user = await Account.findOne({
                    _id: decoded.id,
                    refreshToken: refreshToken,
                    deleted: false
                });

                if (user && (!user.refreshTokenExpires || new Date() <= user.refreshTokenExpires)) {
                    // Generate new token pair
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokenPair(user, 'account');
                    
                    // Update refresh token in database
                    await Account.updateOne(
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
};
