const md5 = require('md5')
const Account = require('../../models/account.model')
const systemconfig = require('../../config/system')


// [GET] /auth/login
module.exports.login = async (req, res) => {
    if(req.cookies.token) {
        res.redirect(systemconfig.prefixAdmin + '/dashboard')
    } else {
        res.render('admin/pages/auth/login', {
            title: 'Login'
        })
    }
    
}

// [POST] /auth/login
module.exports.loginPost = async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    const user = await Account.findOne({
        email: email,
        deleted: false
    })

    if(!user) {
        req.flash('error', 'Tài khoản không tồn tại')
        return res.redirect(systemconfig.prefixAdmin + '/auth/login')
    }

    if(md5(password) !== user.password) {
        req.flash('error', 'Mật khẩu không đúng')
        return res.redirect(systemconfig.prefixAdmin + '/auth/login')
    }

    if(user.status == 'inactive') {
        req.flash('error', 'Tài khoản bị khóa')
        return res.redirect(systemconfig.prefixAdmin + '/auth/login')
    }

    res.cookie('token', user.token)
    
    res.redirect(systemconfig.prefixAdmin + '/dashboard')
}

// [GET] /auth/logout
module.exports.logout = async (req, res) => {
    res.clearCookie('token')
    req.flash('success', 'Đăng xuất thành công')
    res.redirect(systemconfig.prefixAdmin + '/auth/login')
}