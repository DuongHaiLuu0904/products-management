import Role from '../../models/role.model.js';
import { 
    sanitizeAndValidate, 
    checkDangerousPatterns, 
    validateRequestBody,
    checkRateLimit,
    validateObjectId,
    validatePermissions
} from './common.validate.js';
import validator from 'validator';
import xss from 'xss';

// Danh sách permissions hợp lệ trong hệ thống (theo thứ tự từ database)
const VALID_PERMISSIONS = [
    // Product Category permissions
    'products-category_view',
    'products-category_create', 
    'products-category_edit',
    'products-category_delete',
    
    // Product permissions
    'products_view',
    'products_create',
    'products_edit', 
    'products_delete',
    
    // Role permissions
    'roles_view',
    'roles_create',
    'roles_edit',
    'roles_delete', 
    'roles_permissions',
    
    // Account permissions
    'accounts_view',
    'accounts_create',
    'accounts_edit',
    'accounts_delete',
    
    // User permissions
    'users_view',
    'users_create', 
    'users_edit',
    'users_delete',
    
    // Comment permissions
    'comments_view',
    'comments_create',
    'comments_edit',
    'comments_delete',
    
    // Setting permission
    'setting'
];

// Cấu hình XSS filter nghiêm ngặt cho role
const roleXssOptions = {
    whiteList: {}, // Không cho phép bất kỳ HTML tag nào
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    allowCommentTag: false,
    css: false // Không cho phép CSS
};

