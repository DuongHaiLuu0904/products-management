import validator from 'validator';
import xss from 'xss';
import { 
    sanitizeAndValidate, 
    validateEmail, 
    checkDangerousPatterns,
    validateObjectId,
    validateRequestBody 
} from './common.validate.js';

// Cấu hình XSS filter nghiêm ngặt cho settings
const xssOptions = {
    whiteList: {}, // Không cho phép bất kỳ HTML tag nào
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    allowCommentTag: false,
    escapeHtml: true
};

// Danh sách các setting keys được phép
const ALLOWED_SETTING_KEYS = [
    'website_name',
    'logo',
    'phone',
    'email',
    'address',
    'copyright',
    'description',
    'keywords',
    'facebook',
    'twitter',
    'instagram',
    'youtube',
    'maintenance_mode',
    'max_file_size',
    'allowed_file_types',
    'admin_email',
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_password',
    'smtp_secure'
];

// Mapping validation rules cho từng setting key
const SETTING_VALIDATION_RULES = {
    website_name: { maxLength: 100, minLength: 1, required: true },
    logo: { maxLength: 500, isUrl: true },
    phone: { maxLength: 20, minLength: 10, isPhone: true },
    email: { maxLength: 254, isEmail: true },
    address: { maxLength: 500, minLength: 5 },
    copyright: { maxLength: 200 },
    description: { maxLength: 1000 },
    keywords: { maxLength: 500 },
    facebook: { maxLength: 255, isUrl: true },
    twitter: { maxLength: 255, isUrl: true },
    instagram: { maxLength: 255, isUrl: true },
    youtube: { maxLength: 255, isUrl: true },
    maintenance_mode: { isBoolean: true },
    max_file_size: { isNumeric: true, min: 1, max: 100 }, // MB
    allowed_file_types: { isArray: true, maxItems: 20 },
    admin_email: { maxLength: 254, isEmail: true, required: true },
    smtp_host: { maxLength: 255 },
    smtp_port: { isNumeric: true, min: 1, max: 65535 },
    smtp_user: { maxLength: 255 },
    smtp_password: { maxLength: 255 },
    smtp_secure: { isBoolean: true }
};

/**
 * Validate website name - tên trang web
 * @param {string} name 
 * @returns {object}
 */
export const validateWebsiteName = (name) => {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Tên website là bắt buộc!' };
    }

    const result = sanitizeAndValidate(name, 100, { minLength: 1 });
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Kiểm tra ký tự đặc biệt nguy hiểm
    if (/[<>\"'&]/.test(result.value)) {
        return { isValid: false, error: 'Tên website chứa ký tự không được phép!' };
    }

    return { isValid: true, value: result.value.trim() };
};

/**
 * Validate logo URL
 * @param {string} logoUrl 
 * @returns {object}
 */
export const validateLogo = (logoUrl) => {
    if (!logoUrl) {
        return { isValid: true, value: '' };
    }

    if (typeof logoUrl !== 'string') {
        return { isValid: false, error: 'Logo phải là đường dẫn hợp lệ!' };
    }

    const result = sanitizeAndValidate(logoUrl, 500);
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Kiểm tra URL format nếu không phải path tương đối
    if (!result.value.startsWith('/') && !result.value.startsWith('./')) {
        if (!validator.isURL(result.value, { 
            protocols: ['http', 'https'],
            require_protocol: true,
            require_host: true,
            require_valid_protocol: true
        })) {
            return { isValid: false, error: 'Logo phải là URL hợp lệ!' };
        }
    }

    // Kiểm tra extension file hình ảnh
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = allowedExtensions.some(ext => 
        result.value.toLowerCase().includes(ext)
    );
    
    if (!hasValidExtension) {
        return { isValid: false, error: 'Logo phải là file hình ảnh hợp lệ!' };
    }

    return { isValid: true, value: result.value };
};

/**
 * Validate phone number
 * @param {string} phone 
 * @returns {object}
 */
export const validatePhone = (phone) => {
    if (!phone) {
        return { isValid: true, value: '' };
    }

    if (typeof phone !== 'string') {
        return { isValid: false, error: 'Số điện thoại phải là chuỗi!' };
    }

    const result = sanitizeAndValidate(phone, 20, { minLength: 10 });
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Loại bỏ các ký tự không phải số và dấu +, -, (, ), space
    const cleanPhone = result.value.replace(/[^\d+\-\(\)\s]/g, '');
    
    // Kiểm tra format số điện thoại Việt Nam hoặc quốc tế
    const phoneRegex = /^(\+84|84|0)?[1-9]\d{8,9}$/;
    const internationalRegex = /^\+?[1-9]\d{10,14}$/;
    
    if (!phoneRegex.test(cleanPhone.replace(/[\s\-\(\)]/g, '')) && 
        !internationalRegex.test(cleanPhone.replace(/[\s\-\(\)]/g, ''))) {
        return { isValid: false, error: 'Số điện thoại không đúng định dạng!' };
    }

    return { isValid: true, value: cleanPhone };
};

