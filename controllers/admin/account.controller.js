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
    
    console.log(records) 
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