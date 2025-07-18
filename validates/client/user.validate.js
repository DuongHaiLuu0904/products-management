import validator from 'validator';
import xss from 'xss';
import { 
    sanitizeAndValidate, 
    validateEmail, 
    validatePassword,
    checkDangerousPatterns,
    validateRequestBody,
    checkRateLimit,
    validateFullName as commonValidateFullName
} from './common.validate.js';

// Cấu hình XSS filter cho client
const xssOptions = {
    whiteList: {}, // Không cho phép HTML tags
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    allowCommentTag: false,
    escapeHtml: true
};

// Danh sách các field được phép cho từng endpoint
const ALLOWED_FIELDS = {
    register: ['fullName', 'email', 'password', 'confirmPassword'],
    login: ['email', 'password'],
    edit: ['fullName', 'phone', 'address'],
    changePassword: ['currentPassword', 'newPassword', 'confirmPassword'],
    resetPassword: ['password', 'confirmPassword', 'token'],
    forgotPassword: ['email'],
    otp: ['email', 'otp']
};

/**
 * Validate full name
 * @param {string} fullName 
 * @returns {object}
 */
const validateFullName = (fullName) => {
    // Sử dụng function từ common.validate.js
    return commonValidateFullName(fullName);
};

/**
 * Validate phone number
 * @param {string} phone 
 * @returns {object}
 */
const validatePhone = (phone) => {
    if (!phone) {
        return { isValid: true, value: '' };
    }

    if (typeof phone !== 'string') {
        return { isValid: false, error: 'Số điện thoại không hợp lệ!' };
    }

    const result = sanitizeAndValidate(phone, 20);
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Loại bỏ các ký tự không phải số, +, -, (, ), space
    const cleanPhone = result.value.replace(/[^\d+\-\(\)\s]/g, '');
    
    // Kiểm tra format số điện thoại
    const phoneRegex = /^(\+84|84|0)?[1-9]\d{8,9}$/;
    const normalizedPhone = cleanPhone.replace(/[\s\-\(\)]/g, '');
    
    if (!phoneRegex.test(normalizedPhone)) {
        return { isValid: false, error: 'Số điện thoại không đúng định dạng!' };
    }

    return { isValid: true, value: cleanPhone };
};

/**
 * Validate address
 * @param {string} address 
 * @returns {object}
 */
const validateAddress = (address) => {
    if (!address) {
        return { isValid: true, value: '' };
    }

    if (typeof address !== 'string') {
        return { isValid: false, error: 'Địa chỉ không hợp lệ!' };
    }

    const result = sanitizeAndValidate(address, 500, { minLength: 5 });
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Kiểm tra địa chỉ có chứa ít nhất một ký tự chữ hoặc số
    if (!/[a-zA-Z0-9À-ỹ]/.test(result.value)) {
        return { isValid: false, error: 'Địa chỉ phải chứa ít nhất một ký tự chữ hoặc số!' };
    }

    return { isValid: true, value: result.value.trim() };
};

/**
 * Validate OTP
 * @param {string} otp 
 * @returns {object}
 */
const validateOTP = (otp) => {
    if (!otp || typeof otp !== 'string') {
        return { isValid: false, error: 'Vui lòng nhập mã OTP!' };
    }

    const result = sanitizeAndValidate(otp, 10);
    
    if (!result.isValid) {
        return { isValid: false, error: 'Mã OTP không hợp lệ!' };
    }

    // Kiểm tra OTP chỉ chứa số và có độ dài 6 ký tự
    if (!/^\d{6}$/.test(result.value)) {
        return { isValid: false, error: 'Mã OTP phải là 6 chữ số!' };
    }

    return { isValid: true, value: result.value };
};

/**
 * Validate token (reset password, etc.)
 * @param {string} token 
 * @returns {object}
 */
const validateToken = (token) => {
    if (!token || typeof token !== 'string') {
        return { isValid: false, error: 'Token không hợp lệ!' };
    }

    const result = sanitizeAndValidate(token, 255);
    
    if (!result.isValid) {
        return { isValid: false, error: 'Token không hợp lệ!' };
    }

    // Kiểm tra token format (base64, hex, hoặc alphanumeric)
    if (!/^[a-zA-Z0-9+\/=_-]{20,255}$/.test(result.value)) {
        return { isValid: false, error: 'Token không đúng định dạng!' };
    }

    return { isValid: true, value: result.value };
};

