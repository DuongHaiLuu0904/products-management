const Product = require('../../models/product.model');
const ProductCategory = require('../../models/product-category.model');
const User = require('../../models/user.model');

const productHelper = require('../../helpers/product')
const productCategoryHelper = require('../../helpers/products-category')
const paginationHelper = require("../../helpers/pagination")

// [GET] /products
const cache = {}

module.exports.index = async (req, res) => {

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

    const newProducts = productHelper.priceNew(products)

    res.render('client/pages/products/index', {
        title: 'Trang sản phẩm',
        products: newProducts,
        pagination: objectPangination
    })
}

// [GET] /products/:slug
module.exports.detail = async (req, res) => {
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

        product.priceNew = productHelper.priceNewProduct(product)

        // Lấy tất cả comments cho sản phẩm này
        const users = await User.find({
            'productComments.product_id': product._id.toString(),
            status: 'active',
            deleted: false
        }).select('fullName avatar productComments');

        let comments = [];
        users.forEach(user => {
            const userComments = user.productComments.filter(comment => 
                comment.product_id === product._id.toString()
            );
            userComments.forEach(comment => {
                comments.push({
                    _id: comment._id,
                    content: comment.content,
                    rating: comment.rating,
                    createdAt: comment.createdAt,
                    user: {
                        _id: user._id,
                        fullName: user.fullName,
                        avatar: user.avatar
                    }
                });
            });
        });

        // Sắp xếp comments theo thời gian mới nhất
        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.render('client/pages/products/detail', {
            title: 'Chi tiết sản phẩm',
            product: product,
            comments: comments
        });
    } catch (error) {
        res.redirect(`/products`);
    }
}

// [GET] /products/:slugCategory
module.exports.category = async (req, res) => {
    const category = await ProductCategory.findOne({
        deleted: false,
        slug: req.params.slugCategory,
        status: 'active'
    })

    const listCategorie = await productCategoryHelper.getSubCategory(category.id)

    const listCategorieId = listCategorie.map(item => item.id)

    const products = await Product.find({
        deleted: false,
        status: 'active',
        product_category_id: { $in: [category.id, ...listCategorieId] }
    }).sort({ position: "desc" })

    const newProducts = productHelper.priceNew(products)
    res.render('client/pages/products/index', {
        title: category.title,
        products: newProducts
    })
}

// [POST] /products/comment/add
module.exports.addComment = async (req, res) => {
    try {
        const { product_id, content, rating } = req.body;
        const userId = res.locals.user.id;

        if (!content || !rating || !product_id) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin');
            return res.redirect('back');
        }

        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'Không tìm thấy người dùng');
            return res.redirect('back');
        }

        const newComment = {
            product_id: product_id,
            content: content,
            rating: parseInt(rating),
            createdAt: new Date()
        };

        user.productComments.push(newComment);
        await user.save();

        req.flash('success', 'Thêm bình luận thành công');
        res.redirect('back');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('back');
    }
}

// [PATCH] /products/comment/edit/:commentId
module.exports.editComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content, rating } = req.body;
        const userId = res.locals.user.id;

        if (!content || !rating) {
            req.flash('error', 'Vui lòng điền đầy đủ thông tin');
            return res.redirect('back');
        }

        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'Không tìm thấy người dùng');
            return res.redirect('back');
        }

        const comment = user.productComments.id(commentId);
        if (!comment) {
            req.flash('error', 'Không tìm thấy bình luận');
            return res.redirect('back');
        }

        comment.content = content;
        comment.rating = parseInt(rating);
        await user.save();

        req.flash('success', 'Cập nhật bình luận thành công');
        res.redirect('back');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('back');
    }
}

// [DELETE] /products/comment/delete/:commentId
module.exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = res.locals.user.id;

        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'Không tìm thấy người dùng');
            return res.redirect('back');
        }

        const comment = user.productComments.id(commentId);
        if (!comment) {
            req.flash('error', 'Không tìm thấy bình luận');
            return res.redirect('back');
        }

        user.productComments.pull(commentId);
        await user.save();

        req.flash('success', 'Xóa bình luận thành công');
        res.redirect('back');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra');
        res.redirect('back');
    }
}