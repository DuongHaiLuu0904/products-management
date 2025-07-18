import ProductCategory from '../../models/product-category.model.js';
import { 
    sanitizeAndValidate, 
    checkDangerousPatterns, 
    validateRequestBody,
    checkRateLimit 
} from './common.validate.js';

// Hàm validate helper được nâng cấp bảo mật
const validateHelpers = {
    // Kiểm tra chuỗi có hợp lệ không với bảo mật cao
    isValidString: (value, minLength = 1, maxLength = 500) => {
        if (!value || typeof value !== 'string') return { isValid: false, error: 'Giá trị phải là chuỗi ký tự!' };
        
        const validation = sanitizeAndValidate(value, maxLength);
        if (!validation.isValid) {
            return { isValid: false, error: validation.errors[0] };
        }
        
        if (validation.value.length < minLength) {
            return { isValid: false, error: `Phải có ít nhất ${minLength} ký tự!` };
        }
        
        return { isValid: true, value: validation.value };
    },

    // Kiểm tra số có hợp lệ không với validate nghiêm ngặt
    isValidNumber: (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
        if (value === undefined || value === null || value === '') {
            return { isValid: false, error: 'Giá trị số là bắt buộc!' };
        }
        
        // Kiểm tra input có phải là số không
        const stringValue = String(value).trim();
        if (!/^\d*\.?\d+$/.test(stringValue)) {
            return { isValid: false, error: 'Giá trị phải là số hợp lệ!' };
        }
        
        const num = Number(stringValue);
        if (isNaN(num) || !isFinite(num)) {
            return { isValid: false, error: 'Số không hợp lệ!' };
        }
        
        if (num < min || num > max) {
            return { isValid: false, error: `Số phải trong khoảng ${min} - ${max}!` };
        }
        
        return { isValid: true, value: num };
    },

    // Kiểm tra phần trăm (0-100) với validation chặt chẽ
    isValidPercentage: (value) => {
        if (value === undefined || value === null || value === '') {
            return { isValid: true, value: 0 }; // Default value
        }
        
        const numberValidation = validateHelpers.isValidNumber(value, 0, 100);
        if (!numberValidation.isValid) {
            return { isValid: false, error: 'Phần trăm phải là số từ 0-100!' };
        }
        
        return numberValidation;
    },

    // Kiểm tra URL hình ảnh với whitelist domain
    isValidImageUrl: (value) => {
        if (!value || typeof value !== 'string') {
            return { isValid: true, value: '' }; // Optional field
        }
        
        const validation = sanitizeAndValidate(value, 500);
        if (!validation.isValid) {
            return { isValid: false, error: 'URL hình ảnh chứa nội dung không hợp lệ!' };
        }
        
        try {
            const url = new URL(validation.value);
            const allowedDomains = [
                'cloudinary.com', 'res.cloudinary.com',
                'imgur.com', 'i.imgur.com',
                'amazonaws.com', 's3.amazonaws.com',
                'googleusercontent.com',
                'unsplash.com'
            ];
            
            const isAllowedDomain = allowedDomains.some(domain => 
                url.hostname.includes(domain)
            );
            
            if (!isAllowedDomain) {
                return { isValid: false, error: 'URL hình ảnh không được phép từ domain này!' };
            }
            
            // Kiểm tra extension
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const hasValidExtension = validExtensions.some(ext => 
                url.pathname.toLowerCase().includes(ext)
            );
            
            if (!hasValidExtension) {
                return { isValid: false, error: 'URL phải là hình ảnh hợp lệ (.jpg, .png, .gif, .webp)!' };
            }
            
            return { isValid: true, value: validation.value };
        } catch (e) {
            return { isValid: false, error: 'URL hình ảnh không đúng định dạng!' };
        }
    },

    // Kiểm tra status hợp lệ với whitelist
    isValidStatus: (value) => {
        const validation = sanitizeAndValidate(value, 20);
        if (!validation.isValid) {
            return { isValid: false, error: 'Status chứa nội dung không hợp lệ!' };
        }
        
        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(validation.value)) {
            return { isValid: false, error: 'Status phải là "active" hoặc "inactive"!' };
        }
        
        return { isValid: true, value: validation.value };
    },

    // Kiểm tra featured hợp lệ
    isValidFeatured: (value) => {
        // Normalize về boolean
        if (value === '1' || value === 1 || value === true || value === 'true') {
            return { isValid: true, value: '1' };
        } else if (value === '0' || value === 0 || value === false || value === 'false' || value === undefined) {
            return { isValid: true, value: '0' };
        } else {
            return { isValid: false, error: 'Featured phải là true hoặc false!' };
        }
    },

    // Kiểm tra ObjectId hợp lệ với validate nghiêm ngặt
    isValidObjectId: (value) => {
        if (!value || typeof value !== 'string') {
            return { isValid: false, error: 'ObjectId là bắt buộc!' };
        }
        
        const validation = sanitizeAndValidate(value, 24);
        if (!validation.isValid) {
            return { isValid: false, error: 'ObjectId chứa nội dung không hợp lệ!' };
        }
        
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(validation.value)) {
            return { isValid: false, error: 'ObjectId không đúng định dạng!' };
        }
        
        return { isValid: true, value: validation.value };
    }
};