/**
 * Rate limiting cho từng action
 * @param {object} req 
 * @param {string} action 
 * @returns {boolean}
 */
const checkActionRateLimit = (req, action) => {
    const clientKey = req.ip || 'unknown';
    const limits = {
        register: { limit: 3, window: 300000 }, // 3 lần trong 5 phút
        login: { limit: 5, window: 300000 },    // 5 lần trong 5 phút
        forgotPassword: { limit: 3, window: 3600000 }, // 3 lần trong 1 giờ
        changePassword: { limit: 5, window: 300000 } // 5 lần trong 5 phút
    };

    const config = limits[action] || { limit: 10, window: 300000 };
    return checkRateLimit(`${action}_${clientKey}`, config.limit, config.window);
};

/**
 * Redirect với error message an toàn
 * @param {object} req 
 * @param {object} res 
 * @param {string} message 
 */
const redirectWithError = (req, res, message) => {
    req.flash('error', message);
    const backURL = validator.isURL(req.get("Referrer") || '', { 
        require_host: false,
        allow_protocol_relative_urls: false 
    }) ? req.get("Referrer") : "/";
    res.redirect(backURL);
};

export async function registerPost(req, res, next) {
    try {
        // Rate limiting
        if (!checkActionRateLimit(req, 'register')) {
            return redirectWithError(req, res, 'Quá nhiều lần đăng ký. Vui lòng thử lại sau!');
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_FIELDS.register, 10);
        if (!bodyValidation.isValid) {
            return redirectWithError(req, res, 'Dữ liệu không hợp lệ!');
        }

        const { fullName, email, password, confirmPassword } = bodyValidation.body;

        // Validate full name
        const fullNameResult = validateFullName(fullName);
        if (!fullNameResult.isValid) {
            return redirectWithError(req, res, fullNameResult.error);
        }

        // Validate email
        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            return redirectWithError(req, res, emailResult.errors.join(', '));
        }

        // Validate password
        const passwordResult = validatePassword(password, {
            minLength: 6,
            maxLength: 128,
            requireSpecialChar: false,
            requireNumber: false,
            requireUppercase: false
        });
        if (!passwordResult.isValid) {
            return redirectWithError(req, res, passwordResult.errors.join(', '));
        }

        // Validate confirm password
        if (!confirmPassword || typeof confirmPassword !== 'string') {
            return redirectWithError(req, res, 'Vui lòng xác nhận mật khẩu!');
        }

        if (password !== confirmPassword) {
            return redirectWithError(req, res, 'Mật khẩu không khớp!');
        }

        // Gán dữ liệu đã validate
        req.validatedBody = {
            fullName: fullNameResult.value,
            email: emailResult.value,
            password: passwordResult.value
        };

        next();
    } catch (error) {
        console.error('Register validation error:', error);
        return redirectWithError(req, res, 'Lỗi hệ thống!');
    }
}

export async function loginPost(req, res, next) {
    try {
        // Rate limiting
        if (!checkActionRateLimit(req, 'login')) {
            return redirectWithError(req, res, 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau!');
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_FIELDS.login, 5);
        if (!bodyValidation.isValid) {
            return redirectWithError(req, res, 'Dữ liệu không hợp lệ!');
        }

        const { email, password } = bodyValidation.body;

        // Validate email
        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            return redirectWithError(req, res, emailResult.errors.join(', '));
        }

        // Validate password (basic check for login)
        if (!password || typeof password !== 'string') {
            return redirectWithError(req, res, 'Vui lòng nhập mật khẩu!');
        }

        if (password.length < 1 || password.length > 128) {
            return redirectWithError(req, res, 'Mật khẩu không hợp lệ!');
        }

        // Kiểm tra các pattern nguy hiểm trong password
        if (checkDangerousPatterns(password)) {
            return redirectWithError(req, res, 'Mật khẩu chứa ký tự không được phép!');
        }

        // Gán dữ liệu đã validate
        req.validatedBody = {
            email: emailResult.value,
            password: password // Không sanitize password cho login
        };

        next();
    } catch (error) {
        console.error('Login validation error:', error);
        return redirectWithError(req, res, 'Lỗi hệ thống!');
    }
}