// Validate helper functions cho role
const roleValidateHelpers = {
    // Validate title với bảo mật cao
    validateTitle: (title) => {
        if (!title || typeof title !== 'string') {
            return { isValid: false, error: 'Tên nhóm quyền là bắt buộc và phải là chuỗi ký tự!' };
        }

        // Kiểm tra length trước khi xử lý
        if (title.length > 200) {
            return { isValid: false, error: 'Tên nhóm quyền không được vượt quá 200 ký tự!' };
        }

        // Sanitize XSS
        const sanitizedTitle = xss(title.trim(), roleXssOptions);
        
        // Kiểm tra các pattern nguy hiểm
        const dangerCheck = checkDangerousPatterns(sanitizedTitle);
        if (!dangerCheck.isValid) {
            return { isValid: false, error: 'Tên nhóm quyền chứa nội dung không hợp lệ!' };
        }

        // Validate độ dài sau khi sanitize
        if (sanitizedTitle.length < 2) {
            return { isValid: false, error: 'Tên nhóm quyền phải có ít nhất 2 ký tự!' };
        }

        if (sanitizedTitle.length > 100) {
            return { isValid: false, error: 'Tên nhóm quyền không được vượt quá 100 ký tự!' };
        }

        // Kiểm tra ký tự đặc biệt nguy hiểm
        const forbiddenChars = /[<>\"'&`{}|\\;()]/;
        if (forbiddenChars.test(sanitizedTitle)) {
            return { isValid: false, error: 'Tên nhóm quyền chứa ký tự không được phép!' };
        }

        // Kiểm tra từ khóa hệ thống
        const systemKeywords = ['admin', 'root', 'system', 'super', 'master'];
        const lowerTitle = sanitizedTitle.toLowerCase();
        if (systemKeywords.some(keyword => lowerTitle.includes(keyword))) {
            return { isValid: false, error: 'Tên nhóm quyền không được chứa từ khóa hệ thống!' };
        }

        return { isValid: true, value: sanitizedTitle };
    },

    // Validate description với bảo mật cao
    validateDescription: (description) => {
        if (!description) {
            return { isValid: true, value: '' }; // Description là optional
        }

        if (typeof description !== 'string') {
            return { isValid: false, error: 'Mô tả phải là chuỗi ký tự!' };
        }

        // Kiểm tra length trước khi xử lý
        if (description.length > 1000) {
            return { isValid: false, error: 'Mô tả không được vượt quá 1000 ký tự!' };
        }

        // Sanitize XSS
        const sanitizedDesc = xss(description.trim(), roleXssOptions);
        
        // Kiểm tra các pattern nguy hiểm
        const dangerCheck = checkDangerousPatterns(sanitizedDesc);
        if (!dangerCheck.isValid) {
            return { isValid: false, error: 'Mô tả chứa nội dung không hợp lệ!' };
        }

        // Validate độ dài sau khi sanitize
        if (sanitizedDesc.length > 500) {
            return { isValid: false, error: 'Mô tả không được vượt quá 500 ký tự!' };
        }

        return { isValid: true, value: sanitizedDesc };
    },

    // Validate permissions array với bảo mật nghiêm ngặt
    validatePermissions: (permissions) => {
        if (!permissions) {
            return { isValid: true, value: [] }; // Permissions có thể empty
        }

        // Kiểm tra type
        if (!Array.isArray(permissions)) {
            return { isValid: false, error: 'Quyền phải là một mảng!' };
        }

        // Kiểm tra độ dài mảng
        if (permissions.length > 50) {
            return { isValid: false, error: 'Số lượng quyền không được vượt quá 50!' };
        }

        const validatedPermissions = [];
        const seenPermissions = new Set();

        for (const permission of permissions) {
            // Kiểm tra type của từng permission
            if (typeof permission !== 'string') {
                return { isValid: false, error: 'Mỗi quyền phải là chuỗi ký tự!' };
            }

            // Kiểm tra length
            if (permission.length > 100) {
                return { isValid: false, error: 'Tên quyền không được vượt quá 100 ký tự!' };
            }

            // Sanitize
            const sanitizedPerm = xss(permission.trim(), roleXssOptions);
            
            // Kiểm tra empty sau sanitize
            if (!sanitizedPerm) {
                continue; // Bỏ qua permission empty
            }

            // Kiểm tra pattern nguy hiểm
            const dangerCheck = checkDangerousPatterns(sanitizedPerm);
            if (!dangerCheck.isValid) {
                return { isValid: false, error: `Quyền "${sanitizedPerm}" chứa nội dung không hợp lệ!` };
            }

            // Kiểm tra format permission (chỉ cho phép a-z, 0-9, underscore, hyphen)
            if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedPerm)) {
                return { isValid: false, error: `Quyền "${sanitizedPerm}" có format không hợp lệ!` };
            }

            // Kiểm tra permission có trong whitelist không
            if (!VALID_PERMISSIONS.includes(sanitizedPerm)) {
                return { isValid: false, error: `Quyền "${sanitizedPerm}" không được hỗ trợ trong hệ thống!` };
            }

            // Kiểm tra duplicate
            if (seenPermissions.has(sanitizedPerm)) {
                continue; // Bỏ qua duplicate
            }

            seenPermissions.add(sanitizedPerm);
            validatedPermissions.push(sanitizedPerm);
        }

        return { isValid: true, value: validatedPermissions };
    },

    // Validate role ID cho các operation edit/delete
    validateRoleId: async (id) => {
        if (!id) {
            return { isValid: false, error: 'ID nhóm quyền là bắt buộc!' };
        }

        // Validate ObjectId format
        const idValidation = validateObjectId(id);
        if (!idValidation.isValid) {
            return { isValid: false, error: 'ID nhóm quyền không hợp lệ!' };
        }

        try {
            // Kiểm tra role có tồn tại không
            const existingRole = await Role.findOne({ _id: id, deleted: false });
            if (!existingRole) {
                return { isValid: false, error: 'Nhóm quyền không tồn tại!' };
            }

            return { isValid: true, value: id, role: existingRole };
        } catch (error) {
            return { isValid: false, error: 'Lỗi kiểm tra nhóm quyền!' };
        }
    }
};

// [POST] /admin/roles/create - Validate tạo role mới
export async function validateCreatePost(req, res, next) {
    try {
        // Kiểm tra rate limiting
        const rateLimitCheck = checkRateLimit(req, 'role_create', 10, 60000); // 10 requests/minute
        if (!rateLimitCheck.isValid) {
            req.flash('error', 'Quá nhiều yêu cầu! Vui lòng thử lại sau.');
            return res.redirect('back');
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ['title'], ['description', 'permissions']);
        if (!bodyValidation.isValid) {
            req.flash('error', bodyValidation.error);
            return res.redirect('back');
        }

        const errors = [];
        const validatedData = {};

        // Validate title
        const titleValidation = roleValidateHelpers.validateTitle(req.body.title);
        if (!titleValidation.isValid) {
            errors.push(titleValidation.error);
        } else {
            validatedData.title = titleValidation.value;
        }

        // Validate description
        const descValidation = roleValidateHelpers.validateDescription(req.body.description);
        if (!descValidation.isValid) {
            errors.push(descValidation.error);
        } else {
            validatedData.description = descValidation.value;
        }

        // Validate permissions
        const permValidation = roleValidateHelpers.validatePermissions(req.body.permissions);
        if (!permValidation.isValid) {
            errors.push(permValidation.error);
        } else {
            validatedData.permissions = permValidation.value;
        }

        // Kiểm tra title có trùng không
        if (validatedData.title) {
            const existingRole = await Role.findOne({ 
                title: validatedData.title, 
                deleted: false 
            });
            if (existingRole) {
                errors.push('Tên nhóm quyền đã tồn tại!');
            }
        }

        if (errors.length > 0) {
            req.flash('error', errors.join(' '));
            return res.redirect('back');
        }

        // Gán dữ liệu đã validate vào req.body
        req.body = validatedData;
        next();

    } catch (error) {
        console.error('Role create validation error:', error);
        req.flash('error', 'Lỗi xác thực dữ liệu!');
        return res.redirect('back');
    }
}