// Rate limiting cho product operations
const checkProductRateLimit = (req, operation) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const key = `product_${operation}_${clientIP}`;
    
    // 20 operations per minute per IP
    return checkRateLimit(key, 20, 60000);
};

// Validate cho create product với bảo mật cao
export async function createPost(req, res, next) {
    const errors = [];
    const backURL = req.get("Referrer") || "/admin/products";
    const clientIP = req.ip || req.connection.remoteAddress;

    try {
        // Rate limiting
        if (!checkProductRateLimit(req, 'create')) {
            console.warn('Product create rate limit exceeded:', { ip: clientIP });
            req.flash('error', 'Quá nhiều yêu cầu tạo sản phẩm! Vui lòng thử lại sau.');
            return res.redirect(backURL);
        }

        // Validate request body structure
        const allowedFields = [
            'title', 'description', 'price', 'discountPercentage', 
            'stock', 'thumbnail', 'status', 'featured', 
            'product_category_id', 'position'
        ];
        
        const bodyValidation = validateRequestBody(req.body, allowedFields, 15);
        if (!bodyValidation.isValid) {
            errors.push(...bodyValidation.errors);
        } else {
            req.body = bodyValidation.body;
        }

        // 1. Validate tiêu đề sản phẩm (bắt buộc)
        const titleValidation = validateHelpers.isValidString(req.body.title, 3, 255);
        if (!titleValidation.isValid) {
            errors.push(`Tiêu đề sản phẩm: ${titleValidation.error}`);
        } else {
            req.body.title = titleValidation.value;
        }

        // 2. Validate mô tả sản phẩm (không bắt buộc)
        if (req.body.description) {
            const descValidation = validateHelpers.isValidString(req.body.description, 0, 5000);
            if (!descValidation.isValid) {
                errors.push(`Mô tả sản phẩm: ${descValidation.error}`);
            } else {
                req.body.description = descValidation.value;
            }
        }

        // 3. Validate giá sản phẩm (bắt buộc)
        const priceValidation = validateHelpers.isValidNumber(req.body.price, 0, 999999999);
        if (!priceValidation.isValid) {
            errors.push(`Giá sản phẩm: ${priceValidation.error}`);
        } else {
            req.body.price = Math.round(priceValidation.value * 100) / 100; // Làm tròn 2 chữ số thập phân
        }

        // 4. Validate phần trăm giảm giá
        const discountValidation = validateHelpers.isValidPercentage(req.body.discountPercentage);
        if (!discountValidation.isValid) {
            errors.push(`Phần trăm giảm giá: ${discountValidation.error}`);
        } else {
            req.body.discountPercentage = Math.round(discountValidation.value * 100) / 100;
        }

        // 5. Validate số lượng tồn kho (bắt buộc)
        const stockValidation = validateHelpers.isValidNumber(req.body.stock, 0, 999999);
        if (!stockValidation.isValid) {
            errors.push(`Số lượng tồn kho: ${stockValidation.error}`);
        } else {
            req.body.stock = parseInt(stockValidation.value);
        }

        // 6. Validate hình ảnh thumbnail
        if (req.body.thumbnail) {
            const thumbnailValidation = validateHelpers.isValidImageUrl(req.body.thumbnail);
            if (!thumbnailValidation.isValid) {
                errors.push(`Hình ảnh: ${thumbnailValidation.error}`);
            } else {
                req.body.thumbnail = thumbnailValidation.value;
            }
        }

        // 7. Validate status
        if (req.body.status) {
            const statusValidation = validateHelpers.isValidStatus(req.body.status);
            if (!statusValidation.isValid) {
                errors.push(`Trạng thái: ${statusValidation.error}`);
            } else {
                req.body.status = statusValidation.value;
            }
        } else {
            req.body.status = 'active'; // Mặc định
        }

        // 8. Validate featured
        const featuredValidation = validateHelpers.isValidFeatured(req.body.featured);
        if (!featuredValidation.isValid) {
            errors.push(`Nổi bật: ${featuredValidation.error}`);
        } else {
            req.body.featured = featuredValidation.value;
        }

        // 9. Validate danh mục sản phẩm (bắt buộc)
        const categoryValidation = validateHelpers.isValidObjectId(req.body.product_category_id);
        if (!categoryValidation.isValid) {
            errors.push(`Danh mục sản phẩm: ${categoryValidation.error}`);
        } else {
            // Kiểm tra danh mục có tồn tại không
            const categoryExists = await ProductCategory.findOne({
                _id: categoryValidation.value,
                deleted: false
            });
            if (!categoryExists) {
                errors.push('Danh mục sản phẩm không tồn tại hoặc đã bị xóa!');
            } else {
                req.body.product_category_id = categoryValidation.value;
            }
        }

        // 10. Validate position (không bắt buộc)
        if (req.body.position !== undefined && req.body.position !== '') {
            const positionValidation = validateHelpers.isValidNumber(req.body.position, 1, 999999);
            if (!positionValidation.isValid) {
                errors.push(`Vị trí: ${positionValidation.error}`);
            } else {
                req.body.position = parseInt(positionValidation.value);
            }
        }

        // Nếu có lỗi, log và redirect
        if (errors.length > 0) {
            console.warn('Product creation validation failed:', {
                ip: clientIP,
                errors: errors,
                timestamp: new Date().toISOString()
            });
            
            req.flash('error', errors[0]); // Chỉ hiển thị lỗi đầu tiên
            return res.redirect(backURL);
        }

        // Log successful validation
        console.log('Product creation validation passed:', {
            ip: clientIP,
            title: req.body.title.substring(0, 20) + '...',
            timestamp: new Date().toISOString()
        });

        next();

    } catch (error) {
        console.error('Product validation error:', error);
        req.flash('error', 'Có lỗi xảy ra trong quá trình xác thực dữ liệu!');
        return res.redirect(backURL);
    }
}