/**
 * Validate address
 * @param {string} address 
 * @returns {object}
 */
export const validateAddress = (address) => {
    if (!address) {
        return { isValid: true, value: '' };
    }

    if (typeof address !== 'string') {
        return { isValid: false, error: 'Địa chỉ phải là chuỗi!' };
    }

    const result = sanitizeAndValidate(address, 500, { minLength: 5 });
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Kiểm tra địa chỉ không chứa toàn ký tự đặc biệt
    if (!/[a-zA-Z0-9À-ỹ]/.test(result.value)) {
        return { isValid: false, error: 'Địa chỉ phải chứa ít nhất một ký tự chữ hoặc số!' };
    }

    return { isValid: true, value: result.value.trim() };
};

/**
 * Validate social media URL
 * @param {string} url 
 * @param {string} platform 
 * @returns {object}
 */
export const validateSocialUrl = (url, platform = '') => {
    if (!url) {
        return { isValid: true, value: '' };
    }

    if (typeof url !== 'string') {
        return { isValid: false, error: `Link ${platform} phải là chuỗi!` };
    }

    const result = sanitizeAndValidate(url, 255);
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') };
    }

    // Validate URL format
    if (!validator.isURL(result.value, { 
        protocols: ['http', 'https'],
        require_protocol: true,
        require_host: true,
        require_valid_protocol: true
    })) {
        return { isValid: false, error: `Link ${platform} không đúng định dạng!` };
    }

    // Kiểm tra domain theo platform
    const platformDomains = {
        facebook: ['facebook.com', 'fb.com', 'm.facebook.com'],
        twitter: ['twitter.com', 'x.com', 'm.twitter.com'],
        instagram: ['instagram.com', 'm.instagram.com'],
        youtube: ['youtube.com', 'youtu.be', 'm.youtube.com']
    };

    if (platform && platformDomains[platform]) {
        const urlObj = new URL(result.value);
        const isValidDomain = platformDomains[platform].some(domain => 
            urlObj.hostname.includes(domain)
        );
        
        if (!isValidDomain) {
            return { isValid: false, error: `Link ${platform} không hợp lệ!` };
        }
    }

    return { isValid: true, value: result.value };
};

/**
 * Validate boolean setting
 * @param {any} value 
 * @returns {object}
 */
export const validateBooleanSetting = (value) => {
    if (value === undefined || value === null) {
        return { isValid: true, value: false };
    }

    // Chấp nhận string 'true'/'false', number 0/1, boolean
    if (typeof value === 'boolean') {
        return { isValid: true, value };
    }

    if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === 'true' || lowerValue === '1') {
            return { isValid: true, value: true };
        }
        if (lowerValue === 'false' || lowerValue === '0') {
            return { isValid: true, value: false };
        }
    }

    if (typeof value === 'number') {
        return { isValid: true, value: Boolean(value) };
    }

    return { isValid: false, error: 'Giá trị phải là true/false!' };
};

/**
 * Validate numeric setting
 * @param {any} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {object}
 */
export const validateNumericSetting = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    if (value === undefined || value === null || value === '') {
        return { isValid: true, value: 0 };
    }

    let numValue;
    
    if (typeof value === 'number') {
        numValue = value;
    } else if (typeof value === 'string') {
        const cleanValue = value.trim();
        if (!validator.isNumeric(cleanValue)) {
            return { isValid: false, error: 'Giá trị phải là số!' };
        }
        numValue = parseFloat(cleanValue);
    } else {
        return { isValid: false, error: 'Giá trị phải là số!' };
    }

    if (isNaN(numValue)) {
        return { isValid: false, error: 'Giá trị không phải là số hợp lệ!' };
    }

    if (numValue < min) {
        return { isValid: false, error: `Giá trị phải lớn hơn hoặc bằng ${min}!` };
    }

    if (numValue > max) {
        return { isValid: false, error: `Giá trị phải nhỏ hơn hoặc bằng ${max}!` };
    }

    return { isValid: true, value: numValue };
};

/**
 * Validate array setting (như allowed_file_types)
 * @param {any} value 
 * @param {number} maxItems 
 * @returns {object}
 */
export const validateArraySetting = (value, maxItems = 50) => {
    if (!value) {
        return { isValid: true, value: [] };
    }

    let arrayValue;
    
    if (Array.isArray(value)) {
        arrayValue = value;
    } else if (typeof value === 'string') {
        try {
            // Thử parse JSON
            arrayValue = JSON.parse(value);
            if (!Array.isArray(arrayValue)) {
                // Hoặc split by comma
                arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
            }
        } catch {
            // Split by comma nếu không parse được JSON
            arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
        }
    } else {
        return { isValid: false, error: 'Giá trị phải là mảng!' };
    }

    if (arrayValue.length > maxItems) {
        return { isValid: false, error: `Mảng không được vượt quá ${maxItems} phần tử!` };
    }

    // Validate và sanitize từng phần tử
    const cleanArray = [];
    for (const item of arrayValue) {
        if (typeof item !== 'string') continue;
        
        const result = sanitizeAndValidate(item, 50);
        if (result.isValid && result.value) {
            cleanArray.push(result.value);
        }
    }

    return { isValid: true, value: cleanArray };
};

