const Product = require('../../models/product.model');
const ProductCategory = require('../../models/product-category.model');
const Account = require('../../models/account.model')

const systemConfix = require("../../config/system")

const filterStatusHelper = require("../../helpers/filterStatus")
const searchHelper = require("../../helpers/search")
const paginationHelper = require("../../helpers/pagination")
const createTreeHelper = require("../../helpers/createTree")

// [GET] /admin/products
module.exports.index = async (req, res) => {
    // Bộ lọc 
    const filterStatus = filterStatusHelper(req.query)

    let find = {
        deleted: false
    }

    if (req.query.status) {
        find.status = req.query.status
    }
    //

    // Tìm kiếm
    const objectSearch = searchHelper(req.query)

    if (objectSearch.regex) {
        find.title = objectSearch.regex
    }
    //

    // Phân trang 
    const countProducts = await Product.countDocuments(find)

    let objectPangination = paginationHelper(
        {
            currentPage: 1,
            limitItems: 6
        },
        req.query,
        countProducts
    )
    //

    // Sort
    let sort = {}

    if (req.query.sortKey && req.query.sortValue) {
        sort[req.query.sortKey] = req.query.sortValue
    } else {
        sort["position"] = "desc"
    }
    //
    
    const products = await Product.find(find).limit(objectPangination.limitItems).skip(objectPangination.skip).sort(sort)

    // Lấy danh sách tài khoản tạo sản phẩm
    for (const product of products) {
        const user = await Account.findOne({ _id: product.createBy.account_id })
        if (user) {
            product.accountFullName = user.fullName
        }

        // Lấy danh sách tài khoản cập nhật sản phẩm
        const updatedBy = product.updatedBy[product.updatedBy.length - 1]
        if(updatedBy) {
            const userUpdated = await Account.findOne({ 
                _id: updatedBy.account_id 
            })
            updatedBy.updatedFullName = userUpdated.fullName
        }
        
    }

    res.render('admin/pages/product/index', {
        title: 'Trang sản phẩm',
        products: products,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPangination
    });
}

// [PATCH] /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    const permissions = res.locals.role.permissions
    if(!permissions.includes("products_edit")) {
        req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
        return res.redirect(`${systemConfix.prefixAdmin}/products`);
    }

    const update = {
        account_id: res.locals.user.id,
        updateAt: new Date()
    }

    const status = req.params.status
    const id = req.params.id

    await Product.updateOne({ _id: id }, { status: status, $push: { updatedBy: update } })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    // res.location("back")
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [PATCH] /admin/products/change-multi
module.exports.changeMulti = async (req, res) => {
    const type = req.body.type
    const ids = req.body.ids.split(", ")

    const update = {
        account_id: res.locals.user.id,
        updateAt: new Date()
    }

    switch (type) {
        case "active":
            const permissions = res.locals.role.permissions
            if (!permissions.includes("products_edit")) {
                req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
                return res.redirect(`${systemConfix.prefixAdmin}/products`);
            }

            await Product.updateMany({ _id: { $in: ids } }, {
                status: "active",
                $push: { updatedBy: update }
            })
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        case "inactive":
            const permissionsInactive = res.locals.role.permissions
            if (!permissionsInactive.includes("products_edit")) {
                req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
                return res.redirect(`${systemConfix.prefixAdmin}/products`);
            }

            await Product.updateMany({ _id: { $in: ids } }, {
                status: "inactive",
                $push: { updatedBy: update }
            })
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        case "delete-all":
            const permissionsDelete = res.locals.role.permissions
            if (!permissionsDelete.includes("products_delete")) {
                req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
                return res.redirect(`${systemConfix.prefixAdmin}/products`);
            }

            await Product.updateMany(
                { _id: { $in: ids } },
                {
                    deleted: true,
                    deletedBy: {
                        account_id: res.locals.user.id,
                        deleteAt: new Date()
                    }
                }
            )
            req.flash('success', `Đã xóa thành công ${ids.length} sản phẩm thành công!`);
            break

        case "change-position":
            const permissionsPosition = res.locals.role.permissions
            if (!permissionsPosition.includes("products_edit")) {
                req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
                return res.redirect(`${systemConfix.prefixAdmin}/products`);
            }

            for (const item of ids) {
                let [id, position] = item.split("-")
                position = parseInt(position)

                await Product.updateOne({ _id: id }, {
                    position: position,
                    $push: { updatedBy: update }
                })
            }
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        default:
            break
    }

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);

}

// [DELETE] /admin/products/change-status/:status/:id
module.exports.deleteItem = async (req, res) => {
    const permissions = res.locals.role.permissions
    if (!permissions.includes("products_delete")) {
        req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
        return
    }

    const id = req.params.id

    // await Product.deleteOne({_id: id})
    await Product.updateOne(
        { _id: id },
        {
            deleted: true,
            deletedBy: {
                account_id: res.locals.user.id,
                deleteAt: new Date()
            }
        }
    )

    req.flash('success', 'Cập nhật trạng thái thành công!');

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/products/create
module.exports.create = async (req, res) => {

    let find = {
        deleted: false
    }

    const category = await ProductCategory.find(find)
    const newCategory = createTreeHelper.createTree(category)

    res.render('admin/pages/product/create', {
        title: 'Trang tạo sản phẩm',
        category: newCategory
    })
}

// [POST] /admin/products/create
module.exports.createPost = async (req, res) => {
    const permissions = res.locals.role.permissions
    if (!permissions.includes("products_create")) {
        req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
        return
    }

    req.body.price = parseFloat(req.body.price)
    req.body.discountPercentage = parseFloat(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)

    if (req.body.position == "") {
        const countProducts = await Product.countDocuments()
        req.body.position = countProducts + 1
    } else {
        req.body.position = parseInt(req.body.position)
    }

    req.body.createBy = {
        account_id: res.locals.user.id
    }

    const product = new Product(req.body)
    await product.save()

    res.redirect(`${systemConfix.prefixAdmin}/products`);
}

// [GET] /admin/products/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const product = await Product.findOne(find)


        let findCategory = {
            deleted: false
        }
        const category = await ProductCategory.find(findCategory)
        const newCategory = createTreeHelper.createTree(category)

        res.render('admin/pages/product/edit', {
            title: 'Trang sửa sản phẩm',
            product: product,
            category: newCategory
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/products`);
    }
}

// [PATCH] /admin/products/edit/:id
module.exports.editPATCH = async (req, res) => {
    const permissions = res.locals.role.permissions
    if (!permissions.includes("products_edit")) {
        req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
        return
    }
    
    const id = req.params.id

    req.body.price = parseFloat(req.body.price)
    req.body.discountPercentage = parseFloat(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)
    req.body.position = parseInt(req.body.position)

    try {
        const update = {
            account_id: res.locals.user.id,
            updateAt: new Date()
        }

        await Product.updateOne(
            { _id: id },
            {
                ...req.body,
                $push: {
                    updatedBy: update
                }
            }
        )
        req.flash('success', 'Cập nhật thành công!');
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
    }

    res.redirect(`${systemConfix.prefixAdmin}/products`)
}

module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const product = await Product.findOne(find)

        res.render('admin/pages/product/detail', {
            title: 'Chi tiết sản phẩm',
            product: product
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/products`);
    }
}