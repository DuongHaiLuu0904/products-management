const Comment = require('../../models/comment.model');
const Product = require('../../models/product.model');
const User = require('../../models/user.model');

const systemConfix = require("../../config/system");
const filterStatusHelper = require("../../helpers/filterStatus");
const searchHelper = require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");

// [GET] /admin/comments
module.exports.index = async (req, res) => {
    // Bộ lọc trạng thái
    const filterStatus = filterStatusHelper(req.query);
    
    let find = {
        deleted: false
    };
    
    if (req.query.status) {
        find.status = req.query.status;
    }
    
    // Tìm kiếm theo sản phẩm
    if (req.query.product_id) {
        find.product_id = req.query.product_id;
    }
    
    // Tìm kiếm theo nội dung
    const objectSearch = searchHelper(req.query);
    if (objectSearch.regex) {
        find.content = objectSearch.regex;
    }
    
    // Sắp xếp
    let sort = {};
    if (req.query.sortKey && req.query.sortValue) {
        sort[req.query.sortKey] = req.query.sortValue;
    } else {
        sort["createdAt"] = "desc";
    }
    
    // Phân trang
    const countComments = await Comment.countDocuments(find);
    let objectPagination = paginationHelper(
        {
            currentPage: 1,
            limitItems: 10
        },
        req.query,
        countComments
    );
    
    // Lấy danh sách comment
    const comments = await Comment.find(find)
        .limit(objectPagination.limitItems)
        .skip(objectPagination.skip)
        .sort(sort);
    
    // Lấy thông tin user và product cho mỗi comment
    for (const comment of comments) {
        const user = await User.findOne({ _id: comment.user_id });
        if (user) {
            comment.userInfo = user;
        }
        
        const product = await Product.findOne({ _id: comment.product_id });
        if (product) {
            comment.productInfo = product;
        }
        
        // Lấy thông tin comment cha nếu có
        if (comment.parent_id) {
            const parentComment = await Comment.findOne({ _id: comment.parent_id });
            if (parentComment) {
                comment.parentComment = parentComment;
            }
        }
    }
    
    // Lấy danh sách sản phẩm để filter
    const products = await Product.find({ deleted: false }).select('title');
    
    res.render('admin/pages/comment/index', {
        title: 'Quản lý bình luận',
        comments: comments,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination,
        products: products,
        query: req.query
    });
};

// [PATCH] /admin/comments/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    const permissions = res.locals.role.permissions;
    if (!permissions.includes("comments_edit")) {
        req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
        return res.redirect(`${systemConfix.prefixAdmin}/comments`);
    }
    
    const status = req.params.status;
    const id = req.params.id;
    
    const update = {
        account_id: res.locals.user.id,
        updateAt: new Date()
    };
    
    await Comment.updateOne(
        { _id: id },
        { 
            status: status,
            $push: { updatedBy: update }
        }
    );
    
    req.flash('success', 'Cập nhật trạng thái bình luận thành công!');
    
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
};

// [PATCH] /admin/comments/change-multi
module.exports.changeMulti = async (req, res) => {
    const type = req.body.type;
    const ids = req.body.ids.split(", ");
    
    const update = {
        account_id: res.locals.user.id,
        updateAt: new Date()
    };
    
    switch (type) {
        case "active":
            const permissions = res.locals.role.permissions;
            if (!permissions.includes("comments_edit")) {
                req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
                return res.redirect(`${systemConfix.prefixAdmin}/comments`);
            }
            
            await Comment.updateMany(
                { _id: { $in: ids } },
                {
                    status: "active",
                    $push: { updatedBy: update }
                }
            );
            req.flash('success', `Kích hoạt ${ids.length} bình luận thành công!`);
            break;
            
        case "inactive":
            const permissionsInactive = res.locals.role.permissions;
            if (!permissionsInactive.includes("comments_edit")) {
                req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
                return res.redirect(`${systemConfix.prefixAdmin}/comments`);
            }
            
            await Comment.updateMany(
                { _id: { $in: ids } },
                {
                    status: "inactive",
                    $push: { updatedBy: update }
                }
            );
            req.flash('success', `Ẩn ${ids.length} bình luận thành công!`);
            break;
            
        case "delete-all":
            const permissionsDelete = res.locals.role.permissions;
            if (!permissionsDelete.includes("comments_delete")) {
                req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
                return res.redirect(`${systemConfix.prefixAdmin}/comments`);
            }
            
            await Comment.updateMany(
                { _id: { $in: ids } },
                {
                    deleted: true,
                    deletedBy: {
                        account_id: res.locals.user.id,
                        deleteAt: new Date()
                    }
                }
            );
            req.flash('success', `Xóa ${ids.length} bình luận thành công!`);
            break;
            
        default:
            break;
    }
    
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
};

// [DELETE] /admin/comments/delete/:id
module.exports.deleteItem = async (req, res) => {
    const permissions = res.locals.role.permissions;
    if (!permissions.includes("comments_delete")) {
        req.flash('error', 'Bạn không có quyền thực hiện chức năng này!');
        return res.redirect(`${systemConfix.prefixAdmin}/comments`);
    }
    
    const id = req.params.id;
    
    try {
        await Comment.updateOne(
            { _id: id },
            {
                deleted: true,
                deletedBy: {
                    account_id: res.locals.user.id,
                    deleteAt: new Date()
                }
            }
        );
        
        req.flash('success', 'Xóa bình luận thành công!');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Xóa bình luận thất bại!');
    }
    
    const backURL = req.get("Referrer") || "/";
    res.redirect(backURL);
};

// [GET] /admin/comments/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const comment = await Comment.findOne({
            _id: req.params.id,
            deleted: false
        });
        
        if (!comment) {
            req.flash('error', 'Bình luận không tồn tại!');
            return res.redirect(`${systemConfix.prefixAdmin}/comments`);
        }
        
        // Lấy thông tin user
        const user = await User.findOne({ _id: comment.user_id });
        if (user) {
            comment.userInfo = user;
        }
        
        // Lấy thông tin sản phẩm
        const product = await Product.findOne({ _id: comment.product_id });
        if (product) {
            comment.productInfo = product;
        }
        
        // Lấy comment cha nếu có
        if (comment.parent_id) {
            const parentComment = await Comment.findOne({ _id: comment.parent_id });
            if (parentComment) {
                const parentUser = await User.findOne({ _id: parentComment.user_id });
                if (parentUser) {
                    parentComment.userInfo = parentUser;
                }
                comment.parentComment = parentComment;
            }
        }
        
        // Lấy các comment con
        const childComments = await Comment.find({
            parent_id: comment._id,
            deleted: false
        }).sort({ createdAt: 1 });
        
        for (const childComment of childComments) {
            const childUser = await User.findOne({ _id: childComment.user_id });
            if (childUser) {
                childComment.userInfo = childUser;
            }
        }
        
        res.render('admin/pages/comment/detail', {
            title: 'Chi tiết bình luận',
            comment: comment,
            childComments: childComments
        });
    } catch (error) {
        console.log(error);
        res.redirect(`${systemConfix.prefixAdmin}/comments`);
    }
};