export async function resetPasswordPost(req, res, next) {
    try {
        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_FIELDS.resetPassword, 5);
        if (!bodyValidation.isValid) {
            return redirectWithError(req, res, 'Dữ liệu không hợp lệ!');
        }

        const { password, confirmPassword, token } = bodyValidation.body;

        // Validate token
        const tokenResult = validateToken(token);
        if (!tokenResult.isValid) {
            return redirectWithError(req, res, tokenResult.error);
        }

        // Validate password
        const passwordResult = validatePassword(password, {
            minLength: 6,
            maxLength: 128,
            requireSpecialChar: false,
            requireNumber: false,
            requireUppercase: false
        });
        if (!passwordResult.isValid) {
            return redirectWithError(req, res, passwordResult.errors.join(', '));
        }

        // Validate confirm password
        if (!confirmPassword || typeof confirmPassword !== 'string') {
            return redirectWithError(req, res, 'Vui lòng xác nhận lại mật khẩu!');
        }

        if (password !== confirmPassword) {
            return redirectWithError(req, res, 'Mật khẩu không khớp!');
        }

        // Gán dữ liệu đã validate
        req.validatedBody = {
            password: passwordResult.value,
            token: tokenResult.value
        };

        next();
    } catch (error) {
        console.error('Reset password validation error:', error);
        return redirectWithError(req, res, 'Lỗi hệ thống!');
    }
}

export async function editPost(req, res, next) {
    try {
        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_FIELDS.edit, 10);
        if (!bodyValidation.isValid) {
            return redirectWithError(req, res, 'Dữ liệu không hợp lệ!');
        }

        const { fullName, phone, address } = bodyValidation.body;

        // Validate full name (required)
        const fullNameResult = validateFullName(fullName);
        if (!fullNameResult.isValid) {
            return redirectWithError(req, res, fullNameResult.error);
        }

        // Validate phone (optional)
        const phoneResult = validatePhone(phone);
        if (!phoneResult.isValid) {
            return redirectWithError(req, res, phoneResult.error);
        }

        // Validate address (optional)
        const addressResult = validateAddress(address);
        if (!addressResult.isValid) {
            return redirectWithError(req, res, addressResult.error);
        }

        // Gán dữ liệu đã validate
        req.validatedBody = {
            fullName: fullNameResult.value,
            phone: phoneResult.value,
            address: addressResult.value
        };

        next();
    } catch (error) {
        console.error('Edit profile validation error:', error);
        return redirectWithError(req, res, 'Lỗi hệ thống!');
    }
}

export async function changePasswordPost(req, res, next) {
    try {
        // Rate limiting
        if (!checkActionRateLimit(req, 'changePassword')) {
            return redirectWithError(req, res, 'Quá nhiều lần đổi mật khẩu. Vui lòng thử lại sau!');
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_FIELDS.changePassword, 5);
        if (!bodyValidation.isValid) {
            return redirectWithError(req, res, 'Dữ liệu không hợp lệ!');
        }

        const { currentPassword, newPassword, confirmPassword } = bodyValidation.body;

        // Validate current password
        if (!currentPassword || typeof currentPassword !== 'string') {
            return redirectWithError(req, res, 'Vui lòng nhập mật khẩu hiện tại!');
        }

        if (currentPassword.length < 1 || currentPassword.length > 128) {
            return redirectWithError(req, res, 'Mật khẩu hiện tại không hợp lệ!');
        }

        if (checkDangerousPatterns(currentPassword)) {
            return redirectWithError(req, res, 'Mật khẩu hiện tại chứa ký tự không được phép!');
        }

        // Validate new password
        const newPasswordResult = validatePassword(newPassword, {
            minLength: 6,
            maxLength: 128,
            requireSpecialChar: false,
            requireNumber: false,
            requireUppercase: false
        });
        if (!newPasswordResult.isValid) {
            return redirectWithError(req, res, newPasswordResult.errors.join(', '));
        }

        // Validate confirm password
        if (!confirmPassword || typeof confirmPassword !== 'string') {
            return redirectWithError(req, res, 'Vui lòng xác nhận lại mật khẩu mới!');
        }

        if (newPassword !== confirmPassword) {
            return redirectWithError(req, res, 'Mật khẩu mới không khớp!');
        }

        // Kiểm tra mật khẩu mới không giống mật khẩu cũ
        if (currentPassword === newPassword) {
            return redirectWithError(req, res, 'Mật khẩu mới phải khác mật khẩu hiện tại!');
        }

        // Gán dữ liệu đã validate
        req.validatedBody = {
            currentPassword: currentPassword, // Không sanitize password
            newPassword: newPasswordResult.value
        };

        next();
    } catch (error) {
        console.error('Change password validation error:', error);
        return redirectWithError(req, res, 'Lỗi hệ thống!');
    }
}

