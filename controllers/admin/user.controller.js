const User = require("../../models/user.model")
const md5 = require('md5')

const systemConfix = require("../../config/system")

module.exports.index = async (req, res) => {
    let find = {
        deleted: false
    }

    const records = await User.find(find).select('-password -token')

    res.render('admin/pages/user/index', {
        title: 'Tài khoản client',
        records: records
    });
}

// [GET] /admin/users/create
module.exports.create = async (req, res) => {
    
    res.render('admin/pages/user/create', {
        title: 'Thêm tài khoản',
    });
}

// [POST] /admin/users/createPost
module.exports.createPost = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("users_create")) {
        req.flash('error', 'Bạn không có quyền tạo tài khoản!');
        return
    }

    const emmailExist = await User.findOne({
        email: req.body.email,
        deleted: false 
    })

    if (emmailExist) {
        req.flash('error', 'Email đã tồn tại!');
        res.redirect(req.headers.referer)
        
    } else {
        req.body.password = md5(req.body.password)

        const record = new User(req.body)
        record.save()

        req.flash('success', 'Thêm mới thành công!');
        res.redirect(`${systemConfix.prefixAdmin}/users`);
    }
}

// [GET] /admin/users/edit/:id
module.exports.edit = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("users_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }

    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }

        const data = await User.findOne(find)
    
        res.render('admin/pages/user/edit', {
            title: 'Chỉnh sửa tài khoản',
            data: data
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/users`);
    }
}

// [PATCH] /admin/users/edit/:id
module.exports.editPatch = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("users_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }

    try {
        const id = req.params.id

        const emailExist = await User.findOne({
            _id: { $ne: id },
            email: req.body.email,
            deleted: false 
        })
    
        if (emailExist) {
            req.flash('error', 'Email đã tồn tại!');
    
            res.redirect(req.headers.referer)
        } else {
            if(req.body.password) {
                req.body.password = md5(req.body.password)
            } else {
                delete req.body.password
            }

            await User.updateOne({ _id: id }, req.body)
            req.flash('success', 'Cập nhật thành công!');
            res.redirect(`${systemConfix.prefixAdmin}/users`);
        }
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
        res.redirect(`${systemConfix.prefixAdmin}/users`);
    }
}

// [PATCH] /admin/users/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("users_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }

    const status = req.params.status
    const id = req.params.id

    await User.updateOne({ _id: id }, { status: status })

    req.flash('success', 'Cập nhật trạng thái thành công!')

    res.redirect(req.headers.referer)
}

// [DELETE] /admin/users/delete/:id
module.exports.deleteItem = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("users_delete")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }

    const id = req.params.id
    
    await User.updateOne({ _id: id }, {
        deleted: true,
        deleteAt: new Date()
    })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    res.redirect(req.headers.referer)
}

// [GET] /admin/users/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const record = await User.findOne(find).select('-password -token')


        res.render('admin/pages/user/detail', {
            title: 'Chi tiết tài khoản',
            record: record
        });
    } catch (error) {
        console.log(error)
        res.redirect(`${systemConfix.prefixAdmin}/users`);
    }
}