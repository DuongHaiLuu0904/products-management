const User = require('../../models/user.model')
const forgotPassword = require('../../models/forgot-password.model')
const Cart = require('../../models/cart.model')

const md5 = require('md5')
const generate = require('../../helpers/generate')
const sendMailHelper = require('../../helpers/sendMail')
const { generateTokenPair, getRefreshTokenExpiry } = require('../../helpers/jwt')
const passport = require('passport')

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

    // Tạo JWT tokens
    const { accessToken, refreshToken } = generateTokenPair(user, 'user');
    
    // Lưu refresh token vào database
    await User.updateOne(
        { _id: user._id },
        {
            refreshToken: refreshToken,
            refreshTokenExpires: getRefreshTokenExpiry(refreshToken)
        }
    );

    // Set cookies
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 phút
    });
    
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });

    res.redirect('/')
}

//[GET] /login
module.exports.login = async (req, res) => {
    
    res.render('client/pages/user/login', {
        title: 'Login'
    })
}

//[POST] /login
module.exports.loginPost = async (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', info.message);
            return res.redirect(req.headers.referer);
        }
        
        try {
            // Tạo JWT tokens
            const { accessToken, refreshToken } = generateTokenPair(user, 'user');
            
            // Lưu refresh token vào database
            await User.updateOne(
                { _id: user._id },
                {
                    refreshToken: refreshToken,
                    refreshTokenExpires: getRefreshTokenExpiry(refreshToken)
                }
            );

            // Set cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 phút
            });
            
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
            });
            
            // Login with passport for session support
            req.logIn(user, async (err) => {
                if (err) {
                    console.error('Passport login error:', err);
                }
                
                // Lưu userId và collection cart 
                if (req.cookies.cartId) {
                    await Cart.updateOne(
                        {
                            _id: req.cookies.cartId
                        },
                        {
                            user_id: user.id
                        }
                    );
                }
                
                // Check if it's an API request
                if (req.headers.accept && req.headers.accept.includes('application/json')) {
                    return res.json({
                        success: true,
                        message: 'Login successful',
                        tokens: {
                            accessToken,
                            expiresIn: 15 * 60
                        }
                    });
                }
                
                res.redirect('/');
            });
        } catch (error) {
            console.error('Login error:', error);
            req.flash('error', 'Có lỗi xảy ra khi đăng nhập');
            return res.redirect(req.headers.referer);
        }
    })(req, res, next);
}

//[GET] /logout
module.exports.logout = async (req, res) => {
    try {
        // Clear refresh token from database
        if (req.cookies.refreshToken || res.locals.user) {
            const userId = res.locals.user ? res.locals.user._id : null;
            
            if (userId) {
                await User.updateOne(
                    { _id: userId },
                    {
                        refreshToken: null,
                        refreshTokenExpires: null
                    }
                );
            }
        }
        
        // Logout from passport session
        if (req.logout) {
            req.logout((err) => {
                if (err) {
                    console.error('Logout error:', err);
                }
            });
        }
        
        // Clear all authentication cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('tokenUser'); // For backward compatibility
        
        // Check if it's an API request
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({
                success: true,
                message: 'Logout successful'
            });
        }
        
        res.redirect('/');
    } catch (error) {
        console.error('Logout error:', error);
        res.redirect('/');
    }
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

//[GET] /edit
module.exports.edit = async (req, res) => {
    
    res.render('client/pages/user/edit-info', {
        title: 'Chỉnh sửa thông tin'
    })
}

//[POST] /edit
module.exports.editPost = async (req, res) => {
    try {
        const user = res.locals.user
        
        const updateData = {
            fullName: req.body.fullName,
            phone: req.body.phone,
            address: req.body.address
        }

        await User.updateOne(
            {
                _id: user.id,
                deleted: false
            },
            updateData
        )

        req.flash('success', 'Cập nhật thông tin thành công!')
        res.redirect('/user/info')
    } catch (error) {
        req.flash('error', 'Có lỗi xảy ra khi cập nhật thông tin!')
        res.redirect('back')
    }
}

//[GET] /change-password
module.exports.changePassword = async (req, res) => {
    
    res.render('client/pages/user/change-password', {
        title: 'Đổi mật khẩu'
    })
}

