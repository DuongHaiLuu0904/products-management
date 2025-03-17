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
    console.log(req.body)

    const record = new Role(req.body)
    record.save()

    res.redirect(`${systemConfix.prefixAdmin}/roles`);
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