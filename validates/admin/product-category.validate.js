import { isValidObjectId } from 'mongoose'
import xss from 'xss'

// Hàm helper để sanitize string
const sanitizeString = (str) => {
    if (typeof str !== 'string') return ''
    return xss(str.trim())
}

// Hàm helper để validate ObjectId
const isValidMongoId = (id) => {
    return id && typeof id === 'string' && isValidObjectId(id)
}

// Hàm helper để validate số nguyên dương
const isPositiveInteger = (num) => {
    const parsed = parseInt(num)
    return !isNaN(parsed) && parsed > 0 && parsed.toString() === num.toString()
}

// Validation cho việc tạo danh mục
export async function createPost(req, res, next) {
    const errors = []

    // Validate title
    if (!req.body.title || typeof req.body.title !== 'string') {
        errors.push('Tiêu đề là bắt buộc và phải là chuỗi ký tự')
    } else {
        const title = sanitizeString(req.body.title)
        if (title.length === 0) {
            errors.push('Tiêu đề không được để trống')
        } else if (title.length < 3) {
            errors.push('Tiêu đề phải có ít nhất 3 ký tự')
        } else if (title.length > 200) {
            errors.push('Tiêu đề không được vượt quá 200 ký tự')
        }
        req.body.title = title
    }

    // Validate description (optional)
    if (req.body.description !== undefined) {
        if (typeof req.body.description !== 'string') {
            errors.push('Mô tả phải là chuỗi ký tự')
        } else {
            const description = sanitizeString(req.body.description)
            if (description.length > 1000) {
                errors.push('Mô tả không được vượt quá 1000 ký tự')
            }
            req.body.description = description
        }
    }

    // Validate parent_id (optional)
    if (req.body.parent_id !== undefined && req.body.parent_id !== '') {
        if (!isValidMongoId(req.body.parent_id)) {
            errors.push('ID danh mục cha không hợp lệ')
        }
    }

    // Validate position (optional)
    if (req.body.position !== undefined && req.body.position !== '') {
        if (!isPositiveInteger(req.body.position)) {
            errors.push('Vị trí phải là số nguyên dương')
        } else {
            req.body.position = parseInt(req.body.position)
        }
    }

    // Validate status (optional)
    if (req.body.status !== undefined) {
        const validStatuses = ['active', 'inactive']
        if (!validStatuses.includes(req.body.status)) {
            errors.push('Trạng thái chỉ có thể là active hoặc inactive')
        }
    }

    // Validate featured (optional)
    if (req.body.featured !== undefined) {
        const validFeatured = ['true', 'false', true, false]
        if (!validFeatured.includes(req.body.featured)) {
            errors.push('Nổi bật chỉ có thể là true hoặc false')
        }
        req.body.featured = req.body.featured === 'true' || req.body.featured === true
    }

    // Validate slug (optional)
    if (req.body.slug !== undefined && req.body.slug !== '') {
        if (typeof req.body.slug !== 'string') {
            errors.push('Slug phải là chuỗi ký tự')
        } else {
            const slug = req.body.slug.trim().toLowerCase()
            const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
            if (!slugRegex.test(slug)) {
                errors.push('Slug chỉ được chứa chữ cái thường, số và dấu gạch ngang')
            }
            req.body.slug = slug
        }
    }

    // Xử lý lỗi
    if (errors.length > 0) {
        req.flash('error', errors.join('. '))
        const backURL = req.get("Referrer") || "/admin/products-category"
        res.redirect(backURL)
        return
    }

    next()
}

