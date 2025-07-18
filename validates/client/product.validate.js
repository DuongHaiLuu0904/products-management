import validator from 'validator';
import xss from 'xss';
import mongoose from 'mongoose';

// XSS Configuration - Chế độ bảo mật cao
const xssOptions = {
    whiteList: {}, // Không cho phép bất kỳ HTML tag nào
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
};

// Utility functions
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return xss(input.trim(), xssOptions);
};

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const validateStringLength = (str, min = 1, max = 1000) => {
    if (typeof str !== 'string') return false;
    const length = str.trim().length;
    return length >= min && length <= max;
};

// Validation cho comment add
export const validateAddComment = (req, res, next) => {
    const errors = [];
    
    try {
        // Validate product_id
        if (!req.body.product_id) {
            errors.push('Product ID là bắt buộc');
        } else {
            req.body.product_id = sanitizeInput(req.body.product_id);
            
            if (!isValidObjectId(req.body.product_id)) {
                errors.push('Product ID không hợp lệ');
            }
        }
        
        // Validate content
        if (!req.body.content) {
            errors.push('Nội dung bình luận là bắt buộc');
        } else {
            const originalContent = req.body.content;
            req.body.content = sanitizeInput(originalContent);
            
            // Kiểm tra nếu sau khi sanitize content trống
            if (!req.body.content || req.body.content.trim().length === 0) {
                errors.push('Nội dung bình luận không được chứa mã độc hại');
            }
            
            // Validate độ dài content
            if (!validateStringLength(req.body.content, 3, 2000)) {
                errors.push('Nội dung bình luận phải từ 3 đến 2000 ký tự');
            }
            
            // Kiểm tra content có chứa ký tự đặc biệt nguy hiểm
            const dangerousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /data:text\/html/gi,
                /vbscript:/gi
            ];
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(originalContent)) {
                    errors.push('Nội dung chứa mã độc hại không được phép');
                    break;
                }
            }
        }
        
        // Validate rating (optional)
        if (req.body.rating !== undefined && req.body.rating !== null && req.body.rating !== '') {
            const rating = req.body.rating;
            
            // Sanitize rating
            req.body.rating = sanitizeInput(String(rating));
            
            // Validate rating is number
            if (!validator.isNumeric(String(req.body.rating))) {
                errors.push('Đánh giá phải là số');
            } else {
                const numRating = parseInt(req.body.rating);
                if (numRating < 1 || numRating > 5) {
                    errors.push('Đánh giá phải từ 1 đến 5 sao');
                }
                req.body.rating = numRating;
            }
        }
        
        // Validate parent_id (for reply comments)
        if (req.body.parent_id) {
            req.body.parent_id = sanitizeInput(req.body.parent_id);
            
            if (!isValidObjectId(req.body.parent_id)) {
                errors.push('Parent comment ID không hợp lệ');
            }
        }
        
        // Check for additional suspicious fields
        const allowedFields = ['product_id', 'content', 'rating', 'parent_id'];
        const bodyKeys = Object.keys(req.body);
        
        for (const key of bodyKeys) {
            if (!allowedFields.includes(key)) {
                delete req.body[key]; // Remove suspicious fields
            }
        }
        
        if (errors.length > 0) {
            req.flash('error', errors.join('. '));
            return res.redirect('back');
        }
        
        next();
        
    } catch (error) {
        console.error('Validation error:', error);
        req.flash('error', 'Dữ liệu không hợp lệ');
        return res.redirect('back');
    }
};

