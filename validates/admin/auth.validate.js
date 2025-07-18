import { 
    validateEmail, 
    validatePassword, 
    validateRequestMeta, 
    validateRequestBody,
    checkRateLimit,
    commonValidationMiddleware 
} from './common.validate.js';

// Middleware validation chung cho tất cả auth requests
export const validateRequest = commonValidationMiddleware;

export async function loginPost(req, res, next) {
    try {
        const errors = [];
        const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        
        // Rate limiting cho login attempts (5 attempts per 15 minutes)
        if (!checkRateLimit(`login_${clientIP}`, 5, 15 * 60 * 1000)) {
            console.warn('Login rate limit exceeded:', { ip: clientIP, timestamp: new Date().toISOString() });
            req.flash('error', 'Quá nhiều lần thử đăng nhập! Vui lòng thử lại sau 15 phút.');
            return res.redirect('/admin/auth/login');
        }
        
        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ['email', 'password', '_token'], 5);
        if (!bodyValidation.isValid) {
            errors.push(...bodyValidation.errors);
        } else {
            req.body = bodyValidation.body;
        }
        
        // Validate email
        if (!req.body.email) {
            errors.push('Email là bắt buộc!');
        } else {
            const emailValidation = validateEmail(req.body.email);
            if (!emailValidation.isValid) {
                errors.push(...emailValidation.errors);
            } else {
                req.body.email = emailValidation.value;
            }
        }
        
        // Validate password
        if (!req.body.password) {
            errors.push('Mật khẩu là bắt buộc!');
        } else {
            const passwordValidation = validatePassword(req.body.password, {
                minLength: 6,
                maxLength: 128
            });
            if (!passwordValidation.isValid) {
                errors.push(...passwordValidation.errors);
            }
        }
        
        // Validate CSRF token nếu có
        if (req.body._token) {
            const token = req.body._token;
            if (typeof token !== 'string' || token.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
                errors.push('Token bảo mật không hợp lệ!');
            }
        }
        
        // Kiểm tra Origin và Referer để tránh CSRF
        const origin = req.get('Origin');
        const referer = req.get('Referer');
        const host = req.get('Host');
        
        if (origin && host) {
            try {
                const originUrl = new URL(origin);
                if (originUrl.host !== host) {
                    errors.push('Yêu cầu không hợp lệ!');
                }
            } catch (e) {
                errors.push('Origin không hợp lệ!');
            }
        }
        
        // Validate User-Agent để chống bot cơ bản
        const userAgent = req.get('User-Agent');
        if (!userAgent || userAgent.length < 10 || 
            /bot|crawler|spider|scraper/i.test(userAgent)) {
            console.warn('Suspicious user agent:', userAgent, 'IP:', clientIP);
        }
        
        // Nếu có lỗi, log và redirect
        if (errors.length > 0) {
            // Log failed attempt với thông tin chi tiết
            console.warn('Login validation failed:', {
                ip: clientIP,
                userAgent: req.get('User-Agent'),
                referer: req.get('Referer'),
                email: req.body.email ? req.body.email.substring(0, 3) + '***' : 'not provided',
                errors: errors,
                timestamp: new Date().toISOString()
            });
            
            // Rate limiting cho failed attempts (tăng cường bảo mật)
            if (!checkRateLimit(`failed_login_${clientIP}`, 3, 5 * 60 * 1000)) {
                console.error('Too many failed login attempts:', { ip: clientIP });
                req.flash('error', 'Quá nhiều lần đăng nhập sai! Tài khoản tạm thời bị khóa.');
                return res.redirect('/admin/auth/login');
            }
            
            req.flash('error', errors[0]); // Chỉ hiển thị lỗi đầu tiên để không leak thông tin
            
            // Làm sạch và validate Referrer URL
            let backURL = '/admin/auth/login';
            const referrer = req.get("Referrer");
            if (referrer) {
                try {
                    const url = new URL(referrer);
                    // Chỉ cho phép redirect trong cùng host
                    if (url.host === req.get('host') && url.pathname.startsWith('/admin')) {
                        backURL = url.pathname;
                    }
                } catch (e) {
                    // URL không hợp lệ, dùng default
                }
            }
            
            return res.redirect(backURL);
        }
        
        next();
        
    } catch (error) {
        console.error('Login validation error:', error);
        req.flash('error', 'Có lỗi xảy ra trong quá trình xác thực!');
        res.redirect('/admin/auth/login');
    }
}