// Validation cho việc chỉnh sửa danh mục
export async function editPATCH(req, res, next) {
    const errors = []

    // Validate ID từ params
    if (!isValidMongoId(req.params.id)) {
        errors.push('ID danh mục không hợp lệ')
    }

    // Validate title (nếu có)
    if (req.body.title !== undefined) {
        if (typeof req.body.title !== 'string') {
            errors.push('Tiêu đề phải là chuỗi ký tự')
        } else {
            const title = sanitizeString(req.body.title)
            if (title.length === 0) {
                errors.push('Tiêu đề không được để trống')
            } else if (title.length < 3) {
                errors.push('Tiêu đề phải có ít nhất 3 ký tự')
            } else if (title.length > 200) {
                errors.push('Tiêu đề không được vượt quá 200 ký tự')
            }
            req.body.title = title
        }
    }

    // Validate description (nếu có)
    if (req.body.description !== undefined) {
        if (typeof req.body.description !== 'string') {
            errors.push('Mô tả phải là chuỗi ký tự')
        } else {
            const description = sanitizeString(req.body.description)
            if (description.length > 1000) {
                errors.push('Mô tả không được vượt quá 1000 ký tự')
            }
            req.body.description = description
        }
    }

    // Validate parent_id (nếu có)
    if (req.body.parent_id !== undefined && req.body.parent_id !== '') {
        if (!isValidMongoId(req.body.parent_id)) {
            errors.push('ID danh mục cha không hợp lệ')
        }
        // Kiểm tra không được set parent_id là chính nó
        if (req.body.parent_id === req.params.id) {
            errors.push('Danh mục không thể là danh mục cha của chính nó')
        }
    }

    // Validate position (nếu có)
    if (req.body.position !== undefined && req.body.position !== '') {
        if (!isPositiveInteger(req.body.position)) {
            errors.push('Vị trí phải là số nguyên dương')
        } else {
            req.body.position = parseInt(req.body.position)
        }
    }

    // Validate status (nếu có)
    if (req.body.status !== undefined) {
        const validStatuses = ['active', 'inactive']
        if (!validStatuses.includes(req.body.status)) {
            errors.push('Trạng thái chỉ có thể là active hoặc inactive')
        }
    }

    // Validate featured (nếu có)
    if (req.body.featured !== undefined) {
        const validFeatured = ['true', 'false', true, false]
        if (!validFeatured.includes(req.body.featured)) {
            errors.push('Nổi bật chỉ có thể là true hoặc false')
        }
        req.body.featured = req.body.featured === 'true' || req.body.featured === true
    }

    // Validate slug (nếu có)
    if (req.body.slug !== undefined && req.body.slug !== '') {
        if (typeof req.body.slug !== 'string') {
            errors.push('Slug phải là chuỗi ký tự')
        } else {
            const slug = req.body.slug.trim().toLowerCase()
            const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
            if (!slugRegex.test(slug)) {
                errors.push('Slug chỉ được chứa chữ cái thường, số và dấu gạch ngang')
            }
            req.body.slug = slug
        }
    }

    // Xử lý lỗi
    if (errors.length > 0) {
        req.flash('error', errors.join('. '))
        const backURL = req.get("Referrer") || `/admin/products-category/edit/${req.params.id}`
        res.redirect(backURL)
        return
    }

    next()
}

// Validation cho thay đổi trạng thái
export async function validateChangeStatus(req, res, next) {
    const errors = []

    // Validate ID
    if (!isValidMongoId(req.params.id)) {
        errors.push('ID danh mục không hợp lệ')
    }

    // Validate status
    const validStatuses = ['active', 'inactive']
    if (!validStatuses.includes(req.params.status)) {
        errors.push('Trạng thái chỉ có thể là active hoặc inactive')
    }

    // Xử lý lỗi
    if (errors.length > 0) {
        res.status(400).json({
            code: 400,
            message: errors.join('. ')
        })
        return
    }

    next()
}

// Validation cho thay đổi nhiều item
export async function validateChangeMulti(req, res, next) {
    const errors = []

    // Validate ids
    if (!req.body.ids || !Array.isArray(req.body.ids)) {
        errors.push('Danh sách ID phải là một mảng')
    } else {
        for (const id of req.body.ids) {
            if (!isValidMongoId(id)) {
                errors.push(`ID ${id} không hợp lệ`)
                break
            }
        }
        // Giới hạn số lượng item có thể thay đổi cùng lúc
        if (req.body.ids.length > 100) {
            errors.push('Không thể thay đổi quá 100 item cùng lúc')
        }
    }

    // Validate type
    const validTypes = ['active', 'inactive', 'delete-all']
    if (!req.body.type || !validTypes.includes(req.body.type)) {
        errors.push('Loại thao tác không hợp lệ')
    }

    // Xử lý lỗi
    if (errors.length > 0) {
        res.status(400).json({
            code: 400,
            message: errors.join('. ')
        })
        return
    }

    next()
}

// Validation cho xóa item
export async function validateDelete(req, res, next) {
    const errors = []

    // Validate ID
    if (!isValidMongoId(req.params.id)) {
        errors.push('ID danh mục không hợp lệ')
    }

    // Xử lý lỗi
    if (errors.length > 0) {
        res.status(400).json({
            code: 400,
            message: errors.join('. ')
        })
        return
    }

    next()
}

// Export default object chứa tất cả validation functions
export default {
    createPost,
    editPATCH,
    validateChangeStatus,
    validateChangeMulti,
    validateDelete
}