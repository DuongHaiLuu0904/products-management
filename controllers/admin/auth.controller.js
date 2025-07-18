import md5 from 'md5'
import Account from '../../models/account.model.js'
import { prefixAdmin } from '../../config/system.js'
import { generateTokenPair, getRefreshTokenExpiry } from '../../helpers/jwt.js'


// [GET] /auth/login
export async function login(req, res) {
    if(req.cookies.token) {
        res.redirect(prefixAdmin + '/dashboard')
    } else {
        res.render('admin/pages/auth/login', {
            title: 'Login'
        })
    }
    
}

// [POST] /auth/login
export async function loginPost(req, res) {
    const email = req.body.email
    const password = req.body.password

    const user = await Account.findOne({
        email: email,
        deleted: false
    })

    if(!user) {
        req.flash('error', 'Tài khoản không tồn tại')
        return res.redirect(prefixAdmin + '/auth/login')
    }

    const hashedPassword = md5(password)
    if(hashedPassword !== user.password) {
        req.flash('error', 'Mật khẩu không đúng')
        return res.redirect(prefixAdmin + '/auth/login')
    }

    if(user.status == 'inactive') {
        req.flash('error', 'Tài khoản bị khóa')
        return res.redirect(prefixAdmin + '/auth/login')
    }

    try {
        // Tạo JWT tokens
        const { accessToken, refreshToken } = generateTokenPair(user, 'account');
        
        // Lưu refresh token vào database
        await Account.updateOne(
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
        
        res.redirect(prefixAdmin + '/dashboard')
    } catch (error) {
        console.error('Admin login error:', error);
        req.flash('error', 'Có lỗi xảy ra khi đăng nhập');
        return res.redirect(prefixAdmin + '/auth/login');
    }
}

// [GET] /auth/logout
export async function logout(req, res) {
    try {
        // Clear refresh token from database
        if (req.cookies.refreshToken || res.locals.user) {
            const userId = res.locals.user ? res.locals.user._id : null;
            
            if (userId) {
                await Account.updateOne(
                    { _id: userId },
                    {
                        refreshToken: null,
                        refreshTokenExpires: null
                    }
                );
            }
        }
        
        // Clear all authentication cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('token'); // For backward compatibility
        
        // Check if it's an API request
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({
                success: true,
                message: 'Logout successful'
            });
        }
        
        req.flash('success', 'Đăng xuất thành công');
        res.redirect(prefixAdmin + '/auth/login');
    } catch (error) {
        console.error('Admin logout error:', error);
        res.redirect(prefixAdmin + '/auth/login');
    }
}