/**
 * Validate general settings - hàm chính cho validation settings
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
export const validateGeneralSettings = (req, res, next) => {
    try {
        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_SETTING_KEYS, 30);
        if (!bodyValidation.isValid) {
            return res.status(400).json({
                code: 400,
                message: bodyValidation.errors.join(', ')
            });
        }

        const validatedData = {};
        const errors = [];

        // Validate từng field dựa theo rules
        for (const [key, value] of Object.entries(bodyValidation.body)) {
            if (!ALLOWED_SETTING_KEYS.includes(key)) {
                continue; // Skip unknown keys
            }

            const rules = SETTING_VALIDATION_RULES[key] || {};
            let result;

            switch (key) {
                case 'website_name':
                    result = validateWebsiteName(value);
                    break;

                case 'logo':
                    result = validateLogo(value);
                    break;

                case 'phone':
                    result = validatePhone(value);
                    break;

                case 'email':
                case 'admin_email':
                    result = validateEmail(value);
                    break;

                case 'address':
                    result = validateAddress(value);
                    break;

                case 'facebook':
                    result = validateSocialUrl(value, 'facebook');
                    break;

                case 'twitter':
                    result = validateSocialUrl(value, 'twitter');
                    break;

                case 'instagram':
                    result = validateSocialUrl(value, 'instagram');
                    break;

                case 'youtube':
                    result = validateSocialUrl(value, 'youtube');
                    break;

                case 'maintenance_mode':
                case 'smtp_secure':
                    result = validateBooleanSetting(value);
                    break;

                case 'max_file_size':
                    result = validateNumericSetting(value, rules.min || 1, rules.max || 100);
                    break;

                case 'smtp_port':
                    result = validateNumericSetting(value, rules.min || 1, rules.max || 65535);
                    break;

                case 'allowed_file_types':
                    result = validateArraySetting(value, rules.maxItems || 20);
                    break;

                default:
                    // Generic string validation
                    result = sanitizeAndValidate(
                        value, 
                        rules.maxLength || 500, 
                        {
                            minLength: rules.minLength,
                            isEmail: rules.isEmail,
                            isNumeric: rules.isNumeric
                        }
                    );
                    if (result.isValid) {
                        result = { isValid: true, value: result.value };
                    } else {
                        result = { isValid: false, error: result.errors.join(', ') };
                    }
                    break;
            }

            if (result.isValid) {
                validatedData[key] = result.value;
            } else {
                errors.push(`${key}: ${result.error}`);
            }

            // Kiểm tra required fields
            if (rules.required && (!result.isValid || !result.value)) {
                errors.push(`${key} là bắt buộc!`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                code: 400,
                message: 'Dữ liệu không hợp lệ!',
                errors: errors
            });
        }

        // Gán dữ liệu đã validate vào req để controller sử dụng
        req.validatedBody = validatedData;
        next();

    } catch (error) {
        console.error('Setting validation error:', error);
        return res.status(500).json({
            code: 500,
            message: 'Lỗi hệ thống khi validate dữ liệu!'
        });
    }
};

/**
 * Validate file upload (logo)
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
export const validateLogoUpload = (req, res, next) => {
    try {
        if (!req.file) {
            return next(); // Không có file upload, bỏ qua
        }

        const file = req.file;

        // Kiểm tra file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return res.status(400).json({
                code: 400,
                message: 'File logo quá lớn (tối đa 5MB)!'
            });
        }

        // Kiểm tra file type
        const allowedMimes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];

        if (!allowedMimes.includes(file.mimetype)) {
            return res.status(400).json({
                code: 400,
                message: 'File logo phải là hình ảnh (JPG, PNG, GIF, WebP, SVG)!'
            });
        }

        // Kiểm tra filename
        const filenameResult = sanitizeAndValidate(file.originalname, 255);
        if (!filenameResult.isValid) {
            return res.status(400).json({
                code: 400,
                message: 'Tên file không hợp lệ!'
            });
        }

        // Kiểm tra file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const hasValidExtension = allowedExtensions.some(ext => 
            file.originalname.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
            return res.status(400).json({
                code: 400,
                message: 'File phải có đuôi hợp lệ (.jpg, .png, .gif, .webp, .svg)!'
            });
        }

        next();

    } catch (error) {
        console.error('Logo upload validation error:', error);
        return res.status(500).json({
            code: 500,
            message: 'Lỗi hệ thống khi validate file upload!'
        });
    }
};

export default {
    validateGeneralSettings,
    validateLogoUpload,
    validateWebsiteName,
    validateLogo,
    validatePhone,
    validateAddress,
    validateSocialUrl,
    validateBooleanSetting,
    validateNumericSetting,
    validateArraySetting
};
