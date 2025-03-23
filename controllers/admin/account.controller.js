const md5 = require('md5')
const Account = require('../../models/account.model')
const Role = require("../../models/role.model")

const systemConfix = require("../../config/system")

module.exports.index = async (req, res) => {
    let find = {
        deleted: false
    }

    const records = await Account.find(find).select('-password -token')

    for(const record of records) {
        const role = await Role.findOne({
            _id: record.role_id,
            deleted: false
        })
        record.role = role
    }
    
    res.render('admin/pages/account/index', {
        title: 'Tài khoản',
        records: records
    });
}

// [GET] /admin/accounts/create
module.exports.create = async (req, res) => {
    let find = {
        deleted: false
    }

    const recordRole = await Role.find(find)

    res.render('admin/pages/account/create', {
        title: 'Thêm nhóm quyền',
        recordRole: recordRole
    });
}

// [POST] /admin/accounts/createPost
module.exports.createPost = async (req, res) => {
    const emmailExist = await Account.findOne({
        email: req.body.email,
        deleted: false 
    })

    if (emmailExist) {
        req.flash('error', 'Email đã tồn tại!');

        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    } else {
        req.body.password = md5(req.body.password)

        const record = new Account(req.body)
        record.save()

        req.flash('success', 'Thêm mới thành công!');
        res.redirect(`${systemConfix.prefixAdmin}/accounts`);
    }
}

// [GET] /admin/accounts/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const data = await Account.findOne(find)

        const roles = await Role.find({ deleted: false })
    
        res.render('admin/pages/account/edit', {
            title: 'Chỉnh sửa tài khoản',
            data: data,
            roles: roles
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/products`);
    }
}

// [PATCH] /admin/accounts/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id

        const emailExist = await Account.findOne({
            _id: { $ne: id },
            email: req.body.email,
            deleted: false 
        })
    
        if (emailExist) {
            req.flash('error', 'Email đã tồn tại!');
    
            const backURL = req.get("Referrer") || "/";
            return res.redirect(backURL)
        } else {
            if(req.body.password) {
                req.body.password = md5(req.body.password)
            } else {
                delete req.body.password
            }

            await Account.updateOne({ _id: id }, req.body)
            req.flash('success', 'Cập nhật thành công!');
            res.redirect(`${systemConfix.prefixAdmin}/accounts`);
        }
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
        res.redirect(`${systemConfix.prefixAdmin}/accounts`);
    }
}

// [DELETE] /admin/accounts/delete/:id
module.exports.deleteItem = async (req, res) => {
    const id = req.params.id
    
    await Account.updateOne({ _id: id }, {
        deleted: true,
        deleteAt: new Date()
    })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [PATCH] /admin/accounts/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

    const status = req.params.status
    const id = req.params.id

    await Account.updateOne({ _id: id }, { status: status })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    // res.location("back")
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/accounts/detial/:id
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const record = await Account.findOne(find).select('-password -token')

        const role = await Role.findOne({
            _id: record.role_id,
            deleted: false
        })
        record.role = role

        res.render('admin/pages/account/detail', {
            title: 'Chi tiết tài khoản',
            record: record
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/accounts`);
    }
}