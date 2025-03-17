const Product = require('../../models/product.model');
const ProductCategory = require('../../models/product-category.model');

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
    
    const status = req.params.status
    const id = req.params.id

    await Product.updateOne({ _id: id }, { status: status })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    // res.location("back")
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [PATCH] /admin/products/change-multi
module.exports.changeMulti = async (req, res) => {
    const type = req.body.type
    const ids = req.body.ids.split(", ")

    switch (type) {
        case "active":
            await Product.updateMany({ _id: { $in: ids } }, { status: "active" })
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        case "inactive":
            await Product.updateMany({ _id: { $in: ids } }, { status: "inactive" })
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        case "delete-all":
            await Product.updateMany({ _id: { $in: ids } }, {
                deleted: true,
                deleteAt: new Date()
            })
            req.flash('success', `Đã xóa thành công ${ids.length} sản phẩm thành công!`);
            break

        case "change-position":
            for (const item of ids) {
                let [id, position] = item.split("-")
                position = parseInt(position)

                await Product.updateOne({ _id: id }, {
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

// [DELETE] /admin/products/change-status/:status/:id
module.exports.deleteItem = async (req, res) => {
    const id = req.params.id

    // await Product.deleteOne({_id: id})
    await Product.updateOne({ _id: id }, {
        deleted: true,
        deleteAt: new Date()
    })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    // res.location("back")
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
    
    req.body.price = parseFloat(req.body.price)
    req.body.discountPercentage = parseFloat(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)

    if(req.body.position == "") {
        const countProducts = await Product.countDocuments()
        req.body.position = countProducts + 1
    } else {
        req.body.position = parseInt(req.body.position)
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
    const id = req.params.id
    
    req.body.price = parseFloat(req.body.price)
    req.body.discountPercentage = parseFloat(req.body.discountPercentage)
    req.body.stock = parseInt(req.body.stock)
    req.body.position = parseInt(req.body.position)

    if(req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`
    }

    try {
        await Product.updateOne({ _id: id }, req.body)
        req.flash('success', 'Cập nhật thành công!');
    } catch (error) {
        console.log(error)
        req.flash('error', 'Cập nhật thất bại!');
    }

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
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