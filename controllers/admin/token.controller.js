const User = require('../../models/user.model');
const Account = require('../../models/account.model');
const { verifyRefreshToken, generateTokenPair, getRefreshTokenExpiry } = require('../../helpers/jwt');

// [POST] /token/refresh
module.exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        if (!decoded || decoded.userType !== 'account') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        const user = await Account.findOne({
            _id: decoded.id,
            refreshToken: refreshToken,
            deleted: false
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not found or user does not exist'
            });
        }

        // Check if refresh token is expired
        if (user.refreshTokenExpires && new Date() > user.refreshTokenExpires) {
            // Clear expired refresh token
            await Account.updateOne(
                { _id: user._id },
                {
                    refreshToken: null,
                    refreshTokenExpires: null
                }
            );
            
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired'
            });
        }

        // Generate new token pair
        const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user, 'account');
        
        // Update refresh token in database
        await Account.updateOne(
            { _id: user._id },
            {
                refreshToken: newRefreshToken,
                refreshTokenExpires: getRefreshTokenExpiry(newRefreshToken)
            }
        );

        // Set new cookies
        res.cookie('accessToken', accessToken, {
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

        return res.json({
            success: true,
            message: 'Token refreshed successfully',
            tokens: {
                accessToken,
                expiresIn: 15 * 60
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// [GET] /token/status - Check authentication status
module.exports.checkStatus = async (req, res) => {
    try {
        // This will be populated by the auth middleware
        const user = res.locals.user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                authenticated: false,
                message: 'Not authenticated'
            });
        }
        
        return res.json({
            success: true,
            authenticated: true,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                userType: 'account'
            }
        });
    } catch (error) {
        console.error('Check status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
