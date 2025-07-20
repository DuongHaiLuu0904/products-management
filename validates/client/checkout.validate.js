import validator from 'validator';
import xss from 'xss';
import { sanitizeAndValidate } from './common.validate.js';

// Cấu hình XSS filter cho checkout
const xssOptions = {
    whiteList: {}, // Không cho phép bất kỳ HTML tag nào
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    allowCommentTag: false
};

/**
 * Validate thông tin người dùng trong quá trình checkout
 * @param {object} userInfo - Thông tin người dùng
 * @returns {object} {isValid: boolean, sanitizedData: object, errors: array}
 */
export const validateUserInfo = (userInfo) => {
    const errors = [];
    const sanitizedData = {};

    // Kiểm tra userInfo có tồn tại và là object
    if (!userInfo || typeof userInfo !== 'object') {
        return {
            isValid: false,
            sanitizedData: {},
            errors: ['Thông tin người dùng không hợp lệ!']
        };
    }

    // Validate fullname
    const fullnameValidation = validateFullname(userInfo.fullname);
    if (!fullnameValidation.isValid) {
        errors.push(...fullnameValidation.errors);
    } else {
        sanitizedData.fullname = fullnameValidation.value;
    }

    // Validate phone
    const phoneValidation = validatePhone(userInfo.phone);
    if (!phoneValidation.isValid) {
        errors.push(...phoneValidation.errors);
    } else {
        sanitizedData.phone = phoneValidation.value;
    }

    // Validate address
    const addressValidation = validateAddress(userInfo.address);
    if (!addressValidation.isValid) {
        errors.push(...addressValidation.errors);
    } else {
        sanitizedData.address = addressValidation.value;
    }

    // Kiểm tra các trường thừa không mong muốn
    const allowedFields = ['fullname', 'phone', 'address'];
    Object.keys(userInfo).forEach(key => {
        if (!allowedFields.includes(key)) {
            errors.push(`Trường "${key}" không được phép!`);
        }
    });

    return {
        isValid: errors.length === 0,
        sanitizedData,
        errors
    };
};

/**
 * Validate họ tên
 * @param {string} fullname 
 * @returns {object} {isValid: boolean, value: string, errors: array}
 */
export const validateFullname = (fullname) => {
    const errors = [];
    
    // Kiểm tra bắt buộc
    if (!fullname) {
        return { isValid: false, value: '', errors: ['Họ tên là bắt buộc!'] };
    }

    // Sanitize và validate cơ bản
    const basicValidation = sanitizeAndValidate(fullname, 100);
    if (!basicValidation.isValid) {
        return basicValidation;
    }

    let cleaned = basicValidation.value;

    // XSS protection
    cleaned = xss(cleaned, xssOptions);

    // Kiểm tra độ dài tối thiểu
    if (cleaned.length < 2) {
        errors.push('Họ tên phải có ít nhất 2 ký tự!');
    }

    // Kiểm tra ký tự hợp lệ (chỉ cho phép chữ cái, dấu cách, và dấu tiếng Việt)
    const namePattern = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
    if (!namePattern.test(cleaned)) {
        errors.push('Họ tên chỉ được chứa chữ cái và dấu cách!');
    }

    // Kiểm tra không có nhiều khoảng trắng liên tiếp
    if (/\s{2,}/.test(cleaned)) {
        errors.push('Họ tên không được chứa nhiều khoảng trắng liên tiếp!');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
    }

    // Kiểm tra không bắt đầu hoặc kết thúc bằng khoảng trắng
    if (cleaned !== cleaned.trim()) {
        cleaned = cleaned.trim();
    }

    // Kiểm tra pattern nguy hiểm
    const dangerousPatterns = [
        /<script/gi,
        /javascript:/gi,
        /on\w+=/gi,
        /eval\(/gi,
        /alert\(/gi
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(cleaned)) {
            errors.push('Họ tên chứa nội dung không an toàn!');
            break;
        }
    }

    return {
        isValid: errors.length === 0,
        value: cleaned,
        errors
    };
};

/**
 * Validate số điện thoại
 * @param {string} phone 
 * @returns {object} {isValid: boolean, value: string, errors: array}
 */
export const validatePhone = (phone) => {
    const errors = [];
    
    // Kiểm tra bắt buộc
    if (!phone) {
        return { isValid: false, value: '', errors: ['Số điện thoại là bắt buộc!'] };
    }

    // Kiểm tra type và convert
    let phoneStr = String(phone).trim();

    // XSS protection
    phoneStr = xss(phoneStr, xssOptions);

    // Loại bỏ các ký tự không phải số, dấu + và dấu cách
    phoneStr = phoneStr.replace(/[^\d\+\-\s\(\)]/g, '');

    // Loại bỏ khoảng trắng, dấu ngoặc, dấu gạch ngang
    const cleanPhone = phoneStr.replace(/[\s\-\(\)]/g, '');

    // Kiểm tra độ dài
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        errors.push('Số điện thoại phải có từ 10-15 chữ số!');
    }

    // Kiểm tra format số điện thoại Việt Nam
    const vietnamPhonePattern = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
    if (!vietnamPhonePattern.test(cleanPhone)) {
        errors.push('Số điện thoại không đúng định dạng Việt Nam!');
    }

    // Chuẩn hóa số điện thoại (chuyển về dạng 0xxxxxxxxx)
    let normalizedPhone = cleanPhone;
    if (normalizedPhone.startsWith('+84')) {
        normalizedPhone = '0' + normalizedPhone.substring(3);
    } else if (normalizedPhone.startsWith('84')) {
        normalizedPhone = '0' + normalizedPhone.substring(2);
    }

    // Validate bằng thư viện validator
    if (!validator.isMobilePhone(normalizedPhone, 'vi-VN')) {
        errors.push('Số điện thoại không hợp lệ!');
    }

    // Kiểm tra blacklist (số điện thoại giả, test)
    const phoneBlacklist = [
        '0000000000',
        '1111111111',
        '2222222222',
        '3333333333',
        '4444444444',
        '5555555555',
        '6666666666',
        '7777777777',
        '8888888888',
        '9999999999',
        '0123456789',
        '0987654321'
    ];

    if (phoneBlacklist.includes(normalizedPhone)) {
        errors.push('Số điện thoại không hợp lệ!');
    }

    return {
        isValid: errors.length === 0,
        value: normalizedPhone,
        errors
    };
};