// Validate forgot password
export async function forgotPasswordPost(req, res, next) {
    try {
        // Rate limiting
        if (!checkActionRateLimit(req, 'forgotPassword')) {
            return redirectWithError(req, res, 'Quá nhiều yêu cầu quên mật khẩu. Vui lòng thử lại sau!');
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_FIELDS.forgotPassword, 3);
        if (!bodyValidation.isValid) {
            return redirectWithError(req, res, 'Dữ liệu không hợp lệ!');
        }

        const { email } = bodyValidation.body;

        // Validate email
        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            return redirectWithError(req, res, emailResult.errors.join(', '));
        }

        // Gán dữ liệu đã validate
        req.validatedBody = {
            email: emailResult.value
        };

        next();
    } catch (error) {
        console.error('Forgot password validation error:', error);
        return redirectWithError(req, res, 'Lỗi hệ thống!');
    }
}

// Validate OTP password GET
export async function otpPassword(req, res, next) {
    try {
        const { email } = req.query;

        if (!email) {
            return res.redirect('/user/password/forgot');
        }

        // Validate email từ query
        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            return res.redirect('/user/password/forgot');
        }

        req.validatedQuery = {
            email: emailResult.value
        };

        next();
    } catch (error) {
        console.error('OTP password GET validation error:', error);
        return res.redirect('/user/password/forgot');
    }
}

// Validate OTP password POST
export async function otpPasswordPost(req, res, next) {
    try {
        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_FIELDS.otp, 5);
        if (!bodyValidation.isValid) {
            return redirectWithError(req, res, 'Dữ liệu không hợp lệ!');
        }

        const { email, otp } = bodyValidation.body;

        // Validate email
        const emailResult = validateEmail(email);
        if (!emailResult.isValid) {
            return redirectWithError(req, res, emailResult.errors.join(', '));
        }

        // Validate OTP
        const otpResult = validateOTP(otp);
        if (!otpResult.isValid) {
            return redirectWithError(req, res, otpResult.error);
        }

        // Gán dữ liệu đã validate
        req.validatedBody = {
            email: emailResult.value,
            otp: otpResult.value
        };

        next();
    } catch (error) {
        console.error('OTP password POST validation error:', error);
        return redirectWithError(req, res, 'Lỗi hệ thống!');
    }
}

// Validate reset password GET
export async function resetPassword(req, res, next) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.redirect('/user/password/forgot');
        }

        // Validate token từ query
        const tokenResult = validateToken(token);
        if (!tokenResult.isValid) {
            return res.redirect('/user/password/forgot');
        }

        req.validatedQuery = {
            token: tokenResult.value
        };

        next();
    } catch (error) {
        console.error('Reset password GET validation error:', error);
        return res.redirect('/user/password/forgot');
    }
}

// Validate avatar upload
export async function validateAvatarUpload(req, res, next) {
    try {
        if (!req.file) {
            return next(); // Không có file upload, bỏ qua
        }

        const file = req.file;

        // Kiểm tra file size (2MB)
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            return redirectWithError(req, res, 'File avatar quá lớn (tối đa 2MB)!');
        }

        // Kiểm tra file type
        const allowedMimes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp'
        ];

        if (!allowedMimes.includes(file.mimetype)) {
            return redirectWithError(req, res, 'File avatar phải là hình ảnh (JPG, PNG, GIF, WebP)!');
        }

        // Kiểm tra filename
        const filenameResult = sanitizeAndValidate(file.originalname, 255);
        if (!filenameResult.isValid) {
            return redirectWithError(req, res, 'Tên file không hợp lệ!');
        }

        // Kiểm tra file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = allowedExtensions.some(ext => 
            file.originalname.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
            return redirectWithError(req, res, 'File phải có đuôi hợp lệ (.jpg, .png, .gif, .webp)!');
        }

        next();

    } catch (error) {
        console.error('Avatar upload validation error:', error);
        return redirectWithError(req, res, 'Lỗi hệ thống khi validate file upload!');
    }
}

// Alias cho các function cũ để tương thích
export const _registerPost = registerPost;
export const _changePasswordPost = changePasswordPost;
export const _editPost = validateAvatarUpload;