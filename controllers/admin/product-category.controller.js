import ProductCategory from '../../models/product-category.model.js';

import { prefixAdmin } from "../../config/system.js";
import filterStatusHelper from "../../helpers/filterStatus.js";
import searchHelper from "../../helpers/search.js";
import { searchCategories } from "../../helpers/fuzzySearch.js";
import { createTree } from "../../helpers/createTree.js";
import uploadCloudinary from "../../helpers/uploadToCloudinary.js";
const { deleteFromCloudinary } = uploadCloudinary;

// [GET] /admin/products-category
export async function index(req, res) {
    // Bộ lọc 
    const filterStatus = filterStatusHelper(req.query)
    let find = {
        deleted: false
    }

    if (req.query.status) {
        find.status = req.query.status
    }
    //

    //

    // Sort
    let sort = {}

    if (req.query.sortKey && req.query.sortValue) {
        sort[req.query.sortKey] = req.query.sortValue
    } else {
        sort["position"] = "desc"
    }
    //

    // Tìm kiếm
    const objectSearch = searchHelper(req.query)
    let records = []
    let newRecords = []

    if (objectSearch.keyword) {
        // Sử dụng tìm kiếm mờ với Fuse.js
        const allCategories = await ProductCategory.find({
            deleted: false,
            ...(req.query.status && { status: req.query.status })
        }).sort(sort)

        const fuzzyResult = searchCategories(allCategories, objectSearch.keyword)
        records = fuzzyResult.results
        newRecords = createTree(records)

        res.render('admin/pages/products-category/index', {
            title: 'Danh mục sản phẩm',
            records: newRecords,
            filterStatus: filterStatus,
            keyword: objectSearch.keyword,
            searchType: 'fuzzy',
            totalFound: fuzzyResult.totalFound
        });
    } else {
        // Tìm kiếm truyền thống khi không có từ khóa
        if (objectSearch.regex) {
            find.title = objectSearch.regex
        }

        records = await ProductCategory.find(find).sort(sort)
        newRecords = createTree(records)

        res.render('admin/pages/products-category/index', {
            title: 'Danh mục sản phẩm',
            records: newRecords,
            filterStatus: filterStatus,
            keyword: objectSearch.keyword
        });
    }
}

// [GET] /admin/products-category/create
export async function create(req, res) {
    let find = {
        deleted: false
    }

    const records = await ProductCategory.find(find)

    const newRecords = createTree(records)

    res.render('admin/pages/products-category/create', {
        title: 'Tạo danh mục sản phẩm',
        records: newRecords
    })
}

// [POST] /admin/products-category/create
export async function createPost(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("products-category_create")) {
        req.flash('error', 'Bạn không có quyền tạo danh mục sản phẩm!');
        return
    }

    if (req.body.position == "") {
        const count = await ProductCategory.countDocuments()
        req.body.position = count + 1
    } else {
        req.body.position = parseInt(req.body.position)
    }

    const category = new ProductCategory(req.body)
    await category.save()

    res.redirect(`${prefixAdmin}/products-category`);
}

// [PATCH] /admin/products-category/change-status/:status/:id
export async function changeStatus(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("products-category_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật danh mục sản phẩm!');
        return
    }

    const status = req.params.status
    const id = req.params.id

    await ProductCategory.updateOne({ _id: id }, { status: status })

    req.flash('success', 'Cập nhật trạng thái thành công!');

    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [PATCH] /admin/products-category/change-multi
export async function changeMulti(req, res) {
    const type = req.body.type
    const ids = req.body.ids.split(", ")

    switch (type) {
        case "active":
            const permission = res.locals.role.permissions
            if (!permission.includes("products-category_edit")) {
                req.flash('error', 'Bạn không có quyền cập nhật danh mục sản phẩm!');
                return
            }

            await ProductCategory.updateMany({ _id: { $in: ids } }, { status: "active" })
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        case "inactive":
            const permissionInactive = res.locals.role.permissions
            if (!permissionInactive.includes("products-category_edit")) {
                req.flash('error', 'Bạn không có quyền cập nhật danh mục sản phẩm!');
                return
            }

            await ProductCategory.updateMany({ _id: { $in: ids } }, { status: "inactive" })
            req.flash('success', `Cập nhật trạng thái của ${ids.length} sản phẩm thành công!`);
            break

        case "delete-all":
            const permissionDelete = res.locals.role.permissions
            if (!permissionDelete.includes("products-category_delete")) {
                req.flash('error', 'Bạn không có quyền xóa danh mục sản phẩm!');
                return
            }

            await ProductCategory.updateMany({ _id: { $in: ids } }, {
                deleted: true,
                deleteAt: new Date()
            })
            req.flash('success', `Đã xóa thành công ${ids.length} sản phẩm thành công!`);
            break

        case "change-position":
            const permissionPosition = res.locals.role.permissions
            if (!permissionPosition.includes("products-category_edit")) {
                req.flash('error', 'Bạn không có quyền cập nhật danh mục sản phẩm!');
                return
            }

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
export async function deleteItem(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("products-category_delete")) {
        req.flash('error', 'Bạn không có quyền xóa danh mục sản phẩm!');
        return
    }

    const id = req.params.id

    try {
        await ProductCategory.updateOne({ _id: id }, {
            deleted: true,
            deleteAt: new Date()
        })

        req.flash('success', 'Cập nhật trạng thái thành công!');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Xóa thất bại!');
    }

    // res.location("back")
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
}

// [GET] /admin/products-category/edit/:id
export async function edit(req, res) {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const product = await ProductCategory.findOne(find)
        
        const records = await ProductCategory.find({ deleted : false })
        const newRecords = createTree(records)

        res.render('admin/pages/products-category/edit', {
            title: 'Trang sửa sản phẩm',
            product: product,
            records: newRecords
        });
    } catch (error) {
        res.redirect(`${prefixAdmin}/products-category`);
    }
}

// [PATCH] /admin/products-category/edit/:id
export async function editPATCH(req, res) {
    const permission = res.locals.role.permissions
    if (!permission.includes("products-category_edit")) {
        req.flash('error', 'Bạn không có quyền cập nhật danh mục sản phẩm!');
        return
    }
    const id = req.params.id

    req.body.position = parseInt(req.body.position)

    if (req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`
    }

    try {
        // Get the current category to access the public_id
        const currentCategory = await ProductCategory.findOne({ _id: id });

        // If a new file is being uploaded and there's an existing public_id, delete the old image
        if (req.body.public_id && currentCategory.public_id) {
            await deleteFromCloudinary(currentCategory.public_id);
        }

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
export async function detail(req, res) {
    try {
        const find = {
            deleted: false,
            _id: req.params.id
        }
        const product = await ProductCategory.findOne(find)

        if(product.parent_id) {
            const record = await ProductCategory.findOne({ 
                _id: product.parent_id,
                deleted: false
            })
            product.parent = record.title
        }
        

        res.render('admin/pages/products-category/detail', {
            title: 'Chi tiết sản phẩm',
            product: product
        });
    } catch (error) {
        console.log(error)
        res.redirect(`${prefixAdmin}/products-category`);
    }
}