/**
 * Validate địa chỉ
 * @param {string} address 
 * @returns {object} {isValid: boolean, value: string, errors: array}
 */
export const validateAddress = (address) => {
    const errors = [];
    
    // Kiểm tra bắt buộc
    if (!address) {
        return { isValid: false, value: '', errors: ['Địa chỉ là bắt buộc!'] };
    }

    // Sanitize và validate cơ bản
    const basicValidation = sanitizeAndValidate(address, 500);
    if (!basicValidation.isValid) {
        return basicValidation;
    }

    let cleaned = basicValidation.value;

    // XSS protection
    cleaned = xss(cleaned, xssOptions);

    // Kiểm tra độ dài tối thiểu
    if (cleaned.length < 10) {
        errors.push('Địa chỉ phải có ít nhất 10 ký tự!');
    }

    // Kiểm tra ký tự hợp lệ (cho phép chữ cái, số, dấu cách, dấu phẩy, dấu chấm, dấu gạch ngang)
    const addressPattern = /^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s,.\-\/()]+$/;
    if (!addressPattern.test(cleaned)) {
        errors.push('Địa chỉ chứa ký tự không hợp lệ!');
    }

    // Kiểm tra không có nhiều khoảng trắng liên tiếp
    if (/\s{3,}/.test(cleaned)) {
        errors.push('Địa chỉ không được chứa quá nhiều khoảng trắng liên tiếp!');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
    }

    // Kiểm tra pattern nguy hiểm
    const dangerousPatterns = [
        /<script/gi,
        /javascript:/gi,
        /on\w+=/gi,
        /eval\(/gi,
        /alert\(/gi,
        /document\./gi,
        /window\./gi,
        /\.\.\//g,
        /exec\(/gi
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(cleaned)) {
            errors.push('Địa chỉ chứa nội dung không an toàn!');
            break;
        }
    }

    // Kiểm tra độ dài từng dòng (tránh địa chỉ quá dài không hợp lý)
    const lines = cleaned.split(/[\r\n]+/);
    for (const line of lines) {
        if (line.trim().length > 200) {
            errors.push('Mỗi dòng địa chỉ không được quá 200 ký tự!');
            break;
        }
    }

    return {
        isValid: errors.length === 0,
        value: cleaned.trim(),
        errors
    };
};

/**
 * Validate ID đơn hàng
 * @param {string} orderId 
 * @returns {object} {isValid: boolean, value: string, errors: array}
 */
export const validateOrderId = (orderId) => {
    const errors = [];
    
    if (!orderId) {
        return { isValid: false, value: '', errors: ['ID đơn hàng là bắt buộc!'] };
    }

    // Kiểm tra type
    if (typeof orderId !== 'string') {
        return { isValid: false, value: '', errors: ['ID đơn hàng phải là chuỗi!'] };
    }

    let cleaned = orderId.trim();

    // XSS protection
    cleaned = xss(cleaned, xssOptions);

    // Kiểm tra format MongoDB ObjectId
    if (!validator.isMongoId(cleaned)) {
        errors.push('ID đơn hàng không hợp lệ!');
    }

    // Kiểm tra độ dài cố định của ObjectId (24 ký tự hex)
    if (cleaned.length !== 24) {
        errors.push('ID đơn hàng không đúng định dạng!');
    }

    // Kiểm tra chỉ chứa ký tự hex
    if (!/^[a-fA-F0-9]{24}$/.test(cleaned)) {
        errors.push('ID đơn hàng chỉ được chứa ký tự hex!');
    }

    return {
        isValid: errors.length === 0,
        value: cleaned,
        errors
    };
};

/**
 * Validate toàn bộ request checkout
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} {isValid: boolean, sanitizedData: object, errors: array}
 */
export const validateCheckoutRequest = (req, res) => {
    const errors = [];
    const sanitizedData = {};

    // Kiểm tra method
    if (req.method !== 'POST') {
        errors.push('Phương thức request không hợp lệ!');
    }

    // Kiểm tra Content-Type
    if (!req.is('application/x-www-form-urlencoded') && !req.is('application/json')) {
        errors.push('Content-Type không được hỗ trợ!');
    }

    // Kiểm tra kích thước body
    if (req.get('content-length') && parseInt(req.get('content-length')) > 10240) { // 10KB
        errors.push('Dữ liệu gửi lên quá lớn!');
    }

    // Validate user authentication
    if (!req.user && !res.locals?.user) {
        errors.push('Người dùng chưa đăng nhập!');
    }

    // Validate CSRF token nếu có
    if (req.csrfToken && !req.csrfToken()) {
        errors.push('CSRF token không hợp lệ!');
    }

    // Validate rate limiting
    if (req.rateLimit && req.rateLimit.remaining < 1) {
        errors.push('Quá nhiều request! Vui lòng thử lại sau.');
    }

    // Validate user agent
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10) {
        errors.push('User-Agent không hợp lệ!');
    }

    // Kiểm tra suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
    suspiciousHeaders.forEach(header => {
        const value = req.get(header);
        if (value && value.includes('script')) {
            errors.push('Header chứa nội dung nguy hiểm!');
        }
    });

    return {
        isValid: errors.length === 0,
        sanitizedData,
        errors
    };
};

