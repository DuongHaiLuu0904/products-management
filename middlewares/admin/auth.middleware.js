import Account from "../../models/account.model.js"
import Role from "../../models/role.model.js"
import { verifyAccessToken } from "../../helpers/jwt.js"

import { prefixAdmin } from "../../config/system.js"

export async function reuireAuth(req, res, next) {
    let user = null;
    
    // Check for JWT access token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.substring(7);
        const decoded = verifyAccessToken(token);
        
        if (decoded && decoded.userType === 'account') {
            user = await Account.findOne({
                _id: decoded.id,
                deleted: false
            }).select("-password");
        }
    }
    // Check for JWT access token in cookies
    else if (req.cookies.accessToken) {
        const decoded = verifyAccessToken(req.cookies.accessToken);
        
        if (decoded && decoded.userType === 'account') {
            user = await Account.findOne({
                _id: decoded.id,
                deleted: false
            }).select("-password");
        }
    }
    // Fallback to old token for backward compatibility
    else if (req.cookies.token) {
        user = await Account.findOne({
            token: req.cookies.token,
            deleted: false
        }).select("-password");
    }

    if (!user) {
        // If it's an API request, return JSON error
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized access' 
            });
        }
        
        return res.redirect(`${prefixAdmin}/auth/login`);
    }

    const role = await Role.findOne({
        _id: user.role_id
    }).select("title permissions"); 

    res.locals.user = user;
    res.locals.role = role;
    next();
}