// Validate cho edit product với bảo mật tương tự
export async function editPATCH(req, res, next) {
    const errors = [];
    const backURL = req.get("Referrer") || "/admin/products";
    const clientIP = req.ip || req.connection.remoteAddress;

    try {
        // Rate limiting cho edit
        if (!checkProductRateLimit(req, 'edit')) {
            console.warn('Product edit rate limit exceeded:', { ip: clientIP });
            req.flash('error', 'Quá nhiều yêu cầu chỉnh sửa sản phẩm! Vui lòng thử lại sau.');
            return res.redirect(backURL);
        }

        // Validate request body structure
        const allowedFields = [
            'title', 'description', 'price', 'discountPercentage', 
            'stock', 'thumbnail', 'status', 'featured', 
            'product_category_id', 'position'
        ];
        
        const bodyValidation = validateRequestBody(req.body, allowedFields, 15);
        if (!bodyValidation.isValid) {
            errors.push(...bodyValidation.errors);
        } else {
            req.body = bodyValidation.body;
        }

        // Validate các field tương tự như create nhưng không bắt buộc phải có tất cả
        if (req.body.title) {
            const titleValidation = validateHelpers.isValidString(req.body.title, 3, 255);
            if (!titleValidation.isValid) {
                errors.push(`Tiêu đề sản phẩm: ${titleValidation.error}`);
            } else {
                req.body.title = titleValidation.value;
            }
        }

        if (req.body.description !== undefined) {
            if (req.body.description) {
                const descValidation = validateHelpers.isValidString(req.body.description, 0, 5000);
                if (!descValidation.isValid) {
                    errors.push(`Mô tả sản phẩm: ${descValidation.error}`);
                } else {
                    req.body.description = descValidation.value;
                }
            }
        }

        if (req.body.price) {
            const priceValidation = validateHelpers.isValidNumber(req.body.price, 0, 999999999);
            if (!priceValidation.isValid) {
                errors.push(`Giá sản phẩm: ${priceValidation.error}`);
            } else {
                req.body.price = Math.round(priceValidation.value * 100) / 100;
            }
        }

        if (req.body.discountPercentage !== undefined) {
            const discountValidation = validateHelpers.isValidPercentage(req.body.discountPercentage);
            if (!discountValidation.isValid) {
                errors.push(`Phần trăm giảm giá: ${discountValidation.error}`);
            } else {
                req.body.discountPercentage = Math.round(discountValidation.value * 100) / 100;
            }
        }

        if (req.body.stock !== undefined) {
            const stockValidation = validateHelpers.isValidNumber(req.body.stock, 0, 999999);
            if (!stockValidation.isValid) {
                errors.push(`Số lượng tồn kho: ${stockValidation.error}`);
            } else {
                req.body.stock = parseInt(stockValidation.value);
            }
        }

        if (req.body.thumbnail) {
            const thumbnailValidation = validateHelpers.isValidImageUrl(req.body.thumbnail);
            if (!thumbnailValidation.isValid) {
                errors.push(`Hình ảnh: ${thumbnailValidation.error}`);
            } else {
                req.body.thumbnail = thumbnailValidation.value;
            }
        }

        if (req.body.status) {
            const statusValidation = validateHelpers.isValidStatus(req.body.status);
            if (!statusValidation.isValid) {
                errors.push(`Trạng thái: ${statusValidation.error}`);
            } else {
                req.body.status = statusValidation.value;
            }
        }

        if (req.body.featured !== undefined) {
            const featuredValidation = validateHelpers.isValidFeatured(req.body.featured);
            if (!featuredValidation.isValid) {
                errors.push(`Nổi bật: ${featuredValidation.error}`);
            } else {
                req.body.featured = featuredValidation.value;
            }
        }

        if (req.body.product_category_id) {
            const categoryValidation = validateHelpers.isValidObjectId(req.body.product_category_id);
            if (!categoryValidation.isValid) {
                errors.push(`Danh mục sản phẩm: ${categoryValidation.error}`);
            } else {
                const categoryExists = await ProductCategory.findOne({
                    _id: categoryValidation.value,
                    deleted: false
                });
                if (!categoryExists) {
                    errors.push('Danh mục sản phẩm không tồn tại hoặc đã bị xóa!');
                } else {
                    req.body.product_category_id = categoryValidation.value;
                }
            }
        }

        if (req.body.position !== undefined && req.body.position !== '') {
            const positionValidation = validateHelpers.isValidNumber(req.body.position, 1, 999999);
            if (!positionValidation.isValid) {
                errors.push(`Vị trí: ${positionValidation.error}`);
            } else {
                req.body.position = parseInt(positionValidation.value);
            }
        }

        // Nếu có lỗi, log và redirect
        if (errors.length > 0) {
            console.warn('Product edit validation failed:', {
                ip: clientIP,
                errors: errors,
                timestamp: new Date().toISOString()
            });
            
            req.flash('error', errors[0]);
            return res.redirect(backURL);
        }

        next();

    } catch (error) {
        console.error('Product edit validation error:', error);
        req.flash('error', 'Có lỗi xảy ra trong quá trình xác thực dữ liệu!');
        return res.redirect(backURL);
    }
}

