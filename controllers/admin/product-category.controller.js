const ProductCategory = require('../../models/product-category.model');

const systemConfix = require("../../config/system")
const filterStatusHelper = require("../../helpers/filterStatus")
const searchHelper = require("../../helpers/search")
const paginationHelper = require("../../helpers/pagination")
const createTreeHelper = require("../../helpers/createTree")

// [GET] /admin/products-category
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
    const countProducts = await ProductCategory.countDocuments(find)

    let objectPangination = paginationHelper(
        {
            currentPage: 1,
            limitItems: 4
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

    const records = await ProductCategory.find(find)
        // .limit(objectPangination.limitItems)
        // .skip(objectPangination.skip)
        .sort(sort)

    const newRecords = createTreeHelper.createTree(records)

    res.render('admin/pages/products-category/index', {
        title: 'Danh mục sản phẩm',
        records: newRecords,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPangination
    });
}

// [GET] /admin/products-category/create
module.exports.create = async (req, res) => {
    let find = {
        deleted: false
    }

    const records = await ProductCategory.find(find)

    const newRecords = createTreeHelper.createTree(records)

    res.render('admin/pages/products-category/create', {
        title: 'Tạo danh mục sản phẩm',
        records: newRecords
    })
}

// [POST] /admin/products-category/create
module.exports.createPost = async (req, res) => {

    if (req.body.position == "") {
        const count = await ProductCategory.countDocuments()
        req.body.position = count + 1
    } else {
        req.body.position = parseInt(req.body.position)
    }

    const category = new ProductCategory(req.body)
    await category.save()

    res.redirect(`${systemConfix.prefixAdmin}/products-category`);
}

// [PATCH] /admin/products-category/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

    const status = req.params.status
    const id = req.params.id

    await ProductCategory.updateOne({ _id: id }, { status: status })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    // res.location("back")
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [PATCH] /admin/products-category/change-multi
module.exports.changeMulti = async (req, res) => {
    const type = req.body.type
    const ids = req.body.ids.split(", ")

    switch (type) {
        case "active":
            await ProductCategory.updateMany({ _id: { $in: ids } }, { status: "active" })
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        case "inactive":
            await ProductCategory.updateMany({ _id: { $in: ids } }, { status: "inactive" })
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        case "delete-all":
            await ProductCategory.updateMany({ _id: { $in: ids } }, {
                deleted: true,
                deleteAt: new Date()
            })
            req.flash('success', `Đã xóa thành công ${ids.length} sản phẩm thành công!`);
            break

        case "change-position":
            for (const item of ids) {
                let [id, position] = item.split("-")
                position = parseInt(position)

                await ProductCategory.updateOne({ _id: id }, {
                    position: position
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

// [DELETE] /admin/products-category/dele/:id
module.exports.deleteItem = async (req, res) => {
    const id = req.params.id

    // await Product.deleteOne({_id: id})
    await ProductCategory.updateOne({ _id: id }, {
        deleted: true,
        deleteAt: new Date()
    })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    // res.location("back")
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/products-category/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const product = await ProductCategory.findOne(find)
        
        const records = await ProductCategory.find({ deleted : false })
        const newRecords = createTreeHelper.createTree(records)

        res.render('admin/pages/products-category/edit', {
            title: 'Trang sửa sản phẩm',
            product: product,
            records: newRecords
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/products-category`);
    }
}

// [PATCH] /admin/products-category/edit/:id
module.exports.editPATCH = async (req, res) => {
    const id = req.params.id

    req.body.position = parseInt(req.body.position)

    if (req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`
    }

    try {
        await ProductCategory.updateOne({ _id: id }, req.body)
        req.flash('success', 'Cập nhật thành công!');
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
    }

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/products-category/detial/:id
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const product = await ProductCategory.findOne(find)

        res.render('admin/pages/products-category/detail', {
            title: 'Chi tiết sản phẩm',
            product: product
        });
    } catch (error) {
        res.redirect(`${systemConfix.prefixAdmin}/products-category`);
    }
}