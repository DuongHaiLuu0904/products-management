const Comment = require('../../models/comment.model');
const Product = require('../../models/product.model');

// [POST] /comments/create
module.exports.createPost = async (req, res) => {
    try {
        if (!res.locals.user) {
            req.flash('error', 'Bạn cần đăng nhập để bình luận!');
            return res.redirect('back');
        }

        const { content, product_id, parent_id, rating } = req.body;

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
            parent_id: parent_id || "",
            rating: rating ? parseInt(rating) : null,
            status: "active"
        });

        await comment.save();

        req.flash('success', 'Bình luận của bạn đã được gửi thành công!');
        res.redirect('back');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        res.redirect('back');
    }
};

// [PATCH] /comments/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        if (!res.locals.user) {
            req.flash('error', 'Bạn cần đăng nhập!');
            return res.redirect('back');
        }

        const { content, rating } = req.body;
        const commentId = req.params.id;

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
        res.redirect('back');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        res.redirect('back');
    }
};

// [DELETE] /comments/delete/:id
module.exports.deleteItem = async (req, res) => {
    try {
        if (!res.locals.user) {
            req.flash('error', 'Bạn cần đăng nhập!');
            return res.redirect('back');
        }

        const commentId = req.params.id;

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
        res.redirect('back');
    } catch (error) {
        console.log(error);
        req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        res.redirect('back');
    }
};
