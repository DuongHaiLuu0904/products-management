const Role = require("../../models/role.model")
const systemConfix = require("../../config/system")

// [GET] /admin/roles
module.exports.index = async (req, res) => {
    let find = {
        deleted: false
    }

    const records = await Role.find(find)

    res.render('admin/pages/roles/index', {
        title: 'Trang phân quyền',
        records: records
    });
}

// [GET] /admin/roles/create
module.exports.create = async (req, res) => {
    res.render('admin/pages/roles/create', {
        title: 'Thêm nhóm quyền'
    });
}

// [POST] /admin/roles/create
module.exports.createPost = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("roles_create")) {
        req.flash('error', 'Bạn không có quyền tạo nhóm quyền!');
        return
    }

    try {
        const record = new Role(req.body)
        record.save()

        req.flash('success', 'Thêm mới thành công!');
        res.redirect(`${systemConfix.prefixAdmin}/roles`);
    } catch (error) {
        req.flash('error', 'Thêm mới thất bại!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    }
}

// [GET] /admin/roles/edit
module.exports.edit = async (req, res) => {
    try {
        let find = {
            _id: req.params.id,
            deleted: false
        }

        const record = await Role.findOne(find)

        res.render('admin/pages/roles/edit', {
            title: 'Sửa nhóm quyền',
            record: record
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/roles`)
    }
}

// [PATCH] /admin/roles/edit
module.exports.editPatch = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("roles_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật nhóm quyền!');
        return
    }

    const id = req.params.id

    try {
        await Role.updateOne({ _id: id }, req.body)
        req.flash('success', 'Cập nhật thành công!');
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
    }

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/roles/detail
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const record = await Role.findOne(find)

        res.render('admin/pages/roles/detail', {
            title: 'Chi tiết Quyền',
            record: record
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/roles`);
    }
}

// [DELETE] /admin/products/change-status/:status/:id
module.exports.deleteItem = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("roles_delete")) {
        req.flash('error', 'Bạn không có quyền xóa nhóm quyền!');
        return
    }

    const id = req.params.id

    // await Product.deleteOne({_id: id})
    await Role.updateOne({ _id: id }, {
        deleted: true,
        deleteAt: new Date()
    })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    // res.location("back")
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/roles/permissions
module.exports.permissions = async (req, res) => {
    let find = {
        deleted: false
    }

    const records = await Role.find(find)

    res.render('admin/pages/roles/permissions', {
        title: 'Phân quyền',
        records: records
    });
}

// [PATCH] /admin/roles/permissions
module.exports.permissionsPatch = async (req, res) => {
    const permission = res.locals.role.permissions
    if (!permission.includes("roles_permissions")) {
        req.flash('error', 'Bạn không có quyền cập nhật phân quyền!');
        return
    }
    try {
        const permissions = JSON.parse(req.body.permission)

        for (const item of permissions) {
            await Role.updateOne({ _id: item.id }, { permissions: item.permissions })
        }
        req.flash('success', 'Cập nhật trạng thái thành công!');

        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    } catch (error) {
        req.flash('error', 'Cập nhật thất bại!');
    }
}