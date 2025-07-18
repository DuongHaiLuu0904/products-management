import xss from 'xss'

// Regex patterns cho validation chặt chẽ
const PATTERNS = {
    // Tên đầy đủ: chỉ cho phép chữ cái, khoảng trắng, dấu tiếng Việt
    fullName: /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]{2,50}$/,
    // Mật khẩu: ít nhất 8 ký tự, có chữ hoa, chữ thường, số
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,128}$/,
    // Phone number Việt Nam
    phone: /^(0[3|5|7|8|9])+([0-9]{8})$/,
    // Email pattern - đơn giản nhưng đủ dùng cho hầu hết trường hợp
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
}

// Danh sách các trường được phép
const ALLOWED_FIELDS = ['fullName', 'email', 'password', 'phone', 'avatar']

// Danh sách MIME types được phép cho avatar
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

// Kích thước file tối đa (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Sanitize input để loại bỏ các ký tự nguy hiểm
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input
    
    return xss(input.trim())
}

/**
 * Validate fullName
 */
function validateFullName(fullName) {
    if (!fullName) {
        return { isValid: false, message: 'Vui lòng nhập họ tên!' }
    }
    
    const sanitized = sanitizeInput(fullName)
    
    if (sanitized.length < 2) {
        return { isValid: false, message: 'Họ tên phải có ít nhất 2 ký tự!' }
    }
    
    if (sanitized.length > 50) {
        return { isValid: false, message: 'Họ tên không được vượt quá 50 ký tự!' }
    }
    
    if (!PATTERNS.fullName.test(sanitized)) {
        return { isValid: false, message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng!' }
    }
    
    return { isValid: true, value: sanitized }
}

/**
 * Validate email
 */
function validateEmail(email) {
    if (!email) {
        return { isValid: false, message: 'Vui lòng nhập email!' }
    }
    
    const sanitized = sanitizeInput(email)
    
    if (!PATTERNS.email.test(sanitized)) {
        return { isValid: false, message: 'Email không hợp lệ!' }
    }
    
    if (sanitized.length > 100) {
        return { isValid: false, message: 'Email không được vượt quá 100 ký tự!' }
    }
    
    // Kiểm tra domain blacklist (có thể mở rộng)
    const blacklistedDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com']
    const domain = sanitized.split('@')[1]
    if (blacklistedDomains.includes(domain)) {
        return { isValid: false, message: 'Email từ domain này không được phép!' }
    }
    
    return { isValid: true, value: sanitized.toLowerCase() }
}

/**
 * Validate password
 */
function validatePassword(password) {
    if (!password) {
        return { isValid: true, value: undefined } // Mật khẩu có thể trống khi update
    }
    
    if (typeof password !== 'string') {
        return { isValid: false, message: 'Mật khẩu không hợp lệ!' }
    }
    
    if (password.length < 8) {
        return { isValid: false, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }
    }
    
    if (password.length > 128) {
        return { isValid: false, message: 'Mật khẩu không được vượt quá 128 ký tự!' }
    }
    
    if (!PATTERNS.password.test(password)) {
        return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số!' }
    }
    
    // Kiểm tra mật khẩu phổ biến
    const commonPasswords = ['12345678', 'password', 'Password1', '123456789', 'qwertyui']
    if (commonPasswords.includes(password)) {
        return { isValid: false, message: 'Mật khẩu này quá phổ biến, vui lòng chọn mật khẩu khác!' }
    }
    
    return { isValid: true, value: password }
}

/**
 * Validate phone
 */
function validatePhone(phone) {
    if (!phone) {
        return { isValid: true, value: undefined } // Phone có thể trống
    }
    
    const sanitized = sanitizeInput(phone.toString())
    
    if (!PATTERNS.phone.test(sanitized)) {
        return { isValid: false, message: 'Số điện thoại không hợp lệ!' }
    }
    
    return { isValid: true, value: sanitized }
}

/**
 * Validate file avatar
 */
function validateAvatar(file) {
    if (!file) {
        return { isValid: true, value: undefined }
    }
    
    // Kiểm tra MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return { isValid: false, message: 'Chỉ chấp nhận file ảnh định dạng JPG, PNG, GIF, WEBP!' }
    }
    
    // Kiểm tra kích thước file
    if (file.size > MAX_FILE_SIZE) {
        return { isValid: false, message: 'Kích thước ảnh không được vượt quá 5MB!' }
    }
    
    // Kiểm tra extension từ filename
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
        return { isValid: false, message: 'Định dạng file không được hỗ trợ!' }
    }
    
    return { isValid: true, value: file }
}

/**
 * Middleware validate cho việc cập nhật my-account
 */
export async function editPatch(req, res, next) {
    try {
        // Chỉ cho phép các trường được định nghĩa
        const sanitizedBody = {}
        
        // Loại bỏ các trường không được phép
        for (const key in req.body) {
            if (ALLOWED_FIELDS.includes(key)) {
                sanitizedBody[key] = req.body[key]
            }
        }
        
        req.body = sanitizedBody
        
        // Validate từng trường
        const validations = []
        
        // Validate fullName (bắt buộc)
        if (req.body.fullName !== undefined) {
            const fullNameValidation = validateFullName(req.body.fullName)
            if (!fullNameValidation.isValid) {
                validations.push(fullNameValidation.message)
            } else {
                req.body.fullName = fullNameValidation.value
            }
        }
        
        // Validate email (bắt buộc)
        if (req.body.email !== undefined) {
            const emailValidation = validateEmail(req.body.email)
            if (!emailValidation.isValid) {
                validations.push(emailValidation.message)
            } else {
                req.body.email = emailValidation.value
            }
        }
        
        // Validate password (tùy chọn)
        if (req.body.password !== undefined) {
            const passwordValidation = validatePassword(req.body.password)
            if (!passwordValidation.isValid) {
                validations.push(passwordValidation.message)
            } else if (passwordValidation.value === undefined) {
                delete req.body.password
            } else {
                req.body.password = passwordValidation.value
            }
        }
        
        // Validate phone (tùy chọn)
        if (req.body.phone !== undefined) {
            const phoneValidation = validatePhone(req.body.phone)
            if (!phoneValidation.isValid) {
                validations.push(phoneValidation.message)
            } else if (phoneValidation.value === undefined) {
                delete req.body.phone
            } else {
                req.body.phone = phoneValidation.value
            }
        }
        
        // Validate avatar file
        if (req.file) {
            const avatarValidation = validateAvatar(req.file)
            if (!avatarValidation.isValid) {
                validations.push(avatarValidation.message)
            }
        }
        
        // Nếu có lỗi validation
        if (validations.length > 0) {
            req.flash('error', validations[0]) // Hiển thị lỗi đầu tiên
            const backURL = req.get("Referrer") || "/admin/my-account"
            res.redirect(backURL)
            return
        }
        
        // Đảm bảo không có trường nguy hiểm nào khác
        const dangerousFields = ['role_id', 'deleted', 'token', '_id', 'id']
        dangerousFields.forEach(field => {
            delete req.body[field]
        })
        
        next()
        
    } catch (error) {
        console.error('Validation error:', error)
        req.flash('error', 'Dữ liệu không hợp lệ!')
        const backURL = req.get("Referrer") || "/admin/my-account"
        res.redirect(backURL)
    }
}
