const User = require('../../models/user.model')
const forgotPassword = require('../../models/forgot-password.model')
const Cart = require('../../models/cart.model')

const md5 = require('md5')
const generate = require('../../helpers/generate')
const sendMailHelper = require('../../helpers/sendMail')

//[GET] /register
module.exports.register = async (req, res) => {
   
    res.render('client/pages/user/register', {
        title: 'Register'
    })
}

//[POST] /register
module.exports.registerPost = async (req, res) => {
    
    const exitsEmail = await User.findOne({
        email: req.body.email,
        deleted: false
    })

    if(exitsEmail) {
        req.flash('error', 'Email đã tồn tại')
        return res.redirect(req.headers.referer)
    }

    req.body.password = md5(req.body.password)
    const user = new User(req.body)
    await user.save()

    res.cookie('tokenUser', user.tokenUser)

    res.redirect('/')
}

//[GET] /login
module.exports.login = async (req, res) => {
    
    res.render('client/pages/user/login', {
        title: 'Login'
    })
}

//[POST] /login
module.exports.loginPost = async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    const user = await User.findOne({
        email: email,
        deleted: false
    })

    if(!user) {
        req.flash('error', 'Email không tồn tại')
        return  res.redirect(req.headers.referer)  
    }
    if(md5(password) !== user.password) {
        req.flash('error', 'Mật khẩu không đúng')
        return  res.redirect(req.headers.referer)  
    }
    if(user.status == 'inactive') {
        req.flash('error', 'Tài khoản đã bị khóa')
        return  res.redirect(req.headers.referer)  
    }

    res.cookie('tokenUser', user.tokenUser)

    // Lưu userId và collection cart 
    await Cart.updateOne(
        {
            _id: req.cookies.cartId
        },
        {
            user_id: user.id
        }
    )

    res.redirect('/')
}

//[GET] /logout
module.exports.logout = async (req, res) => {
    res.clearCookie('tokenUser')
    res.redirect('/')
}

//[GET] /password/forgot
module.exports.forgotPassword = async (req, res) => {
    
    res.render('client/pages/user/forgot-password', {
        title: 'Quên mật khẩu'
    })
}

//[POST] /password/forgot
module.exports.forgotPasswordPost = async (req, res) => {
    const email = req.body.email
    const user = await User.findOne({
        email: email,
        deleted: false
    })

    if(!user) {
        req.flash('error', 'Email không tồn tại')
        return res.redirect(req.headers.referer)  
    }

    // Tạo mã otp và lưu Otp, email vào db
    const otp = generate.generateRamdomNumber(6)

    const objectForgotPassword = {
        email: email,
        otp: otp,
        expriredAt: Date.now() 
    }

    const forgotPasswordData = await forgotPassword(objectForgotPassword)
    await forgotPasswordData.save()

    // Gửi Otp qua email
    const subject = 'Xác thực OTP'
    const html = `
        <h1>Xác thực OTP</h1>
        <p>Mã OTP của bạn là: <strong>${otp}</strong></p>
        <p>Vui lòng không chia sẻ mã OTP này với bất kỳ ai.</p>
    `

    sendMailHelper.sendMail(email, subject, html)
    req.flash('success', 'Mã OTP đã được gửi đến email của bạn')

    res.redirect(`/user/password/otp?email=${email}`)
}

//[GET] /password/otp
module.exports.otpPassword = async (req, res) => {
    const email = req.query.email

    res.render('client/pages/user/otp-password', {
        title: 'Xác thực OTP',
        email: email
    })
}

//[POST] /password/otp
module.exports.otpPasswordPost = async (req, res) => {
    const email = req.body.email
    const otp = req.body.otp

    const forgotPasswordData = await forgotPassword.findOne({
        email: email,
        otp: otp
    })

    if(!forgotPasswordData) {
        req.flash('error', 'Mã OTP không đúng hoặc đã hết hạn')
        return res.redirect(req.headers.referer)  
    }

    const user = await User.findOne({
        email: email,
        deleted: false
    })

    res.cookie('tokenUser', user.tokenUser)

    res.redirect(`/user/password/reset?email=${email}`)
}

//[GET] /password/reset
module.exports.resetPassword = async (req, res) => {
    const email = req.query.email

    res.render('client/pages/user/reset-password', {
        title: 'Đặt lại mật khẩu',
        email: email
    })
}

//[POST] /password/reset
module.exports.resetPasswordPost = async (req, res) => {
    const password = req.body.password
    const tokenUser = req.cookies.tokenUser
   
    await User.updateOne(
        {
            tokenUser: tokenUser
        },
        {
            password: md5(password)
        }
    )
    
    res.redirect('/user/login')
    req.flash('success', 'Đặt lại mật khẩu thành công')
}

//[GET] /info
module.exports.info = async (req, res) => {
    
    res.render('client/pages/user/info', {
        title: 'Thông tin tài khoản'
    })
}