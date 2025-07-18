import Role from "../../models/role.model.js"
import { prefixAdmin } from "../../config/system.js"

// [GET] /admin/roles
export async function index(req, res) {
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
export async function create(req, res) {
    res.render('admin/pages/roles/create', {
        title: 'Thêm nhóm quyền'
    });
}

// [POST] /admin/roles/create
export async function createPost(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("roles_create")) {
        req.flash('error', 'Bạn không có quyền tạo nhóm quyền!');
        return res.redirect('back');
    }

    try {
        // Dữ liệu đã được validate trong middleware
        const record = new Role(req.body)
        await record.save()

        req.flash('success', 'Thêm mới thành công!');
        res.redirect(`${prefixAdmin}/roles`);
    } catch (error) {
        console.error('Create role error:', error);
        req.flash('error', 'Thêm mới thất bại!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    }
}

// [GET] /admin/roles/edit
export async function edit(req, res) {
    try {
        // Role đã được validate trong middleware
        const record = req.validatedRole;

        res.render('admin/pages/roles/edit', {
            title: 'Sửa nhóm quyền',
            record: record
        });
    } catch (error) {
        console.error('Edit role get error:', error);
        res.redirect(`${prefixAdmin}/roles`)
    }
}

// [PATCH] /admin/roles/edit
export async function editPatch(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("roles_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật nhóm quyền!');
        return res.redirect('back');
    }

    const id = req.params.id

    try {
        // Dữ liệu đã được validate trong middleware
        await Role.updateOne({ _id: id }, req.body)
        req.flash('success', 'Cập nhật thành công!');
    } catch (error) {
        console.log('Edit role error:', error)
        req.flash('error', 'Cập nhật thất bại!');
    }

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/roles/detail
export async function detail(req, res) {
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
        res.redirect(`${prefixAdmin}/roles`);
    }
}

// [DELETE] /admin/products/change-status/:status/:id
export async function deleteItem(req, res) {
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
export async function permissions(req, res) {
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
export async function permissionsPatch(req, res) {
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