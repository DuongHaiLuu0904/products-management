import validator from 'validator';
import xss from 'xss';
import { 
    sanitizeAndValidate, 
    checkDangerousPatterns, 
    validateRequestBody,
    checkRateLimit,
    validateObjectId
} from './common.validate.js';

// Cấu hình XSS filter nghiêm ngặt cho cart
const cartXssOptions = {
    whiteList: {}, // Không cho phép bất kỳ HTML tag nào
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    allowCommentTag: false,
    escapeHtml: true
};

// Blacklist các productId đáng ngờ (có thể config từ database)
const suspiciousProductIds = new Set([
    '000000000000000000000000', // All zeros
    'ffffffffffffffffffff', // All f's
    '123456789012345678901234' // Sequential numbers
]);

// Cache để track repeated requests
const requestCache = new Map();

/**
 * Detect và log suspicious activity
 * @param {object} req 
 * @param {string} action 
 * @param {object} data 
 */
const logSuspiciousActivity = (req, action, data) => {
    const suspiciousData = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        action,
        data,
        headers: {
            referer: req.get('Referer'),
            origin: req.get('Origin'),
            xForwardedFor: req.get('X-Forwarded-For')
        }
    };
    
    console.warn('[CART SECURITY ALERT]', suspiciousData);
    
    // Có thể gửi alert qua email hoặc webhook ở đây
    // await sendSecurityAlert(suspiciousData);
};

/**
 * Detect rapid repeated requests từ cùng IP
 * @param {object} req 
 * @param {string} action 
 * @returns {boolean}
 */
const detectRapidRequests = (req, action) => {
    const key = `${req.ip}_${action}`;
    const now = Date.now();
    const timeWindow = 10000; // 10 seconds
    const maxRequests = 5;
    
    if (!requestCache.has(key)) {
        requestCache.set(key, []);
    }
    
    const requests = requestCache.get(key);
    const recentRequests = requests.filter(time => now - time < timeWindow);
    
    if (recentRequests.length >= maxRequests) {
        logSuspiciousActivity(req, 'RAPID_REQUESTS', {
            action,
            requestCount: recentRequests.length,
            timeWindow: timeWindow
        });
        return true;
    }
    
    recentRequests.push(now);
    requestCache.set(key, recentRequests);
    
    // Cleanup old entries
    if (Math.random() < 0.01) {
        cleanupRequestCache();
    }
    
    return false;
};

/**
 * Cleanup request cache để tránh memory leak
 */
const cleanupRequestCache = () => {
    const now = Date.now();
    const maxAge = 60000; // 1 minute
    
    for (const [key, requests] of requestCache.entries()) {
        const validRequests = requests.filter(time => now - time < maxAge);
        if (validRequests.length === 0) {
            requestCache.delete(key);
        } else {
            requestCache.set(key, validRequests);
        }
    }
};

/**
 * Validate productId cho cart operations
 * @param {string} productId 
 * @returns {object}
 */
export const validateProductId = (productId) => {
    if (!productId) {
        return { isValid: false, error: 'ID sản phẩm là bắt buộc!' };
    }

    // Validate ObjectId format
    const objectIdValidation = validateObjectId(productId);
    if (!objectIdValidation.isValid) {
        return { isValid: false, error: 'ID sản phẩm không hợp lệ!' };
    }

    // Sanitize để tránh XSS
    const sanitized = xss(productId, cartXssOptions);
    if (sanitized !== productId) {
        return { isValid: false, error: 'ID sản phẩm chứa ký tự không hợp lệ!' };
    }

    // Kiểm tra các pattern nguy hiểm
    if (checkDangerousPatterns(productId)) {
        return { isValid: false, error: 'ID sản phẩm chứa nội dung nguy hiểm!' };
    }

    // Kiểm tra suspicious product IDs
    if (suspiciousProductIds.has(productId)) {
        return { isValid: false, error: 'ID sản phẩm không hợp lệ!' };
    }

    return { isValid: true, value: productId };
};

