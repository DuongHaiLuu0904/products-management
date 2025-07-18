import User from '../../models/user.model.js';
import { verifyRefreshToken, generateTokenPair, getRefreshTokenExpiry } from '../../helpers/jwt.js';

// [POST] /token/refresh
export async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.cookies;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not provided'
            });
        }
        
        const decoded = verifyRefreshToken(refreshToken);
        
        if (!decoded || decoded.userType !== 'user') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        
        const user = await User.findOne({
            _id: decoded.id,
            refreshToken: refreshToken,
            refreshTokenExpires: { $gt: new Date() },
            deleted: false
        }).select("-password");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }
        
        const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user, 'user');
        
        await User.updateOne(
            { _id: user._id },
            {
                refreshToken: newRefreshToken,
                refreshTokenExpires: getRefreshTokenExpiry(newRefreshToken)
            }
        );
        
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
        
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            tokens: {
                accessToken,
                expiresIn: 15 * 60
            }
        });
        
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// [GET] /token/status - Check authentication status
export async function checkStatus(req, res) {
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
                userType: 'user'
            }
        });
    } catch (error) {
        console.error('Check status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
