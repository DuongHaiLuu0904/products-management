import validator from 'validator'
import xss from 'xss'
import { 
    sanitizeAndValidate, 
    validateEmail, 
    validatePassword,
    validateObjectId,
    checkRateLimit,
    validateRequestBody
} from './common.validate.js'

// Cấu hình XSS filter nghiêm ngặt
const xssOptions = {
    whiteList: {}, // Không cho phép bất kỳ HTML tag nào
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    allowCommentTag: false,
    escapeHtml: true
}

// Danh sách các trường được phép cho user
const ALLOWED_USER_FIELDS = [
    'fullName', 'email', 'password', 'phone', 'avatar', 'status',
    'address', 'dateOfBirth', 'gender', 'description'
]

// Validate fullName với các kiểm tra bảo mật
function validateFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return { isValid: false, error: 'Họ tên là bắt buộc và phải là chuỗi ký tự!' }
    }

    const result = sanitizeAndValidate(fullName, 100, { 
        minLength: 2,
        isAlphanumeric: false // Cho phép khoảng trắng và dấu
    })

    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') }
    }

    // Kiểm tra chỉ chứa chữ cái, khoảng trắng và một số ký tự đặc biệt của tiếng Việt
    const vietnameseNamePattern = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s\-\.\']+$/
    
    if (!vietnameseNamePattern.test(result.value)) {
        return { isValid: false, error: 'Họ tên chỉ được chứa chữ cái, khoảng trắng và một số ký tự đặc biệt!' }
    }

    // Kiểm tra độ dài từng từ
    const words = result.value.split(/\s+/).filter(word => word.length > 0)
    if (words.length < 2) {
        return { isValid: false, error: 'Họ tên phải có ít nhất 2 từ!' }
    }

    for (const word of words) {
        if (word.length < 1 || word.length > 30) {
            return { isValid: false, error: 'Mỗi từ trong họ tên phải từ 1-30 ký tự!' }
        }
    }

    // Capitalize first letter của mỗi từ
    const capitalizedName = words.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')

    return { isValid: true, value: capitalizedName }
}

// Validate phone number với các kiểm tra bảo mật
function validatePhoneNumber(phone) {
    if (!phone) {
        return { isValid: true, value: '' } // Phone is optional
    }

    if (typeof phone !== 'string') {
        return { isValid: false, error: 'Số điện thoại phải là chuỗi ký tự!' }
    }

    const result = sanitizeAndValidate(phone, 20, { isNumeric: false })
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') }
    }

    // Loại bỏ các ký tự không phải số
    const cleanedPhone = result.value.replace(/[^\d+\-\s\(\)]/g, '')
    
    // Kiểm tra format số điện thoại Việt Nam
    const phonePattern = /^(\+84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])(\d{7})$/
    const normalizedPhone = cleanedPhone.replace(/[\s\-\(\)+]/g, '')

    if (!phonePattern.test(normalizedPhone)) {
        return { isValid: false, error: 'Số điện thoại không đúng định dạng Việt Nam!' }
    }

    // Chuyển về format chuẩn
    let formattedPhone = normalizedPhone
    if (formattedPhone.startsWith('84')) {
        formattedPhone = '+' + formattedPhone
    } else if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone
    }

    return { isValid: true, value: formattedPhone }
}

// Validate address
function validateAddress(address) {
    if (!address) {
        return { isValid: true, value: '' } // Address is optional
    }

    if (typeof address !== 'string') {
        return { isValid: false, error: 'Địa chỉ phải là chuỗi ký tự!' }
    }

    const result = sanitizeAndValidate(address, 500, { minLength: 5 })
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') }
    }

    // Kiểm tra có chứa ít nhất một số (số nhà)
    if (!/\d/.test(result.value)) {
        return { isValid: false, error: 'Địa chỉ phải chứa số nhà!' }
    }

    return { isValid: true, value: result.value }
}

