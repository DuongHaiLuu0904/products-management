import validator from 'validator';
import xss from 'xss';
import mongoose from 'mongoose';

// Cấu hình XSS filter nghiêm ngặt
const xssOptions = {
    whiteList: {}, // Không cho phép bất kỳ HTML tag nào
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    allowCommentTag: false,
    escapeHtml: (html) => html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
};

// Validation cho tạo comment mới
export const validateCreate = (req, res, next) => {
    const errors = [];
    const { content, product_id, parent_id, rating } = req.body;

    // 1. Validate content - bắt buộc và quan trọng nhất
    if (!content) {
        errors.push('Nội dung bình luận là bắt buộc');
    } else {
        // Sanitize content trước khi validate
        const sanitizedContent = xss(content.toString().trim(), xssOptions);
        
        // Kiểm tra độ dài sau khi sanitize
        if (!sanitizedContent || sanitizedContent.length === 0) {
            errors.push('Nội dung bình luận không được để trống');
        } else if (sanitizedContent.length < 1) {
            errors.push('Nội dung bình luận quá ngắn (tối thiểu 1 ký tự)');
        } else if (sanitizedContent.length > 500) {
            errors.push('Nội dung bình luận không được vượt quá 500 ký tự');
        }
        
        // Kiểm tra kích thước byte để tránh tấn công buffer overflow
        if (Buffer.byteLength(sanitizedContent, 'utf8') > 5 * 1024) {
            errors.push('Nội dung bình luận không được vượt quá 5KB');
        }
        
        // Kiểm tra pattern nguy hiểm
        const dangerousPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /onload\s*=/gi,
            /onerror\s*=/gi,
            /onclick\s*=/gi,
            /onmouseover\s*=/gi,
            /expression\s*\(/gi,
            /@import/gi,
            /url\s*\(/gi
        ];
        
        const hasXSSAttempt = dangerousPatterns.some(pattern => pattern.test(content));
        if (hasXSSAttempt) {
            errors.push('Nội dung chứa mã độc hại không được phép');
        }
        
        // Cập nhật content đã được sanitize
        req.body.content = sanitizedContent;
    }

    // 2. Validate product_id - bắt buộc
    if (!product_id) {
        errors.push('ID sản phẩm là bắt buộc');
    } else {
        // Kiểm tra format ObjectId của MongoDB
        if (!mongoose.Types.ObjectId.isValid(product_id.toString().trim())) {
            errors.push('ID sản phẩm không hợp lệ');
        } else {
            req.body.product_id = product_id.toString().trim();
        }
    }

    // 3. Validate parent_id - tùy chọn, nhưng nếu có thì phải hợp lệ
    if (parent_id && parent_id.toString().trim() !== '') {
        if (!mongoose.Types.ObjectId.isValid(parent_id.toString().trim())) {
            errors.push('ID bình luận cha không hợp lệ');
        } else {
            req.body.parent_id = parent_id.toString().trim();
        }
    } else {
        req.body.parent_id = '';
    }

    // 4. Validate rating - tùy chọn, nhưng nếu có thì phải trong khoảng 1-5
    if (rating !== undefined && rating !== null && rating !== '') {
        const ratingValue = parseInt(rating);
        
        if (isNaN(ratingValue)) {
            errors.push('Đánh giá phải là số');
        } else if (ratingValue < 1 || ratingValue > 5) {
            errors.push('Đánh giá phải từ 1 đến 5 sao');
        } else {
            req.body.rating = ratingValue;
        }
    } else {
        req.body.rating = null;
    }

    // 5. Kiểm tra rate limiting cơ bản
    if (req.session && req.session.lastCommentTime) {
        const timeSinceLastComment = Date.now() - req.session.lastCommentTime;
        const MIN_COMMENT_INTERVAL = 10000; // 10 giây
        
        if (timeSinceLastComment < MIN_COMMENT_INTERVAL) {
            errors.push('Vui lòng chờ một chút trước khi bình luận tiếp');
        }
    }

    // 6. Validate độ dài tổng thể của request
    const requestSize = JSON.stringify(req.body).length;
    if (requestSize > 10 * 1024) { // 10KB
        errors.push('Dữ liệu request quá lớn');
    }

    if (errors.length > 0) {
        req.flash('error', errors.join('. '));
        return res.redirect('back');
    }

    // Cập nhật thời gian comment cuối
    if (req.session) {
        req.session.lastCommentTime = Date.now();
    }

    next();
};

// Validation cho cập nhật comment
export const validateEdit = (req, res, next) => {
    const errors = [];
    const { content, rating } = req.body;
    const { id } = req.params;

    // 1. Validate comment ID từ params
    if (!id) {
        errors.push('ID bình luận là bắt buộc');
    } else if (!mongoose.Types.ObjectId.isValid(id.toString().trim())) {
        errors.push('ID bình luận không hợp lệ');
    } else {
        req.params.id = id.toString().trim();
    }

    // 2. Validate content - bắt buộc
    if (!content) {
        errors.push('Nội dung bình luận là bắt buộc');
    } else {
        // Sanitize content
        const sanitizedContent = xss(content.toString().trim(), xssOptions);
        
        if (!sanitizedContent || sanitizedContent.length === 0) {
            errors.push('Nội dung bình luận không được để trống');
        } else if (sanitizedContent.length < 1) {
            errors.push('Nội dung bình luận quá ngắn');
        } else if (sanitizedContent.length > 500) {
            errors.push('Nội dung bình luận không được vượt quá 500 ký tự');
        }
        
        // Kiểm tra kích thước byte
        if (Buffer.byteLength(sanitizedContent, 'utf8') > 1024) {
            errors.push('Nội dung bình luận không được vượt quá 1KB');
        }
        
        // Kiểm tra XSS patterns
        const dangerousPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /on\w+\s*=/gi,
            /expression\s*\(/gi
        ];
        
        const hasXSSAttempt = dangerousPatterns.some(pattern => pattern.test(content));
        if (hasXSSAttempt) {
            errors.push('Nội dung chứa mã độc hại không được phép');
        }
        
        req.body.content = sanitizedContent;
    }

    // 3. Validate rating - tùy chọn
    if (rating !== undefined && rating !== null && rating !== '') {
        const ratingValue = parseInt(rating);
        
        if (isNaN(ratingValue)) {
            errors.push('Đánh giá phải là số');
        } else if (ratingValue < 1 || ratingValue > 5) {
            errors.push('Đánh giá phải từ 1 đến 5 sao');
        } else {
            req.body.rating = ratingValue;
        }
    } else {
        req.body.rating = null;
    }

    // 4. Rate limiting cho edit
    if (req.session && req.session.lastEditTime) {
        const timeSinceLastEdit = Date.now() - req.session.lastEditTime;
        const MIN_EDIT_INTERVAL = 5000; // 5 giây
        
        if (timeSinceLastEdit < MIN_EDIT_INTERVAL) {
            errors.push('Vui lòng chờ một chút trước khi chỉnh sửa tiếp');
        }
    }

    if (errors.length > 0) {
        req.flash('error', errors.join('. '));
        return res.redirect('back');
    }

    // Cập nhật thời gian edit cuối
    if (req.session) {
        req.session.lastEditTime = Date.now();
    }

    next();
};

// Validation cho xóa comment
export const validateDelete = (req, res, next) => {
    const errors = [];
    const { id } = req.params;

    // 1. Validate comment ID
    if (!id) {
        errors.push('ID bình luận là bắt buộc');
    } else if (!mongoose.Types.ObjectId.isValid(id.toString().trim())) {
        errors.push('ID bình luận không hợp lệ');
    } else {
        req.params.id = id.toString().trim();
    }

    // 2. Rate limiting cho delete
    if (req.session && req.session.lastDeleteTime) {
        const timeSinceLastDelete = Date.now() - req.session.lastDeleteTime;
        const MIN_DELETE_INTERVAL = 3000; // 3 giây
        
        if (timeSinceLastDelete < MIN_DELETE_INTERVAL) {
            errors.push('Vui lòng chờ một chút trước khi xóa tiếp');
        }
    }

    if (errors.length > 0) {
        req.flash('error', errors.join('. '));
        return res.redirect('back');
    }

    // Cập nhật thời gian delete cuối
    if (req.session) {
        req.session.lastDeleteTime = Date.now();
    }

    next();
};

// Helper function để kiểm tra spam content
export const checkSpamContent = (content) => {
    const spamPatterns = [
        /(.)\1{10,}/g, // Lặp lại ký tự quá nhiều lần
        /http[s]?:\/\/[^\s]+/g, // URLs
        /www\.[^\s]+/g, // WWW links
        /\b\d{10,}\b/g, // Số điện thoại
        /[A-Z]{10,}/g, // CAPS quá nhiều
        /@[a-zA-Z0-9]+/g, // Mentions
        /#{2,}/g, // Hashtags spam
    ];
    
    return spamPatterns.some(pattern => pattern.test(content));
};

// Middleware tổng hợp cho security headers
export const securityHeaders = (req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Validate User-Agent để phát hiện bot
    const userAgent = req.get('User-Agent');
    if (!userAgent || userAgent.length < 10 || userAgent.length > 1000) {
        return res.status(400).json({ error: 'Invalid User-Agent' });
    }
    
    // Kiểm tra Content-Type cho POST requests
    if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (!contentType || (!contentType.includes('application/json') && 
                           !contentType.includes('application/x-www-form-urlencoded') &&
                           !contentType.includes('multipart/form-data'))) {
            return res.status(400).json({ error: 'Invalid Content-Type' });
        }
    }
    
    next();
};