/**
 * Validate quantity cho cart operations - Cực kỳ nghiêm ngặt
 * @param {any} quantity 
 * @param {object} options 
 * @returns {object}
 */
export const validateQuantity = (quantity, options = {}) => {
    const minQuantity = options.min || 1;
    const maxQuantity = options.max || 100; // Giới hạn tối đa để tránh spam
    
    // Kiểm tra null, undefined
    if (quantity === null || quantity === undefined || quantity === '') {
        return { isValid: false, error: 'Số lượng là bắt buộc!' };
    }

    // Kiểm tra type và convert an toàn
    let numQuantity;
    if (typeof quantity === 'string') {
        // Sanitize string trước khi parse
        const sanitized = xss(quantity.trim(), cartXssOptions);
        if (sanitized !== quantity.trim()) {
            return { isValid: false, error: 'Số lượng chứa ký tự không hợp lệ!' };
        }

        // Kiểm tra pattern nguy hiểm
        if (checkDangerousPatterns(sanitized)) {
            return { isValid: false, error: 'Số lượng chứa nội dung nguy hiểm!' };
        }

        // Kiểm tra format số
        if (!/^[0-9]+$/.test(sanitized)) {
            return { isValid: false, error: 'Số lượng phải là số nguyên dương!' };
        }

        numQuantity = parseInt(sanitized, 10);
    } else if (typeof quantity === 'number') {
        numQuantity = quantity;
    } else {
        return { isValid: false, error: 'Số lượng phải là số!' };
    }

    // Kiểm tra NaN và Infinity
    if (isNaN(numQuantity) || !isFinite(numQuantity)) {
        return { isValid: false, error: 'Số lượng không hợp lệ!' };
    }

    // Kiểm tra số nguyên
    if (!Number.isInteger(numQuantity)) {
        return { isValid: false, error: 'Số lượng phải là số nguyên!' };
    }

    // Kiểm tra range
    if (numQuantity < minQuantity) {
        return { isValid: false, error: `Số lượng phải ít nhất ${minQuantity}!` };
    }

    if (numQuantity > maxQuantity) {
        return { isValid: false, error: `Số lượng không được vượt quá ${maxQuantity}!` };
    }

    // Kiểm tra các giá trị bất thường
    if (numQuantity > 1000000) {
        return { isValid: false, error: 'Số lượng quá lớn!' };
    }

    return { isValid: true, value: numQuantity };
};

/**
 * Validate user authentication và authorization
 * @param {object} res 
 * @returns {object}
 */
export const validateUserAuth = (res) => {
    const user = res.locals.user;
    
    if (!user) {
        return { isValid: false, error: 'Bạn cần đăng nhập để thực hiện thao tác này!' };
    }

    if (!user._id) {
        return { isValid: false, error: 'Thông tin user không hợp lệ!' };
    }

    // Validate user ID
    const userIdValidation = validateObjectId(user._id.toString());
    if (!userIdValidation.isValid) {
        return { isValid: false, error: 'ID người dùng không hợp lệ!' };
    }

    // Kiểm tra user status (nếu có field này)
    if (user.status && user.status !== 'active') {
        return { isValid: false, error: 'Tài khoản của bạn đã bị khóa!' };
    }

    return { isValid: true, userId: user._id.toString() };
};

/**
 * Validate request headers và chống bot cho cart operations
 * @param {object} req 
 * @returns {object}
 */
