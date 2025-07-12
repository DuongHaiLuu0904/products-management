const User = require("../../models/user.model")

module.exports.reuireAuth = async (req, res, next) => {
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
        }).select("-password");
    }
    
    if (!user) {
        res.redirect(`/user/login`);
        return;
    }

    res.locals.user = user;
    next();
}