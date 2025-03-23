const md5 = require('md5')
const Account = require('../../models/account.model')
const Role = require("../../models/role.model")

const systemConfix = require("../../config/system")

module.exports.index = async (req, res) => {
    res.render('admin/pages/my-account/index', {
        title: 'Tài khoản'
    });
}


// [GET] /admin/my-account/edit
module.exports.edit = async (req, res) => {
    res.render('admin/pages/my-account/edit', {
        title: 'Cập nhật tài khoản'
    });
}

// [PATCH] /admin/my-account/edit
module.exports.editPatch = async (req, res) => {
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