// Validate date of birth
function validateDateOfBirth(dateOfBirth) {
    if (!dateOfBirth) {
        return { isValid: true, value: null } // Optional field
    }

    if (typeof dateOfBirth !== 'string') {
        return { isValid: false, error: 'Ngày sinh phải là chuỗi ký tự!' }
    }

    const result = sanitizeAndValidate(dateOfBirth, 20)
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') }
    }

    // Kiểm tra format ngày
    if (!validator.isDate(result.value)) {
        return { isValid: false, error: 'Ngày sinh không đúng định dạng!' }
    }

    const birthDate = new Date(result.value)
    const now = new Date()
    const age = now.getFullYear() - birthDate.getFullYear()

    // Kiểm tra tuổi hợp lý
    if (age < 13 || age > 120) {
        return { isValid: false, error: 'Tuổi phải từ 13 đến 120!' }
    }

    // Kiểm tra ngày không được trong tương lai
    if (birthDate > now) {
        return { isValid: false, error: 'Ngày sinh không được ở tương lai!' }
    }

    return { isValid: true, value: birthDate }
}

// Validate gender
function validateGender(gender) {
    if (!gender) {
        return { isValid: true, value: '' } // Optional field
    }

    const validGenders = ['male', 'female', 'other']
    const result = sanitizeAndValidate(gender, 10)
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') }
    }

    if (!validGenders.includes(result.value.toLowerCase())) {
        return { isValid: false, error: 'Giới tính không hợp lệ!' }
    }

    return { isValid: true, value: result.value.toLowerCase() }
}

// Validate status
function validateStatus(status) {
    if (status === undefined || status === null) {
        return { isValid: true, value: 'active' } // Default status
    }

    const validStatuses = ['active', 'inactive']
    const result = sanitizeAndValidate(String(status), 20)
    
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') }
    }

    if (!validStatuses.includes(result.value.toLowerCase())) {
        return { isValid: false, error: 'Trạng thái không hợp lệ!' }
    }

    return { isValid: true, value: result.value.toLowerCase() }
}

// Validate description
function validateDescription(description) {
    if (!description) {
        return { isValid: true, value: '' } // Optional field
    }

    if (typeof description !== 'string') {
        return { isValid: false, error: 'Mô tả phải là chuỗi ký tự!' }
    }

    const result = sanitizeAndValidate(description, 1000)
    if (!result.isValid) {
        return { isValid: false, error: result.errors.join(', ') }
    }

    return { isValid: true, value: result.value }
}

// Middleware để validate tạo user mới
export async function validateCreatePost(req, res, next) {
    try {
        // Rate limiting cho create user
        const clientKey = req.ip || 'unknown'
        if (!checkRateLimit(`user_create_${clientKey}`, 5, 300000)) { // 5 requests per 5 minutes
            return res.status(429).json({ 
                error: 'Quá nhiều yêu cầu tạo tài khoản. Vui lòng thử lại sau 5 phút!' 
            })
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_USER_FIELDS, 10)
        if (!bodyValidation.isValid) {
            req.flash('error', bodyValidation.errors.join(', '))
            return res.redirect('back')
        }

        const errors = []
        const sanitizedData = {}

        // Validate required fields
        const requiredFields = ['fullName', 'email', 'password']
        for (const field of requiredFields) {
            if (!req.body[field]) {
                errors.push(`${field === 'fullName' ? 'Họ tên' : 
                           field === 'email' ? 'Email' : 'Mật khẩu'} là bắt buộc!`)
            }
        }

        if (errors.length > 0) {
            req.flash('error', errors.join(', '))
            return res.redirect('back')
        }

        // Validate fullName
        const fullNameValidation = validateFullName(req.body.fullName)
        if (!fullNameValidation.isValid) {
            errors.push(fullNameValidation.error)
        } else {
            sanitizedData.fullName = fullNameValidation.value
        }

        // Validate email
        const emailValidation = validateEmail(req.body.email)
        if (!emailValidation.isValid) {
            errors.push(emailValidation.errors.join(', '))
        } else {
            sanitizedData.email = emailValidation.value
        }

        // Validate password
        const passwordValidation = validatePassword(req.body.password, {
            minLength: 6,
            maxLength: 128,
            requireSpecialChar: true,
            requireNumber: true,
            requireUppercase: true
        })
        if (!passwordValidation.isValid) {
            errors.push(passwordValidation.errors.join(', '))
        } else {
            sanitizedData.password = passwordValidation.value
        }

        // Validate optional fields
        if (req.body.phone) {
            const phoneValidation = validatePhoneNumber(req.body.phone)
            if (!phoneValidation.isValid) {
                errors.push(phoneValidation.error)
            } else {
                sanitizedData.phone = phoneValidation.value
            }
        }

        if (req.body.address) {
            const addressValidation = validateAddress(req.body.address)
            if (!addressValidation.isValid) {
                errors.push(addressValidation.error)
            } else {
                sanitizedData.address = addressValidation.value
            }
        }

        if (req.body.dateOfBirth) {
            const dobValidation = validateDateOfBirth(req.body.dateOfBirth)
            if (!dobValidation.isValid) {
                errors.push(dobValidation.error)
            } else {
                sanitizedData.dateOfBirth = dobValidation.value
            }
        }

        if (req.body.gender) {
            const genderValidation = validateGender(req.body.gender)
            if (!genderValidation.isValid) {
                errors.push(genderValidation.error)
            } else {
                sanitizedData.gender = genderValidation.value
            }
        }

        if (req.body.description) {
            const descValidation = validateDescription(req.body.description)
            if (!descValidation.isValid) {
                errors.push(descValidation.error)
            } else {
                sanitizedData.description = descValidation.value
            }
        }

        // Validate status
        const statusValidation = validateStatus(req.body.status)
        if (!statusValidation.isValid) {
            errors.push(statusValidation.error)
        } else {
            sanitizedData.status = statusValidation.value
        }

        if (errors.length > 0) {
            req.flash('error', errors.join(', '))
            return res.redirect('back')
        }

        // Replace req.body with sanitized data
        req.body = sanitizedData
        next()

    } catch (error) {
        console.error('Validation error in createPost:', error)
        req.flash('error', 'Có lỗi xảy ra khi xử lý dữ liệu!')
        return res.redirect('back')
    }
}