// Validation cho comment edit
export const validateEditComment = (req, res, next) => {
    const errors = [];
    
    try {
        // Validate commentId param
        if (!req.params.commentId) {
            errors.push('Comment ID là bắt buộc');
        } else {
            req.params.commentId = sanitizeInput(req.params.commentId);
            
            if (!isValidObjectId(req.params.commentId)) {
                errors.push('Comment ID không hợp lệ');
            }
        }
        
        // Validate content
        if (!req.body.content) {
            errors.push('Nội dung bình luận là bắt buộc');
        } else {
            const originalContent = req.body.content;
            req.body.content = sanitizeInput(originalContent);
            
            // Kiểm tra nếu sau khi sanitize content trống
            if (!req.body.content || req.body.content.trim().length === 0) {
                errors.push('Nội dung bình luận không được chứa mã độc hại');
            }
            
            // Validate độ dài content
            if (!validateStringLength(req.body.content, 3, 2000)) {
                errors.push('Nội dung bình luận phải từ 3 đến 2000 ký tự');
            }
            
            // Kiểm tra content có chứa ký tự đặc biệt nguy hiểm
            const dangerousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /data:text\/html/gi,
                /vbscript:/gi
            ];
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(originalContent)) {
                    errors.push('Nội dung chứa mã độc hại không được phép');
                    break;
                }
            }
        }
        
        // Validate rating (optional)
        if (req.body.rating !== undefined && req.body.rating !== null && req.body.rating !== '') {
            const rating = req.body.rating;
            
            // Sanitize rating
            req.body.rating = sanitizeInput(String(rating));
            
            // Validate rating is number
            if (!validator.isNumeric(String(req.body.rating))) {
                errors.push('Đánh giá phải là số');
            } else {
                const numRating = parseInt(req.body.rating);
                if (numRating < 1 || numRating > 5) {
                    errors.push('Đánh giá phải từ 1 đến 5 sao');
                }
                req.body.rating = numRating;
            }
        }
        
        // Check for additional suspicious fields
        const allowedFields = ['content', 'rating'];
        const bodyKeys = Object.keys(req.body);
        
        for (const key of bodyKeys) {
            if (!allowedFields.includes(key)) {
                delete req.body[key]; // Remove suspicious fields
            }
        }
        
        if (errors.length > 0) {
            req.flash('error', errors.join('. '));
            return res.redirect('back');
        }
        
        next();
        
    } catch (error) {
        console.error('Validation error:', error);
        req.flash('error', 'Dữ liệu không hợp lệ');
        return res.redirect('back');
    }
};

// Validation cho comment delete
export const validateDeleteComment = (req, res, next) => {
    const errors = [];
    
    try {
        // Validate commentId param
        if (!req.params.commentId) {
            errors.push('Comment ID là bắt buộc');
        } else {
            req.params.commentId = sanitizeInput(req.params.commentId);
            
            if (!isValidObjectId(req.params.commentId)) {
                errors.push('Comment ID không hợp lệ');
            }
        }
        
        // Remove any body data for DELETE request (security measure)
        req.body = {};
        
        if (errors.length > 0) {
            req.flash('error', errors.join('. '));
            return res.redirect('back');
        }
        
        next();
        
    } catch (error) {
        console.error('Validation error:', error);
        req.flash('error', 'Dữ liệu không hợp lệ');
        return res.redirect('back');
    }
};

// Validation cho product detail params
export const validateProductSlug = (req, res, next) => {
    const errors = [];
    
    try {
        // Validate slugProduct param
        if (!req.params.slugProduct) {
            errors.push('Product slug là bắt buộc');
        } else {
            req.params.slugProduct = sanitizeInput(req.params.slugProduct);
            
            // Validate slug format (chỉ cho phép chữ cái, số, dấu gạch ngang)
            if (!validator.isSlug(req.params.slugProduct)) {
                errors.push('Product slug không hợp lệ');
            }
            
            // Validate độ dài slug
            if (!validateStringLength(req.params.slugProduct, 1, 100)) {
                errors.push('Product slug phải từ 1 đến 100 ký tự');
            }
        }
        
        if (errors.length > 0) {
            return res.redirect('/products');
        }
        
        next();
        
    } catch (error) {
        console.error('Validation error:', error);
        return res.redirect('/products');
    }
};