export const validateCartRequest = (req) => {
    const errors = [];

    // Detect rapid requests
    if (detectRapidRequests(req, 'cart_operation')) {
        errors.push('Quá nhiều yêu cầu liên tiếp. Vui lòng thử lại sau!');
    }

    // Kiểm tra User-Agent để chống bot
    const userAgent = req.get('User-Agent');
    if (!userAgent) {
        errors.push('Request thiếu User-Agent!');
        logSuspiciousActivity(req, 'MISSING_USER_AGENT', {});
    } else {
        // Kiểm tra bot patterns
        const botPatterns = [
            /bot/i, /crawler/i, /spider/i, /scraper/i,
            /wget/i, /curl/i, /python/i, /requests/i,
            /postman/i, /insomnia/i, /httpie/i
        ];
        if (botPatterns.some(pattern => pattern.test(userAgent))) {
            errors.push('Bot không được phép truy cập!');
            logSuspiciousActivity(req, 'BOT_DETECTED', { userAgent });
        }

        // Kiểm tra User-Agent quá ngắn hoặc quá dài
        if (userAgent.length < 10 || userAgent.length > 512) {
            errors.push('User-Agent không hợp lệ!');
            logSuspiciousActivity(req, 'INVALID_USER_AGENT_LENGTH', { 
                userAgent, 
                length: userAgent.length 
            });
        }
    }

    // Kiểm tra Referer để chống CSRF cơ bản
    const referer = req.get('Referer');
    if (req.method === 'POST' && !referer) {
        errors.push('Request thiếu Referer header!');
        logSuspiciousActivity(req, 'MISSING_REFERER', {});
    }

    // Kiểm tra X-Requested-With cho AJAX requests
    if (req.xhr || req.get('Content-Type') === 'application/json') {
        const requestedWith = req.get('X-Requested-With');
        if (!requestedWith || requestedWith !== 'XMLHttpRequest') {
            errors.push('AJAX request không hợp lệ!');
            logSuspiciousActivity(req, 'INVALID_AJAX', { requestedWith });
        }
    }

    // Kiểm tra suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'via', 'forwarded'];
    for (const header of suspiciousHeaders) {
        const value = req.get(header);
        if (value && checkDangerousPatterns(value)) {
            errors.push(`Header ${header} chứa nội dung nguy hiểm!`);
            logSuspiciousActivity(req, 'DANGEROUS_HEADER', { header, value });
        }
    }

    // Rate limiting nghiêm ngặt cho cart operations
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const cartRateKey = `cart_${clientIp}`;
    
    // Giới hạn 15 thao tác cart mỗi phút (giảm từ 20)
    if (!checkRateLimit(cartRateKey, 15, 60000)) {
        errors.push('Quá nhiều thao tác giỏ hàng. Vui lòng thử lại sau!');
        logSuspiciousActivity(req, 'RATE_LIMIT_EXCEEDED', { 
            ip: clientIp,
            action: 'cart_operation'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate request body cho cart add operation
 * @param {object} body 
 * @returns {object}
 */
export const validateAddCartBody = (body) => {
    const allowedFields = ['quantity'];
    const validation = validateRequestBody(body, allowedFields, 5);
    
    if (!validation.isValid) {
        return { isValid: false, errors: validation.errors };
    }

    const cleanBody = validation.body;
    const errors = [];

    // Validate quantity từ body
    if (!cleanBody.quantity) {
        errors.push('Số lượng là bắt buộc!');
    } else {
        const quantityValidation = validateQuantity(cleanBody.quantity);
        if (!quantityValidation.isValid) {
            errors.push(quantityValidation.error);
        } else {
            cleanBody.quantity = quantityValidation.value;
        }
    }

    return {
        isValid: errors.length === 0,
        body: cleanBody,
        errors
    };
};

/**
 * Middleware validate cho cart index (GET /cart)
 */
export const validateCartIndex = async (req, res, next) => {
    try {
        // Validate request
        const requestValidation = validateCartRequest(req);
        if (!requestValidation.isValid) {
            console.warn('[CART SECURITY] Cart index validation failed:', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                errors: requestValidation.errors
            });
            req.flash('error', 'Yêu cầu không hợp lệ!');
            return res.redirect('/');
        }

        // Validate user auth
        const authValidation = validateUserAuth(res);
        if (!authValidation.isValid) {
            req.flash('error', authValidation.error);
            return res.redirect('/login');
        }

        // Gắn userId đã validate vào request
        req.validatedUserId = authValidation.userId;
        
        next();
    } catch (error) {
        console.error('[CART SECURITY] Cart index validation error:', error);
        req.flash('error', 'Lỗi hệ thống!');
        return res.redirect('/');
    }
};

/**
 * Middleware validate cho cart add (POST /cart/add/:productId)
 */
export const validateCartAdd = async (req, res, next) => {
    try {
        // Validate request
        const requestValidation = validateCartRequest(req);
        if (!requestValidation.isValid) {
            console.warn('[CART SECURITY] Cart add validation failed:', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                productId: req.params.productId,
                errors: requestValidation.errors
            });
            
            // Log thêm thông tin để phân tích
            logSuspiciousActivity(req, 'CART_ADD_VALIDATION_FAILED', {
                productId: req.params.productId,
                body: req.body,
                errors: requestValidation.errors
            });
            
            req.flash('error', 'Yêu cầu không hợp lệ!');
            return res.redirect('back');
        }

        // Validate user auth
        const authValidation = validateUserAuth(res);
        if (!authValidation.isValid) {
            req.flash('error', authValidation.error);
            return res.redirect('/login');
        }

        // Validate productId từ params
        const productIdValidation = validateProductId(req.params.productId);
        if (!productIdValidation.isValid) {
            console.warn('[CART SECURITY] Invalid productId:', {
                ip: req.ip,
                userId: authValidation.userId,
                productId: req.params.productId,
                error: productIdValidation.error
            });
            
            logSuspiciousActivity(req, 'INVALID_PRODUCT_ID', {
                productId: req.params.productId,
                userId: authValidation.userId
            });
            
            req.flash('error', productIdValidation.error);
            return res.redirect('back');
        }

        // Validate request body
        const bodyValidation = validateAddCartBody(req.body);
        if (!bodyValidation.isValid) {
            console.warn('[CART SECURITY] Invalid cart add body:', {
                ip: req.ip,
                userId: authValidation.userId,
                body: req.body,
                errors: bodyValidation.errors
            });
            
            logSuspiciousActivity(req, 'INVALID_CART_BODY', {
                body: req.body,
                userId: authValidation.userId
            });
            
            req.flash('error', bodyValidation.errors[0]);
            return res.redirect('back');
        }

        // Additional security: Kiểm tra quantity không quá lớn
        if (bodyValidation.body.quantity > 50) {
            logSuspiciousActivity(req, 'EXCESSIVE_QUANTITY', {
                quantity: bodyValidation.body.quantity,
                userId: authValidation.userId,
                productId: productIdValidation.value
            });
            req.flash('error', 'Số lượng quá lớn!');
            return res.redirect('back');
        }

        // Gắn dữ liệu đã validate vào request
        req.validatedUserId = authValidation.userId;
        req.validatedProductId = productIdValidation.value;
        req.validatedQuantity = bodyValidation.body.quantity;
        
        next();
    } catch (error) {
        console.error('[CART SECURITY] Cart add validation error:', error);
        logSuspiciousActivity(req, 'VALIDATION_ERROR', { error: error.message });
        req.flash('error', 'Lỗi hệ thống!');
        return res.redirect('back');
    }
};

/**
 * Middleware validate cho cart delete (GET /cart/delete/:id)
 */
export const validateCartDelete = async (req, res, next) => {
    try {
        // Validate request
        const requestValidation = validateCartRequest(req);
        if (!requestValidation.isValid) {
            console.warn('[CART SECURITY] Cart delete validation failed:', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                productId: req.params.id,
                errors: requestValidation.errors
            });
            req.flash('error', 'Yêu cầu không hợp lệ!');
            return res.redirect('back');
        }

        // Validate user auth
        const authValidation = validateUserAuth(res);
        if (!authValidation.isValid) {
            req.flash('error', authValidation.error);
            return res.redirect('/login');
        }

        // Validate productId từ params
        const productIdValidation = validateProductId(req.params.id);
        if (!productIdValidation.isValid) {
            console.warn('[CART SECURITY] Invalid productId for delete:', {
                ip: req.ip,
                productId: req.params.id,
                error: productIdValidation.error
            });
            req.flash('error', productIdValidation.error);
            return res.redirect('back');
        }

        // Gắn dữ liệu đã validate vào request
        req.validatedUserId = authValidation.userId;
        req.validatedProductId = productIdValidation.value;
        
        next();
    } catch (error) {
        console.error('[CART SECURITY] Cart delete validation error:', error);
        req.flash('error', 'Lỗi hệ thống!');
        return res.redirect('back');
    }
};

/**
 * Middleware validate cho cart update (GET /cart/update/:id/:quantity)
 */
export const validateCartUpdate = async (req, res, next) => {
    try {
        // Validate request
        const requestValidation = validateCartRequest(req);
        if (!requestValidation.isValid) {
            console.warn('[CART SECURITY] Cart update validation failed:', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                productId: req.params.id,
                quantity: req.params.quantity,
                errors: requestValidation.errors
            });
            req.flash('error', 'Yêu cầu không hợp lệ!');
            return res.redirect('back');
        }

        // Validate user auth
        const authValidation = validateUserAuth(res);
        if (!authValidation.isValid) {
            req.flash('error', authValidation.error);
            return res.redirect('/login');
        }

        // Validate productId từ params
        const productIdValidation = validateProductId(req.params.id);
        if (!productIdValidation.isValid) {
            console.warn('[CART SECURITY] Invalid productId for update:', {
                ip: req.ip,
                productId: req.params.id,
                error: productIdValidation.error
            });
            req.flash('error', productIdValidation.error);
            return res.redirect('back');
        }

        // Validate quantity từ params
        const quantityValidation = validateQuantity(req.params.quantity);
        if (!quantityValidation.isValid) {
            console.warn('[CART SECURITY] Invalid quantity for update:', {
                ip: req.ip,
                quantity: req.params.quantity,
                error: quantityValidation.error
            });
            req.flash('error', quantityValidation.error);
            return res.redirect('back');
        }

        // Gắn dữ liệu đã validate vào request
        req.validatedUserId = authValidation.userId;
        req.validatedProductId = productIdValidation.value;
        req.validatedQuantity = quantityValidation.value;
        
        next();
    } catch (error) {
        console.error('[CART SECURITY] Cart update validation error:', error);
        req.flash('error', 'Lỗi hệ thống!');
        return res.redirect('back');
    }
};