// [PATCH] /admin/roles/edit/:id - Validate cập nhật role
export async function validateEditPatch(req, res, next) {
    try {
        // Kiểm tra rate limiting
        const rateLimitCheck = checkRateLimit(req, 'role_edit', 20, 60000); // 20 requests/minute
        if (!rateLimitCheck.isValid) {
            req.flash('error', 'Quá nhiều yêu cầu! Vui lòng thử lại sau.');
            return res.redirect('back');
        }

        // Validate role ID
        const idValidation = await roleValidateHelpers.validateRoleId(req.params.id);
        if (!idValidation.isValid) {
            req.flash('error', idValidation.error);
            return res.redirect('back');
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, [], ['title', 'description', 'permissions']);
        if (!bodyValidation.isValid) {
            req.flash('error', bodyValidation.error);
            return res.redirect('back');
        }

        const errors = [];
        const validatedData = {};

        // Validate title nếu có
        if (req.body.title !== undefined) {
            const titleValidation = roleValidateHelpers.validateTitle(req.body.title);
            if (!titleValidation.isValid) {
                errors.push(titleValidation.error);
            } else {
                validatedData.title = titleValidation.value;
                
                // Kiểm tra title có trùng không (trừ chính nó)
                const existingRole = await Role.findOne({ 
                    title: titleValidation.value, 
                    deleted: false,
                    _id: { $ne: req.params.id }
                });
                if (existingRole) {
                    errors.push('Tên nhóm quyền đã tồn tại!');
                }
            }
        }

        // Validate description nếu có
        if (req.body.description !== undefined) {
            const descValidation = roleValidateHelpers.validateDescription(req.body.description);
            if (!descValidation.isValid) {
                errors.push(descValidation.error);
            } else {
                validatedData.description = descValidation.value;
            }
        }

        // Validate permissions nếu có
        if (req.body.permissions !== undefined) {
            const permValidation = roleValidateHelpers.validatePermissions(req.body.permissions);
            if (!permValidation.isValid) {
                errors.push(permValidation.error);
            } else {
                validatedData.permissions = permValidation.value;
            }
        }

        if (errors.length > 0) {
            req.flash('error', errors.join(' '));
            return res.redirect('back');
        }

        // Gán dữ liệu đã validate vào req.body
        req.body = validatedData;
        req.validatedRole = idValidation.role;
        next();

    } catch (error) {
        console.error('Role edit validation error:', error);
        req.flash('error', 'Lỗi xác thực dữ liệu!');
        return res.redirect('back');
    }
}

// [DELETE] /admin/roles/delete/:id - Validate xóa role
export async function validateDelete(req, res, next) {
    try {
        // Kiểm tra rate limiting
        const rateLimitCheck = checkRateLimit(req, 'role_delete', 5, 60000); // 5 requests/minute
        if (!rateLimitCheck.isValid) {
            req.flash('error', 'Quá nhiều yêu cầu! Vui lòng thử lại sau.');
            return res.redirect('back');
        }

        // Validate role ID
        const idValidation = await roleValidateHelpers.validateRoleId(req.params.id);
        if (!idValidation.isValid) {
            req.flash('error', idValidation.error);
            return res.redirect('back');
        }

        // Kiểm tra role có đang được sử dụng không (có thể check với Account model)
        // TODO: Implement check if role is being used by accounts

        req.validatedRole = idValidation.role;
        next();

    } catch (error) {
        console.error('Role delete validation error:', error);
        req.flash('error', 'Lỗi xác thực dữ liệu!');
        return res.redirect('back');
    }
}

