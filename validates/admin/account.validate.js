module.exports.createPost = async (req, res, next) => {
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

module.exports.createPatch= async (req, res, next) => {
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

    next()
}