/**
 * Validate cart data integrity
 * @param {object} cart 
 * @returns {object}
 */
export const validateCartIntegrity = (cart) => {
    if (!cart) {
        return { isValid: false, error: 'Giỏ hàng không tồn tại!' };
    }

    // Validate cart structure
    if (!cart.user_id) {
        return { isValid: false, error: 'Giỏ hàng thiếu thông tin user!' };
    }

    const userIdValidation = validateObjectId(cart.user_id.toString());
    if (!userIdValidation.isValid) {
        return { isValid: false, error: 'ID user trong giỏ hàng không hợp lệ!' };
    }

    // Validate products array
    if (!Array.isArray(cart.products)) {
        return { isValid: false, error: 'Dữ liệu sản phẩm trong giỏ hàng không hợp lệ!' };
    }

    // Validate từng product trong cart
    for (let i = 0; i < cart.products.length; i++) {
        const product = cart.products[i];
        
        if (!product.product_id) {
            return { isValid: false, error: `Sản phẩm thứ ${i + 1} thiếu ID!` };
        }

        const productIdValidation = validateObjectId(product.product_id.toString());
        if (!productIdValidation.isValid) {
            return { isValid: false, error: `ID sản phẩm thứ ${i + 1} không hợp lệ!` };
        }

        const quantityValidation = validateQuantity(product.quantity);
        if (!quantityValidation.isValid) {
            return { isValid: false, error: `Số lượng sản phẩm thứ ${i + 1} không hợp lệ!` };
        }
    }

    return { isValid: true };
};

export default {
    validateProductId,
    validateQuantity,
    validateUserAuth,
    validateCartRequest,
    validateAddCartBody,
    validateCartIndex,
    validateCartAdd,
    validateCartDelete,
    validateCartUpdate,
    validateCartIntegrity,
    logSuspiciousActivity,
    detectRapidRequests,
    cleanupRequestCache
};
