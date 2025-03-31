const User = require("../../models/user.model")

module.exports.reuireAuth = async (req, res, next) => {
    if(!req.cookies.tokenUser) {
        res.redirect(`user/login`)
        return
    } 
    
    const user = await User.findOne({
        token: req.cookies.token,
        deleted: false
    }).select("-password")

    if(!user) {
        res.redirect(`user/login`)
    } 

    next()
}