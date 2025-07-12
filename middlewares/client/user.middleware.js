const User = require('../../models/user.model')

module.exports.infoUser = async (req, res, next) => {
    let user = null;
    
    // Check for passport session first
    if (req.user) {
        user = req.user;
    }
    // Then check for token in cookies
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