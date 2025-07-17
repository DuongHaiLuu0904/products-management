import User from '../../models/user.model.js';
import { verifyAccessToken } from '../../helpers/jwt.js';

export async function infoUser(req, res, next) {
    let user = null;
    
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
            }).select('-password');
        }
    }
    // Check for JWT access token in cookies
    else if (req.cookies.accessToken) {
        const decoded = verifyAccessToken(req.cookies.accessToken);
        
        if (decoded && decoded.userType === 'user') {
            user = await User.findOne({
                _id: decoded.id,
                deleted: false
            }).select('-password');
        }
    }
    // Fallback to old tokenUser for backward compatibility
    else if (req.cookies.tokenUser) {
        user = await User.findOne({
            tokenUser: req.cookies.tokenUser,
            deleted: false
        }).select('-password');
    }
    
    if (user) {
        res.locals.user = user;
    } else {
        res.locals.isLogin = false;
    }

    next();
}