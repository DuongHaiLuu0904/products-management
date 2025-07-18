import xss from 'xss';
import validator from 'validator';
import Comment from '../../models/comment.model.js';
import Product from '../../models/product.model.js';
import User from '../../models/user.model.js';

// Cấu hình XSS chặt chẽ
const xssOptions = {
    whiteList: {
        // Chỉ cho phép các thẻ cơ bản và an toàn
        p: [],
        br: [],
        strong: [],
        b: [],
        em: [],
        i: [],
        u: [],
        span: ['class'],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    allowCommentTag: false,
    css: false
};

// Utility functions cho validation
const validationHelpers = {
    // Kiểm tra ObjectId MongoDB hợp lệ
    isValidObjectId: (id) => {
        if (!id || typeof id !== 'string') return false;
        // Sử dụng validator.isMongoId() để kiểm tra chính xác hơn
        return validator.isMongoId(id.trim());
    },

    // Kiểm tra chuỗi có hợp lệ không (độ dài, ký tự)
    isValidString: (value, minLength = 1, maxLength = 1000) => {
        if (!value || typeof value !== 'string') return false;
        
        // Sanitize trước khi kiểm tra
        const trimmed = validator.trim(value);
        
        // Kiểm tra độ dài
        if (!validator.isLength(trimmed, { min: minLength, max: maxLength })) return false;
        
        // Kiểm tra ký tự đặc biệt nguy hiểm
        const dangerousPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /on\w+\s*=/gi, // onclick, onload, etc.
            /expression\s*\(/gi,
            /@import/gi,
            /url\s*\(/gi,
            /eval\s*\(/gi,
            /Function\s*\(/gi
        ];
        
        return !dangerousPatterns.some(pattern => pattern.test(trimmed));
    },

    // Kiểm tra email hợp lệ
    isValidEmail: (email) => {
        if (!email) return false;
        return validator.isEmail(email) && validator.isLength(email, { max: 254 });
    },

    // Kiểm tra URL hợp lệ
    isValidURL: (url) => {
        if (!url) return false;
        return validator.isURL(url, {
            protocols: ['http', 'https'],
            require_protocol: true,
            require_valid_protocol: true,
            allow_underscores: false,
            allow_trailing_dot: false,
            allow_protocol_relative_urls: false
        });
    },

    // Kiểm tra rating hợp lệ
    isValidRating: (rating) => {
        if (rating === null || rating === undefined || rating === '') return true; // Rating có thể null
        if (!validator.isNumeric(String(rating))) return false;
        const num = Number(rating);
        return Number.isInteger(num) && num >= 1 && num <= 5;
    },

    // Kiểm tra status hợp lệ
    isValidStatus: (status) => {
        const validStatuses = ['active', 'inactive'];
        return validStatuses.includes(status) && validator.isAlpha(status);
    },

    // Kiểm tra type cho changeMulti
    isValidChangeType: (type) => {
        const validTypes = ['active', 'inactive', 'delete-all'];
        return validTypes.includes(type);
    },

    // Làm sạch và chuẩn hóa nội dung
    sanitizeContent: (content) => {
        if (!content || typeof content !== 'string') return '';
        
        // Normalize unicode để tránh bypass
        let cleaned = content.normalize('NFC');
        
        // Loại bỏ null bytes và control characters
        cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        // Loại bỏ khoảng trắng thừa
        cleaned = validator.trim(cleaned).replace(/\s+/g, ' ');
        
        // Áp dụng XSS filter
        cleaned = xss(cleaned, xssOptions);
        
        // Escape HTML entities để đảm bảo an toàn
        cleaned = validator.escape(cleaned);
        
        // Kiểm tra độ dài sau khi làm sạch
        if (cleaned.length > 1000) {
            cleaned = cleaned.substring(0, 1000);
        }
        
        return cleaned;
    },

    // Kiểm tra SQL injection patterns
    hasSQLInjection: (input) => {
        if (!input || typeof input !== 'string') return false;
        
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
            /(--|\|\||;|\/\*|\*\/)/gi,
            /(\b(OR|AND)\b.*=.*)/gi,
            /'.*(\bOR\b|\bAND\b).*'/gi,
            /\b(WAITFOR|DELAY)\b/gi,
            /\b(XP_|SP_)/gi
        ];
        
        return sqlPatterns.some(pattern => pattern.test(input));
    },

    // Kiểm tra NoSQL injection patterns
    hasNoSQLInjection: (input) => {
        if (!input || typeof input !== 'string') return false;
        
        const noSqlPatterns = [
            /\$where/gi,
            /\$ne/gi,
            /\$gt/gi,
            /\$lt/gi,
            /\$regex/gi,
            /\$or/gi,
            /\$and/gi,
            /\$in/gi,
            /\$nin/gi,
            /javascript:/gi,
            /function\s*\(/gi
        ];
        
        return noSqlPatterns.some(pattern => pattern.test(input));
    },

    // Kiểm tra mảng IDs
    isValidIdsArray: (idsString) => {
        if (!idsString || typeof idsString !== 'string') return false;
        
        // Normalize và clean input
        const cleanIds = validator.trim(idsString);
        const ids = cleanIds.split(',').map(id => validator.trim(id));
        
        // Giới hạn số lượng IDs để tránh DoS
        if (ids.length > 100 || ids.length === 0) return false;
        
        // Kiểm tra từng ID
        return ids.every(id => {
            return id.length > 0 && 
                   validationHelpers.isValidObjectId(id) && 
                   !validationHelpers.hasSQLInjection(id) &&
                   !validationHelpers.hasNoSQLInjection(id);
        });
    },

    // Làm sạch mảng IDs
    sanitizeIdsArray: (idsString) => {
        if (!idsString) return [];
        
        const cleanIds = validator.trim(idsString);
        return cleanIds.split(',')
            .map(id => validator.trim(id))
            .filter(id => validationHelpers.isValidObjectId(id))
            .slice(0, 100); // Giới hạn tối đa 100 items
    },

    // Kiểm tra rate limiting cho request
    checkRateLimit: (req) => {
        // Có thể implement rate limiting logic ở đây
        // Ví dụ: kiểm tra số request từ IP trong khoảng thời gian
        const userAgent = req.get('User-Agent') || '';
        const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
        
        return !suspiciousAgents.some(agent => 
            userAgent.toLowerCase().includes(agent)
        );
    },

    // Validate CSRF token (nếu có)
    isValidCSRFToken: (token, expectedToken) => {
        if (!token || !expectedToken) return false;
        return validator.equals(token, expectedToken);
    }
};

// Validate cho thay đổi trạng thái comment
export async function changeStatus(req, res, next) {
    const errors = [];
    const backURL = req.get("Referrer") || "/admin/comments";

    try {
        // Validate status
        const status = req.params.status;
        if (!validationHelpers.isValidStatus(status)) {
            req.flash('error', 'Trạng thái không hợp lệ! Chỉ chấp nhận: active, inactive');
            return res.redirect(backURL);
        }

        // Validate ID
        const id = req.params.id;
        if (!validationHelpers.isValidObjectId(id)) {
            req.flash('error', 'ID bình luận không hợp lệ!');
            return res.redirect(backURL);
        }

        // Kiểm tra comment có tồn tại không
        const comment = await Comment.findOne({ 
            _id: id, 
            deleted: false 
        });
        
        if (!comment) {
            req.flash('error', 'Bình luận không tồn tại hoặc đã bị xóa!');
            return res.redirect(backURL);
        }

        // Sanitize params để đảm bảo an toàn
        req.params.status = xss(status);
        req.params.id = xss(id);

        next();

    } catch (error) {
        console.error('Validation error in changeStatus:', error);
        req.flash('error', 'Đã xảy ra lỗi trong quá trình xử lý!');
        res.redirect(backURL);
    }
}

// Validate cho thay đổi nhiều comment
export async function changeMulti(req, res, next) {
    const backURL = req.get("Referrer") || "/admin/comments";

    try {
        // Validate type
        const type = req.body.type;
        if (!validationHelpers.isValidChangeType(type)) {
            req.flash('error', 'Loại thao tác không hợp lệ! Chỉ chấp nhận: active, inactive, delete-all');
            return res.redirect(backURL);
        }

        // Validate IDs
        const idsString = req.body.ids;
        if (!validationHelpers.isValidIdsArray(idsString)) {
            req.flash('error', 'Danh sách ID không hợp lệ hoặc vượt quá giới hạn cho phép (100 items)!');
            return res.redirect(backURL);
        }

        // Sanitize IDs
        const sanitizedIds = validationHelpers.sanitizeIdsArray(idsString);
        if (sanitizedIds.length === 0) {
            req.flash('error', 'Không có ID hợp lệ nào được tìm thấy!');
            return res.redirect(backURL);
        }

        // Kiểm tra comments có tồn tại không
        const existingComments = await Comment.find({
            _id: { $in: sanitizedIds },
            deleted: false
        });

        if (existingComments.length !== sanitizedIds.length) {
            req.flash('error', 'Một số bình luận không tồn tại hoặc đã bị xóa!');
            return res.redirect(backURL);
        }

        // Sanitize body data
        req.body.type = xss(type);
        req.body.ids = sanitizedIds.join(', ');

        next();

    } catch (error) {
        console.error('Validation error in changeMulti:', error);
        req.flash('error', 'Đã xảy ra lỗi trong quá trình xử lý!');
        res.redirect(backURL);
    }
}

// Validate cho xóa comment
export async function deleteItem(req, res, next) {
    const backURL = req.get("Referrer") || "/admin/comments";

    try {
        // Validate ID
        const id = req.params.id;
        if (!validationHelpers.isValidObjectId(id)) {
            req.flash('error', 'ID bình luận không hợp lệ!');
            return res.redirect(backURL);
        }

        // Kiểm tra comment có tồn tại không
        const comment = await Comment.findOne({ 
            _id: id, 
            deleted: false 
        });
        
        if (!comment) {
            req.flash('error', 'Bình luận không tồn tại hoặc đã bị xóa!');
            return res.redirect(backURL);
        }

        // Sanitize ID
        req.params.id = xss(id);

        next();

    } catch (error) {
        console.error('Validation error in deleteItem:', error);
        req.flash('error', 'Đã xảy ra lỗi trong quá trình xử lý!');
        res.redirect(backURL);
    }
}

// Validate cho xem chi tiết comment
export async function detail(req, res, next) {
    const backURL = req.get("Referrer") || "/admin/comments";

    try {
        // Validate ID
        const id = req.params.id;
        if (!validationHelpers.isValidObjectId(id)) {
            req.flash('error', 'ID bình luận không hợp lệ!');
            return res.redirect(backURL);
        }

        // Sanitize ID
        req.params.id = xss(id);

        next();

    } catch (error) {
        console.error('Validation error in detail:', error);
        req.flash('error', 'Đã xảy ra lỗi trong quá trình xử lý!');
        res.redirect(backURL);
    }
}

// Validate cho danh sách comments (query parameters)
export async function index(req, res, next) {
    try {
        // Validate và sanitize query parameters
        if (req.query.status) {
            if (!validationHelpers.isValidStatus(req.query.status)) {
                delete req.query.status; // Loại bỏ tham số không hợp lệ
            } else {
                req.query.status = xss(req.query.status);
            }
        }

        if (req.query.product_id) {
            if (!validationHelpers.isValidObjectId(req.query.product_id)) {
                delete req.query.product_id;
            } else {
                req.query.product_id = xss(req.query.product_id);
            }
        }

        if (req.query.keyword) {
            if (!validationHelpers.isValidString(req.query.keyword, 1, 100)) {
                delete req.query.keyword;
            } else {
                req.query.keyword = validationHelpers.sanitizeContent(req.query.keyword.substring(0, 100));
            }
        }

        // Validate pagination
        if (req.query.page) {
            const page = parseInt(req.query.page);
            if (isNaN(page) || page < 1 || page > 10000) {
                req.query.page = 1;
            } else {
                req.query.page = page;
            }
        }

        // Validate sort parameters
        if (req.query.sortKey) {
            const allowedSortKeys = ['createdAt', 'updatedAt', 'rating', 'status'];
            if (!allowedSortKeys.includes(req.query.sortKey)) {
                delete req.query.sortKey;
                delete req.query.sortValue;
            } else {
                req.query.sortKey = xss(req.query.sortKey);
            }
        }

        if (req.query.sortValue) {
            const allowedSortValues = ['asc', 'desc'];
            if (!allowedSortValues.includes(req.query.sortValue)) {
                delete req.query.sortValue;
            } else {
                req.query.sortValue = xss(req.query.sortValue);
            }
        }

        next();

    } catch (error) {
        console.error('Validation error in index:', error);
        req.flash('error', 'Đã xảy ra lỗi trong quá trình xử lý!');
        res.redirect('/admin/comments');
    }
}

// Validate cho tạo comment mới (nếu cần)
export async function createPost(req, res, next) {
    const errors = [];
    const backURL = req.get("Referrer") || "/admin/comments";

    try {
        // Validate content
        if (!validationHelpers.isValidString(req.body.content, 1, 1000)) {
            errors.push('Nội dung bình luận phải có từ 1-1000 ký tự và không chứa mã độc hại!');
        } else {
            req.body.content = validationHelpers.sanitizeContent(req.body.content);
        }

        // Validate user_id
        if (!validationHelpers.isValidObjectId(req.body.user_id)) {
            errors.push('ID người dùng không hợp lệ!');
        } else {
            // Kiểm tra user có tồn tại không
            const user = await User.findById(req.body.user_id);
            if (!user) {
                errors.push('Người dùng không tồn tại!');
            } else {
                req.body.user_id = xss(req.body.user_id);
            }
        }

        // Validate product_id
        if (!validationHelpers.isValidObjectId(req.body.product_id)) {
            errors.push('ID sản phẩm không hợp lệ!');
        } else {
            // Kiểm tra product có tồn tại không
            const product = await Product.findOne({ 
                _id: req.body.product_id, 
                deleted: false 
            });
            if (!product) {
                errors.push('Sản phẩm không tồn tại!');
            } else {
                req.body.product_id = xss(req.body.product_id);
            }
        }

        // Validate parent_id (optional)
        if (req.body.parent_id) {
            if (!validationHelpers.isValidObjectId(req.body.parent_id)) {
                errors.push('ID bình luận cha không hợp lệ!');
            } else {
                // Kiểm tra parent comment có tồn tại không
                const parentComment = await Comment.findOne({
                    _id: req.body.parent_id,
                    deleted: false
                });
                if (!parentComment) {
                    errors.push('Bình luận cha không tồn tại!');
                } else {
                    req.body.parent_id = xss(req.body.parent_id);
                }
            }
        }

        // Validate rating (optional)
        if (req.body.rating !== undefined && req.body.rating !== '') {
            if (!validationHelpers.isValidRating(req.body.rating)) {
                errors.push('Đánh giá phải là số nguyên từ 1-5!');
            } else {
                req.body.rating = parseInt(req.body.rating);
            }
        } else {
            req.body.rating = null;
        }

        // Validate status
        if (req.body.status) {
            if (!validationHelpers.isValidStatus(req.body.status)) {
                req.body.status = 'active'; // Default value
            } else {
                req.body.status = xss(req.body.status);
            }
        } else {
            req.body.status = 'active';
        }

        // Nếu có lỗi, redirect về trang trước
        if (errors.length > 0) {
            errors.forEach(error => req.flash('error', error));
            return res.redirect(backURL);
        }

        next();

    } catch (error) {
        console.error('Validation error in createPost:', error);
        req.flash('error', 'Đã xảy ra lỗi trong quá trình xử lý!');
        res.redirect(backURL);
    }
}

// Validate cho cập nhật comment
export async function editPost(req, res, next) {
    const errors = [];
    const backURL = req.get("Referrer") || "/admin/comments";

    try {
        // Validate ID từ params
        const id = req.params.id;
        if (!validationHelpers.isValidObjectId(id)) {
            req.flash('error', 'ID bình luận không hợp lệ!');
            return res.redirect(backURL);
        }

        // Kiểm tra comment có tồn tại không
        const existingComment = await Comment.findOne({ 
            _id: id, 
            deleted: false 
        });
        if (!existingComment) {
            req.flash('error', 'Bình luận không tồn tại hoặc đã bị xóa!');
            return res.redirect(backURL);
        }

        // Validate content nếu được cập nhật
        if (req.body.content !== undefined) {
            if (!validationHelpers.isValidString(req.body.content, 1, 1000)) {
                errors.push('Nội dung bình luận phải có từ 1-1000 ký tự và không chứa mã độc hại!');
            } else {
                req.body.content = validationHelpers.sanitizeContent(req.body.content);
            }
        }

        // Validate rating nếu được cập nhật
        if (req.body.rating !== undefined && req.body.rating !== '') {
            if (!validationHelpers.isValidRating(req.body.rating)) {
                errors.push('Đánh giá phải là số nguyên từ 1-5!');
            } else {
                req.body.rating = parseInt(req.body.rating);
            }
        }

        // Validate status nếu được cập nhật
        if (req.body.status !== undefined) {
            if (!validationHelpers.isValidStatus(req.body.status)) {
                errors.push('Trạng thái không hợp lệ!');
            } else {
                req.body.status = xss(req.body.status);
            }
        }

        // Nếu có lỗi, redirect về trang trước
        if (errors.length > 0) {
            errors.forEach(error => req.flash('error', error));
            return res.redirect(backURL);
        }

        // Sanitize ID
        req.params.id = xss(id);

        next();

    } catch (error) {
        console.error('Validation error in editPost:', error);
        req.flash('error', 'Đã xảy ra lỗi trong quá trình xử lý!');
        res.redirect(backURL);
    }
}

export default {
    index,
    changeStatus,
    changeMulti,
    deleteItem,
    detail,
    createPost,
    editPost
};