// Validate cho các request thay đổi status
export async function validateChangeStatus(req, res, next) {
    const { status, id } = req.params;
    const errors = [];
    const backURL = req.get("Referrer") || "/admin/products";

    try {
        // Validate ObjectId
        const idValidation = validateHelpers.isValidObjectId(id);
        if (!idValidation.isValid) {
            errors.push(`ID sản phẩm: ${idValidation.error}`);
        }

        // Validate status
        const statusValidation = validateHelpers.isValidStatus(status);
        if (!statusValidation.isValid) {
            errors.push(`Trạng thái: ${statusValidation.error}`);
        }

        if (errors.length > 0) {
            req.flash('error', errors[0]);
            return res.redirect(backURL);
        }

        next();
    } catch (error) {
        console.error('Status validation error:', error);
        req.flash('error', 'Có lỗi xảy ra trong quá trình xác thực!');
        return res.redirect(backURL);
    }
}

// Validate cho delete request
export async function validateDelete(req, res, next) {
    const { id } = req.params;
    const errors = [];
    const backURL = req.get("Referrer") || "/admin/products";

    try {
        // Rate limiting cho delete
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!checkProductRateLimit(req, 'delete')) {
            console.warn('Product delete rate limit exceeded:', { ip: clientIP });
            req.flash('error', 'Quá nhiều yêu cầu xóa sản phẩm! Vui lòng thử lại sau.');
            return res.redirect(backURL);
        }

        // Validate ObjectId
        const idValidation = validateHelpers.isValidObjectId(id);
        if (!idValidation.isValid) {
            errors.push(`ID sản phẩm: ${idValidation.error}`);
        }

        if (errors.length > 0) {
            req.flash('error', errors[0]);
            return res.redirect(backURL);
        }

        next();
    } catch (error) {
        console.error('Delete validation error:', error);
        req.flash('error', 'Có lỗi xảy ra trong quá trình xác thực!');
        return res.redirect(backURL);
    }
}

