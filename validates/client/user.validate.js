module.exports.registerPost = async (req, res, next) => {
    if(!req.body.fullName) {
        req.flash('error', 'Vui lòng nhập họ tên!');
        
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
        return
    }

    if(!req.body.email) {
        req.flash('error', 'Vui lòng nhập email!');
        
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

module.exports.loginPost = async (req, res, next) => {
    if(!req.body.email) {
        req.flash('error', 'Vui lòng nhập email!');
        
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

module.exports.resetPasswordPost = async (req, res, next) => {
    if(!req.body.password) {
        req.flash('error', 'Vui lòng nhập mật khẩu!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
        return
    }

    if(!req.body.confirmPassword) {
        req.flash('error', 'Vui lòng xác nhận lại mật khẩu!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
        return
    }

    if(req.body.password != req.body.confirmPassword) {
        req.flash('error', 'Mật khẩu không khớp!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
        return
    }

    next()
}