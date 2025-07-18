import validator from 'validator';
import xss from 'xss';

// Cấu hình XSS filter nghiêm ngặt cho client
const xssOptions = {
    whiteList: {}, // Không cho phép bất kỳ HTML tag nào
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    allowCommentTag: false,
    escapeHtml: true
};

// Danh sách các pattern nguy hiểm cần kiểm tra cho client
const dangerousPatterns = [
    // Script injection
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /data:application\/javascript/gi,
    
    // Event handlers
    /on\w+\s*=/gi,
    
    // HTML elements nguy hiểm
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi,
    /<style/gi,
    /<form/gi,
    
    // JavaScript functions
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /Function\s*\(/gi,
    /window\./gi,
    /document\./gi,
    /alert\s*\(/gi,
    /confirm\s*\(/gi,
    /prompt\s*\(/gi,
    
    // SQL Injection patterns
    /union\s+select/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    /update\s+set/gi,
    /drop\s+table/gi,
    /exec\s*\(/gi,
    
    // Command injection
    /system\s*\(/gi,
    /exec\s*\(/gi,
    /shell_exec/gi,
    /passthru/gi,
    /`.*`/g,
    
    // Path traversal
    /\.\.\//g,
    /\.\.[\\/]/g,
    
    // Null bytes
    /[\x00]/g,
    
    // LDAP injection
    /\(\|\(/g,
    /\)\(\|/g
];

/**
 * Làm sạch và validate input string cho client
 * @param {string} input - Input cần validate
 * @param {number} maxLength - Độ dài tối đa
 * @param {object} options - Tùy chọn validate
 * @returns {object} {isValid: boolean, value: string, errors: array}
 */
export const sanitizeAndValidate = (input, maxLength = 255, options = {}) => {
    const errors = [];
    
    // Kiểm tra type
    if (typeof input !== 'string') {
        return { isValid: false, value: '', errors: ['Dữ liệu phải là chuỗi!'] };
    }
    
    // Loại bỏ khoảng trắng thừa
    let cleaned = input.trim();
    
    // Kiểm tra độ dài trước khi xử lý
    if (cleaned.length > maxLength) {
        errors.push(`Dữ liệu quá dài (tối đa ${maxLength} ký tự)!`);
        cleaned = cleaned.substring(0, maxLength);
    }
    
    // Kiểm tra ký tự null byte
    if (cleaned.includes('\x00')) {
        errors.push('Dữ liệu chứa ký tự không hợp lệ!');
        cleaned = cleaned.replace(/\x00/g, '');
    }
    
    // Làm sạch XSS
    cleaned = xss(cleaned, xssOptions);
    
    // Kiểm tra các pattern nguy hiểm
    if (checkDangerousPatterns(cleaned)) {
        errors.push('Dữ liệu chứa nội dung nguy hiểm!');
    }
    
    // Kiểm tra encoding
    try {
        const encoded = encodeURIComponent(cleaned);
        if (encoded.length > maxLength * 3) { // URL encoding có thể tăng độ dài
            errors.push('Dữ liệu chứa ký tự không hợp lệ!');
        }
    } catch (e) {
        errors.push('Dữ liệu chứa ký tự không hợp lệ!');
    }
    
    // Validate thêm theo options
    if (options.isEmail && !validator.isEmail(cleaned)) {
        errors.push('Email không đúng định dạng!');
    }
    
    if (options.isNumeric && !validator.isNumeric(cleaned)) {
        errors.push('Dữ liệu phải là số!');
    }
    
    if (options.isAlphanumeric && !validator.isAlphanumeric(cleaned.replace(/[_-\s]/g, ''))) {
        errors.push('Dữ liệu chỉ được chứa chữ và số!');
    }
    
    if (options.minLength && cleaned.length < options.minLength) {
        errors.push(`Dữ liệu phải có ít nhất ${options.minLength} ký tự!`);
    }
    
    return {
        isValid: errors.length === 0,
        value: cleaned,
        errors
    };
};

/**
 * Kiểm tra các pattern nguy hiểm
 * @param {string} input 
 * @returns {boolean}
 */
export const checkDangerousPatterns = (input) => {
    return dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Validate email với các kiểm tra bổ sung cho client
 * @param {string} email 
 * @returns {object}
 */
export const validateEmail = (email) => {
    const result = sanitizeAndValidate(email, 254, { isEmail: true });
    
    if (result.isValid) {
        const emailParts = result.value.split('@');
        if (emailParts.length === 2) {
            const [localPart, domain] = emailParts;
            
            // Kiểm tra local part
            if (localPart.length > 64) {
                result.errors.push('Phần tên email quá dài!');
                result.isValid = false;
            }
            
            // Kiểm tra domain
            if (domain.length > 63) {
                result.errors.push('Tên miền email quá dài!');
                result.isValid = false;
            }
            
            // Kiểm tra các domain nguy hiểm (có thể customize)
            const suspiciousDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
            if (suspiciousDomains.includes(domain.toLowerCase())) {
                result.errors.push('Email từ dịch vụ tạm thời không được phép!');
                result.isValid = false;
            }
        }
        
        // Chuyển về lowercase
        result.value = result.value.toLowerCase();
    }
    
    return result;
};

/**
 * Validate password với các quy tắc bảo mật cho client
 * @param {string} password 
 * @param {object} options 
 * @returns {object}
 */
export const validatePassword = (password, options = {}) => {
    const minLength = options.minLength || 6;
    const maxLength = options.maxLength || 128;
    const requireSpecialChar = options.requireSpecialChar || false;
    const requireNumber = options.requireNumber || false;
    const requireUppercase = options.requireUppercase || false;
    
    const errors = [];
    
    if (typeof password !== 'string') {
        return { isValid: false, value: '', errors: ['Mật khẩu phải là chuỗi!'] };
    }
    
    // Kiểm tra độ dài
    if (password.length < minLength) {
        errors.push(`Mật khẩu phải có ít nhất ${minLength} ký tự!`);
    }
    
    if (password.length > maxLength) {
        errors.push(`Mật khẩu quá dài (tối đa ${maxLength} ký tự)!`);
    }
    
    // Kiểm tra ký tự đặc biệt
    if (requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt!');
    }
    
    // Kiểm tra số
    if (requireNumber && !/\d/.test(password)) {
        errors.push('Mật khẩu phải chứa ít nhất 1 chữ số!');
    }
    
    // Kiểm tra chữ hoa
    if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa!');
    }
    
    // Kiểm tra các pattern nguy hiểm
    if (checkDangerousPatterns(password)) {
        errors.push('Mật khẩu chứa ký tự không được phép!');
    }
    
    // Kiểm tra common passwords
    const commonPasswords = ['123456', 'password', 'admin', 'root', 'user', '12345678'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Mật khẩu quá đơn giản!');
    }
    
    return {
        isValid: errors.length === 0,
        value: password, // Không sanitize password
        errors
    };
};

/**
 * Validate request headers và metadata cho client
 * @param {object} req 
 * @returns {object}
 */
export const validateRequestMeta = (req) => {
    const errors = [];
    
    // Kiểm tra method
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        errors.push('HTTP method không được phép!');
    }
    
    // Kiểm tra Content-Length (giảm limit cho client)
    const contentLength = parseInt(req.get('Content-Length'));
    if (contentLength && contentLength > 5 * 1024 * 1024) { // 5MB cho client
        errors.push('Request quá lớn!');
    }
    
    // Kiểm tra User-Agent
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 5 || userAgent.length > 512) {
        errors.push('User-Agent không hợp lệ!');
    }
    
    // Kiểm tra các header nguy hiểm
    const dangerousHeaders = ['x-forwarded-for', 'x-real-ip', 'referer'];
    for (const header of dangerousHeaders) {
        const value = req.get(header);
        if (value && checkDangerousPatterns(value)) {
            errors.push(`Header ${header} chứa nội dung nguy hiểm!`);
        }
    }
    
    // Kiểm tra Content-Type cho client
    if (req.method === 'POST') {
        const contentType = req.get('Content-Type');
        if (!contentType || (!contentType.includes('application/x-www-form-urlencoded') && 
                           !contentType.includes('application/json') &&
                           !contentType.includes('multipart/form-data'))) {
            errors.push('Content-Type không hợp lệ!');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate và làm sạch body request cho client
 * @param {object} body 
 * @param {array} allowedFields 
 * @param {number} maxFields 
 * @returns {object}
 */
export const validateRequestBody = (body, allowedFields = [], maxFields = 15) => {
    const errors = [];
    const cleanBody = {};
    
    // Kiểm tra số lượng field (giảm cho client)
    const bodyKeys = Object.keys(body || {});
    if (bodyKeys.length > maxFields) {
        errors.push('Quá nhiều dữ liệu được gửi lên!');
    }
    
    // Kiểm tra và làm sạch từng field
    for (const key of bodyKeys) {
        if (allowedFields.length > 0 && !allowedFields.includes(key)) {
            // Log nhưng không fail request
            console.warn('Unexpected field detected:', key);
            continue;
        }
        
        const keyValidation = sanitizeAndValidate(key, 50);
        if (!keyValidation.isValid) {
            errors.push(`Tên field '${key}' không hợp lệ!`);
            continue;
        }
        
        cleanBody[keyValidation.value] = body[key];
    }
    
    return {
        isValid: errors.length === 0,
        body: cleanBody,
        errors
    };
};

/**
 * Rate limiting helper cho client (sử dụng memory cache đơn giản)
 * @param {string} key 
 * @param {number} limit 
 * @param {number} windowMs 
 * @returns {boolean}
 */
export const checkRateLimit = (key, limit = 5, windowMs = 60000) => {
    // Simple in-memory rate limiting cho client
    if (!global.clientRateLimitStore) {
        global.clientRateLimitStore = new Map();
    }
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!global.clientRateLimitStore.has(key)) {
        global.clientRateLimitStore.set(key, []);
    }
    
    const requests = global.clientRateLimitStore.get(key);
    
    // Loại bỏ các request cũ
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= limit) {
        return false; // Exceeded rate limit
    }
    
    validRequests.push(now);
    global.clientRateLimitStore.set(key, validRequests);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance
        cleanupRateLimitStore();
    }
    
    return true; // Within rate limit
};

/**
 * Cleanup rate limit store để tránh memory leak
 */
const cleanupRateLimitStore = () => {
    if (!global.clientRateLimitStore) return;
    
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, requests] of global.clientRateLimitStore.entries()) {
        const validRequests = requests.filter(time => now - time < maxAge);
        if (validRequests.length === 0) {
            global.clientRateLimitStore.delete(key);
        } else {
            global.clientRateLimitStore.set(key, validRequests);
        }
    }
};

/**
 * Middleware để validate request chung cho client
 */
export const commonValidationMiddleware = (req, res, next) => {
    try {
        // Validate request metadata
        const metaValidation = validateRequestMeta(req);
        if (!metaValidation.isValid) {
            console.warn('Client request meta validation failed:', metaValidation.errors, 'IP:', req.ip);
            req.flash('error', 'Yêu cầu không hợp lệ!');
            return res.redirect('back');
        }
        
        // Rate limiting (ít nghiêm ngặt hơn admin)
        const clientKey = req.ip || 'unknown';
        if (!checkRateLimit(`client_general_${clientKey}`, 50, 60000)) { // 50 requests per minute
            req.flash('error', 'Quá nhiều yêu cầu. Vui lòng thử lại sau!');
            return res.redirect('back');
        }
        
        next();
    } catch (error) {
        console.error('Client common validation error:', error);
        req.flash('error', 'Lỗi hệ thống!');
        return res.redirect('back');
    }
};

// Validate MongoDB ObjectId cho client
export function validateObjectId(id) {
    if (!id || typeof id !== 'string') {
        return { isValid: false, error: 'ID phải là chuỗi ký tự!' };
    }
    
    // Kiểm tra length
    if (id.length !== 24) {
        return { isValid: false, error: 'ID không có độ dài hợp lệ!' };
    }
    
    // Kiểm tra hex format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return { isValid: false, error: 'ID không có format hợp lệ!' };
    }
    
    return { isValid: true, value: id };
}

/**
 * Validate full name cho client
 * @param {string} fullName 
 * @returns {object}
 */
export const validateFullName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
        return { isValid: false, error: 'Vui lòng nhập họ tên!' };
    }

    const result = sanitizeAndValidate(fullName, 100, { minLength: 2 });
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Kiểm tra chỉ chứa chữ cái, khoảng trắng và một số ký tự đặc biệt cho tiếng Việt
    if (!/^[a-zA-ZÀ-ỹ\s'-\.]{2,100}$/u.test(result.value)) {
        return { isValid: false, error: 'Họ tên chỉ được chứa chữ cái và khoảng trắng!' };
    }

    // Kiểm tra không phải toàn khoảng trắng
    if (result.value.trim().length < 2) {
        return { isValid: false, error: 'Họ tên phải có ít nhất 2 ký tự!' };
    }

    // Normalize khoảng trắng
    const normalized = result.value.replace(/\s+/g, ' ').trim();
    
    return { isValid: true, value: normalized };
};

/**
 * Validate comment content
 * @param {string} content 
 * @returns {object}
 */
export const validateCommentContent = (content) => {
    if (!content || typeof content !== 'string') {
        return { isValid: false, error: 'Vui lòng nhập nội dung bình luận!' };
    }

    const result = sanitizeAndValidate(content, 1000, { minLength: 1 });
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Kiểm tra không phải toàn khoảng trắng
    if (result.value.trim().length < 1) {
        return { isValid: false, error: 'Nội dung bình luận không được để trống!' };
    }

    return { isValid: true, value: result.value.trim() };
};

/**
 * Validate search query
 * @param {string} query 
 * @returns {object}
 */
export const validateSearchQuery = (query) => {
    if (!query || typeof query !== 'string') {
        return { isValid: false, error: 'Vui lòng nhập từ khóa tìm kiếm!' };
    }

    const result = sanitizeAndValidate(query, 200, { minLength: 1 });
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Kiểm tra không phải toàn khoảng trắng hoặc ký tự đặc biệt
    if (!/[a-zA-Z0-9À-ỹ]/.test(result.value)) {
        return { isValid: false, error: 'Từ khóa tìm kiếm phải chứa ít nhất một ký tự chữ hoặc số!' };
    }

    return { isValid: true, value: result.value.trim() };
};

/**
 * Validate rating (1-5 stars)
 * @param {any} rating 
 * @returns {object}
 */
export const validateRating = (rating) => {
    if (!rating) {
        return { isValid: false, error: 'Vui lòng chọn đánh giá!' };
    }

    let numRating;
    if (typeof rating === 'string') {
        numRating = parseInt(rating);
    } else if (typeof rating === 'number') {
        numRating = rating;
    } else {
        return { isValid: false, error: 'Đánh giá không hợp lệ!' };
    }

    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return { isValid: false, error: 'Đánh giá phải từ 1 đến 5 sao!' };
    }

    return { isValid: true, value: numRating };
};

export default {
    sanitizeAndValidate,
    checkDangerousPatterns,
    validateEmail,
    validatePassword,
    validateRequestMeta,
    validateRequestBody,
    checkRateLimit,
    validateObjectId,
    validateFullName,
    validateCommentContent,
    validateSearchQuery,
    validateRating,
    commonValidationMiddleware
};