// Validation cho category slug
export const validateCategorySlug = (req, res, next) => {
    const errors = [];
    
    try {
        // Validate slugCategory param
        if (!req.params.slugCategory) {
            errors.push('Category slug là bắt buộc');
        } else {
            req.params.slugCategory = sanitizeInput(req.params.slugCategory);
            
            // Validate slug format
            if (!validator.isSlug(req.params.slugCategory)) {
                errors.push('Category slug không hợp lệ');
            }
            
            // Validate độ dài slug
            if (!validateStringLength(req.params.slugCategory, 1, 100)) {
                errors.push('Category slug phải từ 1 đến 100 ký tự');
            }
        }
        
        if (errors.length > 0) {
            return res.redirect('/products');
        }
        
        next();
        
    } catch (error) {
        console.error('Validation error:', error);
        return res.redirect('/products');
    }
};

// Validation cho query parameters (pagination, search, etc.)
export const validateQueryParams = (req, res, next) => {
    try {
        // Sanitize và validate page parameter
        if (req.query.page) {
            req.query.page = sanitizeInput(req.query.page);
            
            if (!validator.isNumeric(req.query.page)) {
                delete req.query.page;
            } else {
                const page = parseInt(req.query.page);
                if (page < 1 || page > 10000) { // Giới hạn page
                    delete req.query.page;
                } else {
                    req.query.page = page;
                }
            }
        }
        
        // Sanitize và validate limit parameter
        if (req.query.limit) {
            req.query.limit = sanitizeInput(req.query.limit);
            
            if (!validator.isNumeric(req.query.limit)) {
                delete req.query.limit;
            } else {
                const limit = parseInt(req.query.limit);
                if (limit < 1 || limit > 100) { // Giới hạn limit
                    delete req.query.limit;
                } else {
                    req.query.limit = limit;
                }
            }
        }
        
        // Sanitize search parameter
        if (req.query.search) {
            const originalSearch = req.query.search;
            req.query.search = sanitizeInput(originalSearch);
            
            // Validate độ dài search
            if (!validateStringLength(req.query.search, 1, 100)) {
                delete req.query.search;
            }
            
            // Kiểm tra search có chứa ký tự đặc biệt nguy hiểm
            const dangerousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi
            ];
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(originalSearch)) {
                    delete req.query.search;
                    break;
                }
            }
        }
        
        // Sanitize sort parameter
        if (req.query.sort) {
            req.query.sort = sanitizeInput(req.query.sort);
            
            // Chỉ cho phép một số giá trị sort cụ thể
            const allowedSortValues = ['price-asc', 'price-desc', 'name-asc', 'name-desc', 'newest', 'oldest'];
            if (!allowedSortValues.includes(req.query.sort)) {
                delete req.query.sort;
            }
        }
        
        // Remove any other suspicious query parameters
        const allowedParams = ['page', 'limit', 'search', 'sort'];
        const queryKeys = Object.keys(req.query);
        
        for (const key of queryKeys) {
            if (!allowedParams.includes(key)) {
                delete req.query[key];
            }
        }
        
        next();
        
    } catch (error) {
        console.error('Query validation error:', error);
        // Clear all query params if error
        req.query = {};
        next();
    }
};

// Rate limiting helper (để chống spam comments)
const commentAttempts = new Map();

export const validateCommentRateLimit = (req, res, next) => {
    if (!res.locals.user) {
        return next();
    }
    
    const userId = res.locals.user.id;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxAttempts = 5; // 5 comments per minute
    
    if (!commentAttempts.has(userId)) {
        commentAttempts.set(userId, []);
    }
    
    const attempts = commentAttempts.get(userId);
    
    // Remove old attempts
    const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
        req.flash('error', 'Bạn đang bình luận quá nhanh. Vui lòng chờ một chút.');
        return res.redirect('back');
    }
    
    validAttempts.push(now);
    commentAttempts.set(userId, validAttempts);
    
    next();
};

// Security headers middleware
export const setSecurityHeaders = (req, res, next) => {
    // Prevent XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent content type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent frame embedding
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Remove server info
    res.removeHeader('X-Powered-By');
    
    next();
};