//[POST] /change-password
module.exports.changePasswordPost = async (req, res) => {
    try {
        const user = res.locals.user
        const { currentPassword, newPassword } = req.body

        // Kiểm tra mật khẩu hiện tại
        const userPassword = await User.findOne({
            _id: user.id,
            password: md5(currentPassword),
            deleted: false
        })

        if (!userPassword) {
            req.flash('error', 'Mật khẩu hiện tại không đúng!')
            return res.redirect('back')
        }

        // Cập nhật mật khẩu mới
        await User.updateOne(
            {
                _id: user.id,
                deleted: false
            },
            {
                password: md5(newPassword)
            }
        )

        req.flash('success', 'Đổi mật khẩu thành công!')
        res.redirect('/user/info')
    } catch (error) {
        req.flash('error', 'Có lỗi xảy ra khi đổi mật khẩu!')
        res.redirect('back')
    }
}

// Google OAuth Routes
//[GET] /auth/google
module.exports.googleAuth = (req, res, next) => {
    try {
        return passport.authenticate('google', {
            scope: ['profile', 'email']
        })(req, res, next);
    } catch (error) {
        req.flash('error', 'Google OAuth không khả dụng');
        return res.redirect('/user/login');
    }
};

//[GET] /auth/google/callback
module.exports.googleCallback = async (req, res, next) => {
    passport.authenticate('google', async (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', 'Đăng nhập Google thất bại');
            return res.redirect('/user/login');
        }
        
        try {
            // Tạo JWT tokens
            const { accessToken, refreshToken } = generateTokenPair(user, 'user');
            
            // Lưu refresh token vào database
            await User.updateOne(
                { _id: user._id },
                {
                    refreshToken: refreshToken,
                    refreshTokenExpires: getRefreshTokenExpiry(refreshToken)
                }
            );

            // Set cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 phút
            });
            
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
            });
            
            req.logIn(user, async (err) => {
                if (err) {
                    console.error('Passport login error:', err);
                }
                
                // Lưu userId và collection cart 
                if (req.cookies.cartId) {
                    await Cart.updateOne(
                        {
                            _id: req.cookies.cartId
                        },
                        {
                            user_id: user.id
                        }
                    );
                }
                
                res.redirect('/');
            });
        } catch (error) {
            console.error('Google OAuth error:', error);
            req.flash('error', 'Có lỗi xảy ra khi đăng nhập với Google');
            return res.redirect('/user/login');
        }
    })(req, res, next);
}

// GitHub OAuth Routes
//[GET] /auth/github
module.exports.githubAuth = (req, res, next) => {
    try {
        return passport.authenticate('github', {
            scope: ['user:email']
        })(req, res, next);
    } catch (error) {
        req.flash('error', 'GitHub OAuth không khả dụng');
        return res.redirect('/user/login');
    }
};

//[GET] /auth/github/callback
module.exports.githubCallback = async (req, res, next) => {
    passport.authenticate('github', async (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', 'Đăng nhập GitHub thất bại');
            return res.redirect('/user/login');
        }
        
        try {
            // Tạo JWT tokens
            const { accessToken, refreshToken } = generateTokenPair(user, 'user');
            
            // Lưu refresh token vào database
            await User.updateOne(
                { _id: user._id },
                {
                    refreshToken: refreshToken,
                    refreshTokenExpires: getRefreshTokenExpiry(refreshToken)
                }
            );

            // Set cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 phút
            });
            
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
            });
            
            req.logIn(user, async (err) => {
                if (err) {
                    console.error('Passport login error:', err);
                }
                
                // Lưu userId và collection cart 
                if (req.cookies.cartId) {
                    await Cart.updateOne(
                        {
                            _id: req.cookies.cartId
                        },
                        {
                            user_id: user.id
                        }
                    );
                }
                
                res.redirect('/');
            });
        } catch (error) {
            console.error('GitHub OAuth error:', error);
            req.flash('error', 'Có lỗi xảy ra khi đăng nhập với GitHub');
            return res.redirect('/user/login');
        }
    })(req, res, next);
}