// Validate cho multi-select operations với bảo mật cao
export async function validateChangeMulti(req, res, next) {
    const { type, ids } = req.body;
    const errors = [];
    const backURL = req.get("Referrer") || "/admin/products";
    const clientIP = req.ip || req.connection.remoteAddress;

    try {
        // Rate limiting cho bulk operations
        if (!checkProductRateLimit(req, 'multi')) {
            console.warn('Product multi operation rate limit exceeded:', { ip: clientIP });
            req.flash('error', 'Quá nhiều yêu cầu thao tác hàng loạt! Vui lòng thử lại sau.');
            return res.redirect(backURL);
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ['type', 'ids'], 5);
        if (!bodyValidation.isValid) {
            errors.push(...bodyValidation.errors);
        } else {
            req.body = bodyValidation.body;
        }

        // Validate type với whitelist nghiêm ngặt
        const typeValidation = sanitizeAndValidate(type, 20);
        if (!typeValidation.isValid) {
            errors.push('Loại thao tác chứa nội dung không hợp lệ!');
        } else {
            const validTypes = ['active', 'inactive', 'delete-all', 'change-position'];
            if (!validTypes.includes(typeValidation.value)) {
                errors.push('Loại thao tác không được phép!');
            } else {
                req.body.type = typeValidation.value;
            }
        }

        // Validate ids
        if (!ids || typeof ids !== 'string') {
            errors.push('Danh sách ID không hợp lệ!');
        } else {
            const idsValidation = sanitizeAndValidate(ids, 10000); // Giới hạn 10k ký tự
            if (!idsValidation.isValid) {
                errors.push('Danh sách ID chứa nội dung nguy hiểm!');
            } else {
                const idArray = idsValidation.value.split(",").filter(id => id.trim());
                
                if (idArray.length === 0) {
                    errors.push('Vui lòng chọn ít nhất một sản phẩm!');
                } else if (idArray.length > 100) { // Giới hạn tối đa 100 items
                    errors.push('Không thể thao tác quá 100 sản phẩm cùng lúc!');
                } else {
                    // Validate từng ID
                    const validatedIds = [];
                    for (const id of idArray) {
                        const trimmedId = id.trim();
                        
                        if (req.body.type === 'change-position') {
                            const parts = trimmedId.split("-");
                            if (parts.length !== 2) {
                                errors.push('Dữ liệu vị trí không đúng định dạng!');
                                break;
                            }
                            
                            const [productId, position] = parts;
                            const idValidation = validateHelpers.isValidObjectId(productId);
                            const posValidation = validateHelpers.isValidNumber(position, 1, 999999);
                            
                            if (!idValidation.isValid || !posValidation.isValid) {
                                errors.push('Dữ liệu vị trí không hợp lệ!');
                                break;
                            }
                            
                            validatedIds.push(`${idValidation.value}-${posValidation.value}`);
                        } else {
                            const idValidation = validateHelpers.isValidObjectId(trimmedId);
                            if (!idValidation.isValid) {
                                errors.push('ID sản phẩm không hợp lệ!');
                                break;
                            }
                            validatedIds.push(idValidation.value);
                        }
                    }
                    
                    // Cập nhật với IDs đã được validate
                    if (errors.length === 0) {
                        req.body.ids = validatedIds.join(", ");
                    }
                }
            }
        }

        if (errors.length > 0) {
            console.warn('Multi operation validation failed:', {
                ip: clientIP,
                type: type,
                errors: errors,
                timestamp: new Date().toISOString()
            });
            
            req.flash('error', errors[0]);
            return res.redirect(backURL);
        }

        next();

    } catch (error) {
        console.error('Multi operation validation error:', error);
        req.flash('error', 'Có lỗi xảy ra trong quá trình xác thực!');
        return res.redirect(backURL);
    }
}

// Export tất cả functions
export default {
    createPost,
    editPATCH,
    validateChangeStatus,
    validateDelete,
    validateChangeMulti
};