// Middleware để validate cập nhật user
export async function validateEditPatch(req, res, next) {
    try {
        // Rate limiting cho edit user
        const clientKey = req.ip || 'unknown'
        if (!checkRateLimit(`user_edit_${clientKey}`, 10, 300000)) { // 10 requests per 5 minutes
            return res.status(429).json({ 
                error: 'Quá nhiều yêu cầu cập nhật. Vui lòng thử lại sau 5 phút!' 
            })
        }

        // Validate user ID từ params
        const idValidation = validateObjectId(req.params.id)
        if (!idValidation.isValid) {
            req.flash('error', idValidation.error)
            return res.redirect('back')
        }

        // Validate request body structure
        const bodyValidation = validateRequestBody(req.body, ALLOWED_USER_FIELDS, 10)
        if (!bodyValidation.isValid) {
            req.flash('error', bodyValidation.errors.join(', '))
            return res.redirect('back')
        }

        const errors = []
        const sanitizedData = {}

        // Validate fullName (required nếu có)
        if (req.body.fullName !== undefined) {
            if (!req.body.fullName) {
                errors.push('Họ tên không được để trống!')
            } else {
                const fullNameValidation = validateFullName(req.body.fullName)
                if (!fullNameValidation.isValid) {
                    errors.push(fullNameValidation.error)
                } else {
                    sanitizedData.fullName = fullNameValidation.value
                }
            }
        }

        // Validate email (required nếu có)
        if (req.body.email !== undefined) {
            if (!req.body.email) {
                errors.push('Email không được để trống!')
            } else {
                const emailValidation = validateEmail(req.body.email)
                if (!emailValidation.isValid) {
                    errors.push(emailValidation.errors.join(', '))
                } else {
                    sanitizedData.email = emailValidation.value
                }
            }
        }

        // Validate password (nếu có thay đổi)
        if (req.body.password !== undefined && req.body.password !== '') {
            const passwordValidation = validatePassword(req.body.password, {
                minLength: 6,
                maxLength: 128,
                requireSpecialChar: true,
                requireNumber: true,
                requireUppercase: true
            })
            if (!passwordValidation.isValid) {
                errors.push(passwordValidation.errors.join(', '))
            } else {
                sanitizedData.password = passwordValidation.value
            }
        }

        // Validate optional fields (tương tự create)
        if (req.body.phone !== undefined) {
            const phoneValidation = validatePhoneNumber(req.body.phone)
            if (!phoneValidation.isValid) {
                errors.push(phoneValidation.error)
            } else {
                sanitizedData.phone = phoneValidation.value
            }
        }

        if (req.body.address !== undefined) {
            const addressValidation = validateAddress(req.body.address)
            if (!addressValidation.isValid) {
                errors.push(addressValidation.error)
            } else {
                sanitizedData.address = addressValidation.value
            }
        }

        if (req.body.dateOfBirth !== undefined) {
            const dobValidation = validateDateOfBirth(req.body.dateOfBirth)
            if (!dobValidation.isValid) {
                errors.push(dobValidation.error)
            } else {
                sanitizedData.dateOfBirth = dobValidation.value
            }
        }

        if (req.body.gender !== undefined) {
            const genderValidation = validateGender(req.body.gender)
            if (!genderValidation.isValid) {
                errors.push(genderValidation.error)
            } else {
                sanitizedData.gender = genderValidation.value
            }
        }

        if (req.body.description !== undefined) {
            const descValidation = validateDescription(req.body.description)
            if (!descValidation.isValid) {
                errors.push(descValidation.error)
            } else {
                sanitizedData.description = descValidation.value
            }
        }

        if (req.body.status !== undefined) {
            const statusValidation = validateStatus(req.body.status)
            if (!statusValidation.isValid) {
                errors.push(statusValidation.error)
            } else {
                sanitizedData.status = statusValidation.value
            }
        }

        if (errors.length > 0) {
            req.flash('error', errors.join(', '))
            return res.redirect('back')
        }

        // Replace req.body with sanitized data
        req.body = sanitizedData
        next()

    } catch (error) {
        console.error('Validation error in editPatch:', error)
        req.flash('error', 'Có lỗi xảy ra khi xử lý dữ liệu!')
        return res.redirect('back')
    }
}

