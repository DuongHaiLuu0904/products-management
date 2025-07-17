import Product from '../../models/product.model.js';
import ProductCategory from '../../models/product-category.model.js';
import User from '../../models/user.model.js';
import Comment from '../../models/comment.model.js';

import { priceNew, priceNewProduct } from '../../helpers/product.js';
import { getSubCategory } from '../../helpers/products-category.js';
import paginationHelper from "../../helpers/pagination.js";
import { calculateAverageRating, getRatingDistribution } from "../../helpers/rating.js";

// [GET] /products
const cache = {}

export async function index(req, res) {

    const find = {
        status: 'active',
        deleted: false
    }
    // Phân trang 
    const countProducts = await Product.countDocuments(find)

    let objectPangination = paginationHelper(
        {
            currentPage: 1,
            limitItems: 12
        },
        req.query,
        countProducts
    )
    //

    const products = await Product.find(find).limit(objectPangination.limitItems).skip(objectPangination.skip).sort({ position: "desc" })

    const newProducts = priceNew(products)

    res.render('client/pages/products/index', {
        title: 'Trang sản phẩm',
        products: newProducts,
        pagination: objectPangination
    })
}

// [GET] /products/:slug
export async function detail(req, res) {
    try {
        const find = {
            deleted: false,
            slug: req.params.slugProduct,
            status: 'active'
        }
        const product = await Product.findOne(find)

        if (product.product_category_id) {
            const category = await ProductCategory.findOne({
                deleted: false,
                _id: product.product_category_id,
                status: 'active'
            })
            product.category = category
        }

        product.priceNew = priceNewProduct(product)

        // Lấy tất cả comments cho sản phẩm này
        const comments = await Comment.find({
            product_id: product._id,
            deleted: false,
            status: 'active'
        }).sort({ createdAt: -1 });

        // Lấy thông tin user cho mỗi comment và tổ chức comment theo cấu trúc cha-con
        const commentTree = [];
        const commentMap = new Map();

        for (const comment of comments) {
            const user = await User.findOne({ 
                _id: comment.user_id,
                status: 'active',
                deleted: false 
            });
            if (user) {
                comment.user = user;
            }
            
            commentMap.set(comment._id.toString(), comment);
            
            if (!comment.parent_id) {
                // Comment gốc
                comment.replies = [];
                commentTree.push(comment);
            }
        }

        // Thêm các reply vào comment cha
        for (const comment of comments) {
            if (comment.parent_id && commentMap.has(comment.parent_id)) {
                const parentComment = commentMap.get(comment.parent_id);
                if (!parentComment.replies) {
                    parentComment.replies = [];
                }
                parentComment.replies.push(comment);
            }
        }

        // Tính rating trung bình cho sản phẩm
        const ratingInfo = await calculateAverageRating(product._id);
        const ratingDistribution = await getRatingDistribution(product._id);
        
        product.averageRating = ratingInfo.averageRating;
        product.totalReviews = ratingInfo.totalReviews;
        product.ratingDistribution = ratingDistribution;

        res.render('client/pages/products/detail', {
            title: 'Chi tiết sản phẩm',
            product: product,
            comments: commentTree
        });
    } catch (error) {
        res.redirect(`/products`);
    }
}

// [GET] /products/:slugCategory
export async function category(req, res) {
    const category = await ProductCategory.findOne({
        deleted: false,
        slug: req.params.slugCategory,
        status: 'active'
    })

    const listCategorie = await getSubCategory(category.id)

    const listCategorieId = listCategorie.map(item => item.id)

    const products = await Product.find({
        deleted: false,
        status: 'active',
        product_category_id: { $in: [category.id, ...listCategorieId] }
    }).sort({ position: "desc" })

    const newProducts = priceNew(products)
    res.render('client/pages/products/index', {
        title: category.title,
        products: newProducts
    })
}

// [POST] /products/comment/add
export async function addComment(req, res) {
    try {
        if (!res.locals.user) {
            req.flash('error', 'Bạn cần đăng nhập để bình luận!');
            return res.redirect('back');
        }

        const { product_id, content, rating } = req.body;

        if (!content || !product_id) {
            req.flash('error', 'Vui lòng nhập đầy đủ thông tin!');
            return res.redirect('back');
        }

        // Validate rating if provided
        if (rating && (rating < 1 || rating > 5)) {
            req.flash('error', 'Đánh giá phải từ 1 đến 5 sao!');
            return res.redirect('back');
        }

        // Kiểm tra sản phẩm có tồn tại
        const product = await Product.findOne({
            _id: product_id,
            deleted: false,
            status: "active"
        });

        if (!product) {
            req.flash('error', 'Sản phẩm không tồn tại!');
            return res.redirect('back');
        }

        const comment = new Comment({
            content: content,
            user_id: res.locals.user.id,
            product_id: product_id,
            rating: rating ? parseInt(rating) : null,
            status: "active"
        });

        await comment.save();

        req.flash('success', 'Bình luận của bạn đã được gửi thành công!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    }
}

// [PATCH] /products/comment/edit/:commentId
export async function editComment(req, res) {
    try {
        if (!res.locals.user) {
            req.flash('error', 'Bạn cần đăng nhập!');
            return res.redirect('back');
        }

        const { commentId } = req.params;
        const { content, rating } = req.body;

        if (!content) {
            req.flash('error', 'Vui lòng nhập nội dung bình luận!');
            return res.redirect('back');
        }

        // Validate rating if provided
        if (rating && (rating < 1 || rating > 5)) {
            req.flash('error', 'Đánh giá phải từ 1 đến 5 sao!');
            return res.redirect('back');
        }

        // Kiểm tra comment có tồn tại và thuộc về user hiện tại
        const comment = await Comment.findOne({
            _id: commentId,
            user_id: res.locals.user.id,
            deleted: false
        });

        if (!comment) {
            req.flash('error', 'Bình luận không tồn tại hoặc bạn không có quyền sửa!');
            return res.redirect('back');
        }

        await Comment.updateOne(
            { _id: commentId },
            { 
                content: content,
                rating: rating ? parseInt(rating) : null
            }
        );

        req.flash('success', 'Cập nhật bình luận thành công!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    }
}

// [DELETE] /products/comment/delete/:commentId
export async function deleteComment(req, res) {
    try {
        if (!res.locals.user) {
            req.flash('error', 'Bạn cần đăng nhập!');
            return res.redirect('back');
        }

        const { commentId } = req.params;

        // Kiểm tra comment có tồn tại và thuộc về user hiện tại
        const comment = await Comment.findOne({
            _id: commentId,
            user_id: res.locals.user.id,
            deleted: false
        });

        if (!comment) {
            req.flash('error', 'Bình luận không tồn tại hoặc bạn không có quyền xóa!');
            return res.redirect('back');
        }

        await Comment.updateOne(
            { _id: commentId },
            { 
                deleted: true,
                deletedBy: {
                    account_id: res.locals.user.id,
                    deleteAt: new Date()
                }
            }
        );

        req.flash('success', 'Xóa bình luận thành công!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        const backURL = req.get("Referrer") || "/";
        res.redirect(backURL);
    }
}