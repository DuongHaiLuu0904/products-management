import User from "../../models/user.model.js";
import { verifyAccessToken, verifyRefreshToken, generateTokenPair, getRefreshTokenExpiry } from "../../helpers/jwt.js";

export async function reuireAuth(req, res, next) {
    let user = null;
    let needsTokenRefresh = false;
    
    // Check for passport session first
    if (req.user) {
        user = req.user;
    }
    // Check for JWT access token in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.substring(7);
        const decoded = verifyAccessToken(token);
        
        if (decoded && decoded.userType === 'user') {
            user = await User.findOne({
                _id: decoded.id,
                deleted: false
            }).select("-password");
        } else {
            needsTokenRefresh = true;
        }
    }
    // Check for JWT access token in cookies
    else if (req.cookies.accessToken) {
        const decoded = verifyAccessToken(req.cookies.accessToken);
        
        if (decoded && decoded.userType === 'user') {
            user = await User.findOne({
                _id: decoded.id,
                deleted: false
            }).select("-password");
        } else {
            needsTokenRefresh = true;
        }
    }
    // Fallback to old tokenUser for backward compatibility
    else if (req.cookies.tokenUser) {
        user = await User.findOne({
            tokenUser: req.cookies.tokenUser,
            deleted: false
        }).select("-password");
    }
    
    // Nếu access token hết hạn, thử refresh token
    if (!user && needsTokenRefresh && req.cookies.refreshToken) {
        try {
            const refreshDecoded = verifyRefreshToken(req.cookies.refreshToken);
            
            if (refreshDecoded && refreshDecoded.userType === 'user') {
                // Tìm user và kiểm tra refresh token trong database
                const dbUser = await User.findOne({
                    _id: refreshDecoded.id,
                    refreshToken: req.cookies.refreshToken,
                    refreshTokenExpires: { $gt: new Date() },
                    deleted: false
                }).select("-password");
                
                if (dbUser) {
                    // Tạo token mới
                    const { accessToken, refreshToken } = generateTokenPair(dbUser, 'user');
                    
                    // Cập nhật refresh token trong database
                    await User.updateOne(
                        { _id: dbUser._id },
                        {
                            refreshToken: refreshToken,
                            refreshTokenExpires: getRefreshTokenExpiry(refreshToken)
                        }
                    );
                    
                    // Set cookies mới
                    res.cookie('accessToken', accessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 15 * 60 * 1000 // 15 phút
                    });
                    
                    res.cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
                    });
                    
                    user = dbUser;
                    
                    // Nếu là API request, gửi token mới trong response header
                    if (req.headers.accept && req.headers.accept.includes('application/json')) {
                        res.setHeader('X-New-Access-Token', accessToken);
                    }
                }
            }
        } catch (error) {
            console.error('Refresh token error:', error);
            // Clear invalid tokens
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
        }
    }
    
    if (!user) {
        // Clear any invalid tokens
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('tokenUser');
        
        // If it's an API request, return JSON error
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized access',
                needsLogin: true
            });
        }
        
        res.redirect(`/user/login`);
        return;
    }

    res.locals.user = user;
    next();
}