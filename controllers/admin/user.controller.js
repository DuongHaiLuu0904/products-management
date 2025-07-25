import md5 from 'md5'

import User from "../../models/user.model.js"
import Cart from "../../models/cart.model.js"
import Order from "../../models/order.model.js"
import Product from "../../models/product.model.js"

import { prefixAdmin } from "../../config/system.js"
import cloudinaryHelper from "../../helpers/uploadToCloudinary.js"

export async function index(req, res) {
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
export async function create(req, res) {

    res.render('admin/pages/user/create', {
        title: 'Thêm tài khoản',
    });
}

// [POST] /admin/users/createPost
export async function createPost(req, res) {
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
        res.redirect(`${prefixAdmin}/users`);
    }
}

// [GET] /admin/users/edit/:id
export async function edit(req, res) {
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
        res.redirect(`${prefixAdmin}/users`);
    }
}

// [PATCH] /admin/users/edit/:id
export async function editPatch(req, res) {
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
            // Get the current user to access the public_id
            const currentUser = await User.findOne({ _id: id });

            // If a new avatar is being uploaded and there's an existing public_id, delete the old image
            if (req.body.public_id && currentUser.public_id) {
                await cloudinaryHelper.deleteFromCloudinary(currentUser.public_id);
            }

            if (req.body.password) {
                req.body.password = md5(req.body.password)
            } else {
                delete req.body.password
            }

            await User.updateOne({ _id: id }, req.body)
            req.flash('success', 'Cập nhật thành công!');
            res.redirect(`${prefixAdmin}/users`);
        }
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
        res.redirect(`${prefixAdmin}/users`);
    }
}

// [PATCH] /admin/users/change-status/:status/:id
export async function changeStatus(req, res) {
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
export async function deleteItem(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("users_delete")) {
        req.flash('error', 'Bạn không có quyền cập nhật tài khoản!');
        return
    }

    const id = req.params.id

    try {
        // Get the user to access the public_id
        const user = await User.findOne({ _id: id });

        // Delete the avatar from Cloudinary if public_id exists
        if (user.public_id) {
            await cloudinaryHelper.deleteFromCloudinary(user.public_id);
        }

        await User.updateOne({ _id: id }, {
            deleted: true,
            deleteAt: new Date()
        })
    } catch (error) {
        console.log(error);
        req.flash('error', 'Xóa thất bại!');
    }

    req.flash('success', 'Cập nhật trạng thái thành công!');

    res.redirect(req.headers.referer)
}

// [GET] /admin/users/detail/:id
export async function detail(req, res) {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const record = await User.findOne(find).select('-password -token')

        // Lấy lịch sử mua hàng của user

        // Tìm tất cả cart của user này
        const userCarts = await Cart.find({ user_id: req.params.id })
        const cartIds = userCarts.map(cart => cart._id.toString())

        // Tìm tất cả order dựa vào cart_id
        const orders = await Order.find({
            cart_id: { $in: cartIds }
        }).sort({ createdAt: -1 })

        // Lấy thông tin chi tiết sản phẩm cho từng order
        for (const order of orders) {
            for (const item of order.products) {
                const product = await Product.findOne({
                    _id: item.product_id
                }).select('title thumbnail')

                if (product) {
                    item.productInfo = product
                    // Tính giá sau khi giảm
                    item.priceNew = item.price * (100 - item.discountPercentage) / 100
                    item.totalPrice = item.priceNew * item.quantity
                }
            }
            // Tính tổng tiền của order
            order.totalOrderPrice = order.products.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
        }

        res.render('admin/pages/user/detail', {
            title: 'Chi tiết tài khoản',
            record: record,
            orders: orders
        });
    } catch (error) {
        console.log(error)
        res.redirect(`${prefixAdmin}/users`);
    }
}