/**
 * Middleware validate cho checkout
 */
export const checkoutValidationMiddleware = (req, res, next) => {
    try {
        // Validate request cơ bản
        const requestValidation = validateCheckoutRequest(req, res);
        if (!requestValidation.isValid) {
            req.flash('error', requestValidation.errors.join(' '));
            return res.redirect('/checkout');
        }

        // Validate user info nếu có trong body
        if (req.body && Object.keys(req.body).length > 0) {
            const userInfoValidation = validateUserInfo(req.body);
            if (!userInfoValidation.isValid) {
                req.flash('error', userInfoValidation.errors.join(' '));
                return res.redirect('/checkout');
            }
            
            // Ghi đè body với dữ liệu đã được sanitize
            req.body = userInfoValidation.sanitizedData;
        }

        next();
    } catch (error) {
        console.error('Checkout validation error:', error);
        req.flash('error', 'Có lỗi xảy ra trong quá trình xử lý!');
        return res.redirect('/checkout');
    }
};

/**
 * Middleware validate cho success page
 */
export const successValidationMiddleware = (req, res, next) => {
    try {
        const orderIdValidation = validateOrderId(req.params.id);
        if (!orderIdValidation.isValid) {
            req.flash('error', orderIdValidation.errors.join(' '));
            return res.redirect('/');
        }

        // Sanitize order ID
        req.params.id = orderIdValidation.value;
        
        next();
    } catch (error) {
        console.error('Success validation error:', error);
        req.flash('error', 'ID đơn hàng không hợp lệ!');
        return res.redirect('/');
    }
};