// [PATCH] /admin/roles/permissions - Validate cập nhật permissions
export async function validatePermissionsPatch(req, res, next) {
    try {
        // Kiểm tra rate limiting
        const rateLimitCheck = checkRateLimit(req, 'role_permissions', 10, 60000); // 10 requests/minute
        if (!rateLimitCheck.isValid) {
            req.flash('error', 'Quá nhiều yêu cầu! Vui lòng thử lại sau.');
            return res.redirect('back');
        }

        // Validate request body structure
        if (!req.body.permission) {
            req.flash('error', 'Dữ liệu phân quyền là bắt buộc!');
            return res.redirect('back');
        }

        let permissions;
        try {
            // Parse JSON với bảo mật
            permissions = JSON.parse(req.body.permission);
        } catch (error) {
            req.flash('error', 'Dữ liệu phân quyền không hợp lệ!');
            return res.redirect('back');
        }

        // Validate permissions structure
        if (!Array.isArray(permissions)) {
            req.flash('error', 'Dữ liệu phân quyền phải là mảng!');
            return res.redirect('back');
        }

        if (permissions.length > 20) {
            req.flash('error', 'Số lượng role trong một lần cập nhật không được vượt quá 20!');
            return res.redirect('back');
        }

        const validatedPermissions = [];
        const processedIds = new Set();

        for (const item of permissions) {
            // Validate structure của từng item
            if (!item || typeof item !== 'object') {
                req.flash('error', 'Cấu trúc dữ liệu phân quyền không hợp lệ!');
                return res.redirect('back');
            }

            // Validate id
            const idValidation = await roleValidateHelpers.validateRoleId(item.id);
            if (!idValidation.isValid) {
                req.flash('error', `Role ID "${item.id}" không hợp lệ!`);
                return res.redirect('back');
            }

            // Kiểm tra duplicate ID
            if (processedIds.has(item.id)) {
                continue; // Bỏ qua duplicate
            }
            processedIds.add(item.id);

            // Validate permissions của role này
            const permValidation = roleValidateHelpers.validatePermissions(item.permissions);
            if (!permValidation.isValid) {
                req.flash('error', `Quyền của role "${idValidation.role.title}" không hợp lệ: ${permValidation.error}`);
                return res.redirect('back');
            }

            validatedPermissions.push({
                id: item.id,
                permissions: permValidation.value
            });
        }

        if (validatedPermissions.length === 0) {
            req.flash('error', 'Không có dữ liệu phân quyền hợp lệ để cập nhật!');
            return res.redirect('back');
        }

        // Gán dữ liệu đã validate
        req.validatedPermissions = validatedPermissions;
        next();

    } catch (error) {
        console.error('Role permissions validation error:', error);
        req.flash('error', 'Lỗi xác thực dữ liệu phân quyền!');
        return res.redirect('back');
    }
}

// [GET] /admin/roles/edit/:id - Validate ID cho trang edit
export async function validateEditGet(req, res, next) {
    try {
        // Validate role ID
        const idValidation = await roleValidateHelpers.validateRoleId(req.params.id);
        if (!idValidation.isValid) {
            req.flash('error', idValidation.error);
            return res.redirect(`/admin/roles`);
        }

        req.validatedRole = idValidation.role;
        next();

    } catch (error) {
        console.error('Role edit get validation error:', error);
        req.flash('error', 'Lỗi xác thực dữ liệu!');
        return res.redirect(`/admin/roles`);
    }
}

// [GET] /admin/roles/detail/:id - Validate ID cho trang detail
export async function validateDetailGet(req, res, next) {
    try {
        // Validate role ID
        const idValidation = await roleValidateHelpers.validateRoleId(req.params.id);
        if (!idValidation.isValid) {
            req.flash('error', idValidation.error);
            return res.redirect(`/admin/roles`);
        }

        req.validatedRole = idValidation.role;
        next();

    } catch (error) {
        console.error('Role detail get validation error:', error);
        req.flash('error', 'Lỗi xác thực dữ liệu!');
        return res.redirect(`/admin/roles`);
    }
}

export default {
    validateCreatePost,
    validateEditPatch,
    validateDelete,
    validatePermissionsPatch,
    validateEditGet,
    validateDetailGet
};
