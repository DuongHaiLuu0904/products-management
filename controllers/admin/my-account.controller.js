import md5 from 'md5'
import Account from '../../models/account.model.js'
import cloudinaryHelper from '../../helpers/uploadToCloudinary.js'

export async function index(req, res) {
    res.render('admin/pages/my-account/index', {
        title: 'Tài khoản'
    });
}

// [GET] /admin/my-account/edit
export async function edit(req, res) {
    res.render('admin/pages/my-account/edit', {
        title: 'Cập nhật tài khoản'
    });
}

// [PATCH] /admin/my-account/edit
export async function editPatch(req, res) {
    try {
        const id = res.locals.user.id

        const emailExist = await Account.findOne({
            _id: { $ne: id },
            email: req.body.email,
            deleted: false 
        })
    
        if (emailExist) {
            req.flash('error', 'Email đã tồn tại!');
        } else {
            if(req.body.password) {
                req.body.password = md5(req.body.password)
            } else {
                delete req.body.password
            }
            
            // Xử lý file avatar
            if (req.file && req.file.path) {
                // Xóa ảnh cũ trên Cloudinary nếu có
                const user = await Account.findById(id);
                if (user.avatar) {
                    const publicId = user.avatar.split('/').pop().split('.')[0];
                    await cloudinaryHelper.deleteFromCloudinary(publicId);
                }
                req.body.avatar = req.file.path;
            }
            
            await Account.updateOne({ _id: id }, req.body)
            req.flash('success', 'Cập nhật thành công!');
        }

        res.redirect(req.get("Referrer") || "/");
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
        res.redirect(req.get("Referrer") || "/");
    }
}
