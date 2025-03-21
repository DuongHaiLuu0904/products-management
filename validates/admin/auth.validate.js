module.exports.loginPost = async (req, res, next) => {
    if(!req.body.email) {
        req.flash('error', 'Vui lòng nhập Email!');
        
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
        return
    }

    if(!req.body.password) {
        req.flash('error', 'Vui lòng nhập mật khẩu!');
        
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
        return
    }

    next()
}