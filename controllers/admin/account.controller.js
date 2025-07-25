import md5 from 'md5'
import Account from '../../models/account.model.js'
import Role from "../../models/role.model.js"

import { prefixAdmin } from "../../config/system.js"
import uploadCloudinary from "../../helpers/uploadToCloudinary.js"
const { deleteFromCloudinary } = uploadCloudinary;

export async function index(req, res) {
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
export async function create(req, res) {
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
export async function createPost(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("accounts_create")) {
        req.flash('error', 'Bạn không có quyền tạo tài khoản!');
        return
    }

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
        res.redirect(`${prefixAdmin}/accounts`);
    }
}

// [GET] /admin/accounts/edit/:id
export async function edit(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("accounts_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }
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
        res.redirect(`${prefixAdmin}/products`);
    }
}

// [PATCH] /admin/accounts/edit/:id
export async function editPatch(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("accounts_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }

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
            // Get the current account to access the public_id
            const currentAccount = await Account.findOne({ _id: id });

            // If a new avatar is being uploaded and there's an existing public_id, delete the old image
            if (req.body.public_id && currentAccount.public_id) {
                await deleteFromCloudinary(currentAccount.public_id);
            }

            if(req.body.password) {
                req.body.password = md5(req.body.password)
            } else {
                delete req.body.password
            }

            await Account.updateOne({ _id: id }, req.body)
            req.flash('success', 'Cập nhật thành công!');
            res.redirect(`${prefixAdmin}/accounts`);
        }
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
        res.redirect(`${prefixAdmin}/accounts`);
    }
}

// [DELETE] /admin/accounts/delete/:id
export async function deleteItem(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("accounts_delete")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }

    const id = req.params.id
    
    try {
        // Get the account to access the public_id
        const account = await Account.findOne({ _id: id });

        // Delete the avatar from Cloudinary if public_id exists
        if (account.public_id) {
            await deleteFromCloudinary(account.public_id);
        }
        
        await Account.updateOne({ _id: id }, {
            deleted: true,
            deleteAt: new Date()
        })

        req.flash('success', 'Cập nhật trạng thái thành công!');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Xóa thất bại!');
    }

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [PATCH] /admin/accounts/change-status/:status/:id
export async function changeStatus(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("accounts_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }

    const status = req.params.status
    const id = req.params.id

    await Account.updateOne({ _id: id }, { status: status })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    // res.location("back")
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/accounts/detial/:id
export async function detail(req, res) {
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
        res.redirect(`${prefixAdmin}/accounts`);
    }
}