// Middleware để validate thay đổi status
export async function validateChangeStatus(req, res, next) {
    try {
        // Rate limiting
        const clientKey = req.ip || 'unknown'
        if (!checkRateLimit(`user_status_${clientKey}`, 20, 300000)) { // 20 requests per 5 minutes
            return res.status(429).json({ 
                error: 'Quá nhiều yêu cầu thay đổi trạng thái!' 
            })
        }

        // Validate user ID
        const idValidation = validateObjectId(req.params.id)
        if (!idValidation.isValid) {
            return res.status(400).json({ error: idValidation.error })
        }

        // Validate status
        const statusValidation = validateStatus(req.params.status)
        if (!statusValidation.isValid) {
            return res.status(400).json({ error: statusValidation.error })
        }

        req.params.status = statusValidation.value
        next()

    } catch (error) {
        console.error('Validation error in changeStatus:', error)
        return res.status(500).json({ error: 'Có lỗi xảy ra khi xử lý dữ liệu!' })
    }
}

// Middleware để validate xóa user
export async function validateDelete(req, res, next) {
    try {
        // Rate limiting nghiêm ngặt cho delete
        const clientKey = req.ip || 'unknown'
        if (!checkRateLimit(`user_delete_${clientKey}`, 3, 300000)) { // 3 requests per 5 minutes
            return res.status(429).json({ 
                error: 'Quá nhiều yêu cầu xóa tài khoản!' 
            })
        }

        // Validate user ID
        const idValidation = validateObjectId(req.params.id)
        if (!idValidation.isValid) {
            return res.status(400).json({ error: idValidation.error })
        }

        next()

    } catch (error) {
        console.error('Validation error in delete:', error)
        return res.status(500).json({ error: 'Có lỗi xảy ra khi xử lý dữ liệu!' })
    }
}

// Middleware để validate xem chi tiết user
export async function validateDetail(req, res, next) {
    try {
        // Validate user ID
        const idValidation = validateObjectId(req.params.id)
        if (!idValidation.isValid) {
            req.flash('error', idValidation.error)
            return res.redirect('back')
        }

        next()

    } catch (error) {
        console.error('Validation error in detail:', error)
        req.flash('error', 'Có lỗi xảy ra khi xử lý dữ liệu!')
        return res.redirect('back')
    }
}

// Export aliases để tương thích với route
export async function createPost(req, res, next) {
    return validateCreatePost(req, res, next)
}

export async function editPatch(req, res, next) {
    return validateEditPatch(req, res, next)
}

export default {
    validateCreatePost,
    validateEditPatch,
    validateChangeStatus,
    validateDelete,
    validateDetail,
    createPost,
    editPatch
}
