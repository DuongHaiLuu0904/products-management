import Cart from '../../models/cart.model.js'
import Product from '../../models/product.model.js'

import * as productHelper from '../../helpers/product.js'
import { validateCartIntegrity } from '../../validates/client/cart.validate.js'

// [GET] /cart
export const index = async (req, res) => {
    try {
        // Sử dụng userId đã được validate từ middleware
        const userId = req.validatedUserId

        const cart = await Cart.findOne({
            user_id: userId
        })

        if (cart && cart.products && cart.products.length > 0) {
            // Validate cart integrity
            const integrityCheck = validateCartIntegrity(cart);
            if (!integrityCheck.isValid) {
                req.flash('error', 'Dữ liệu giỏ hàng không hợp lệ!');
                return res.redirect('/');
            }

            for (const item of cart.products) {
                const product = await Product.findById(item.product_id);

                if (product) {
                    // Kiểm tra product status và availability
                    if (product.status !== 'active') {
                        continue; // Skip inactive products
                    }

                    product.priceNew = productHelper.priceNewProduct(product);
                    item.totalPrice = item.quantity * product.priceNew;
                    item.productInfo = product;
                } else {
                    // Có thể remove sản phẩm không tồn tại khỏi cart
                }
            }

            // Filter out items without valid product info
            cart.products = cart.products.filter(item => item.productInfo);
            cart.totalPrice = cart.products.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        } else {
            if (cart) {
                cart.totalPrice = 0;
            }
        }

        res.render('client/pages/cart/index', {
            title: 'Giỏ hàng',
            cartDetail: cart
        });
    } catch (error) {
        req.flash('error', 'Lỗi khi tải giỏ hàng!');
        return res.redirect('/');
    }
}

// [POST] /cart/add/:productId
export const addPost = async (req, res) => {
    try {
        // Sử dụng dữ liệu đã được validate từ middleware
        const userId = req.validatedUserId;
        const productId = req.validatedProductId;
        const quantity = req.validatedQuantity;

        // Kiểm tra sản phẩm có tồn tại và active không
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Sản phẩm không tồn tại!');
            return res.redirect('back');
        }

        if (product.status !== 'active') {
            req.flash('error', 'Sản phẩm không khả dụng!');
            return res.redirect('back');
        }

        // Kiểm tra stock nếu có field này
        if (product.stock !== undefined && product.stock < quantity) {
            req.flash('error', 'Số lượng sản phẩm trong kho không đủ!');
            return res.redirect('back');
        }

        let cart = await Cart.findOne({ 
            user_id: userId 
        });

        if (!cart) {
            cart = new Cart({
                user_id: userId,
                products: []
            });
        }

        // Validate cart integrity trước khi modify
        if (cart._id) {
            const integrityCheck = validateCartIntegrity(cart);
            if (!integrityCheck.isValid) {
                req.flash('error', 'Dữ liệu giỏ hàng không hợp lệ!');
                return res.redirect('back');
            }
        }

        const existingProduct = cart.products.find(product => product.product_id.toString() === productId);

        if (existingProduct) {
            const newQuantity = existingProduct.quantity + quantity;
            
            // Kiểm tra tổng số lượng không vượt quá giới hạn
            if (newQuantity > 100) {
                req.flash('error', 'Tổng số lượng sản phẩm không được vượt quá 100!');
                return res.redirect('back');
            }

            // Kiểm tra stock cho tổng số lượng mới
            if (product.stock !== undefined && product.stock < newQuantity) {
                req.flash('error', 'Số lượng sản phẩm trong kho không đủ!');
                return res.redirect('back');
            }

            existingProduct.quantity = newQuantity;
            req.flash('success', 'Cập nhật số lượng sản phẩm thành công!');
        } else {
            cart.products.push({
                product_id: productId,
                quantity: quantity
            });
            req.flash('success', 'Thêm sản phẩm vào giỏ hàng thành công!');
        }

        await cart.save();

        res.redirect('back');
    } catch (error) {
        req.flash('error', 'Lỗi khi thêm sản phẩm vào giỏ hàng!');
        return res.redirect('back');
    }
}

// [GET] /cart/delete/:id
export const deleteProduct = async (req, res) => {
    try {
        // Sử dụng dữ liệu đã được validate từ middleware
        const userId = req.validatedUserId;
        const productId = req.validatedProductId;

        // Tìm cart và validate
        const cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            req.flash('error', 'Giỏ hàng không tồn tại!');
            return res.redirect('back');
        }

        // Validate cart integrity
        const integrityCheck = validateCartIntegrity(cart);
        if (!integrityCheck.isValid) {
            req.flash('error', 'Dữ liệu giỏ hàng không hợp lệ!');
            return res.redirect('back');
        }

        // Kiểm tra sản phẩm có trong cart không
        const productExists = cart.products.some(product => product.product_id.toString() === productId);
        if (!productExists) {
            req.flash('error', 'Sản phẩm không có trong giỏ hàng!');
            return res.redirect('back');
        }

        await Cart.updateOne(
            { user_id: userId },
            { $pull: { products: { product_id: productId } } }
        );

        req.flash('success', 'Xóa sản phẩm khỏi giỏ hàng thành công!');
        res.redirect('back');
    } catch (error) {
        req.flash('error', 'Lỗi khi xóa sản phẩm khỏi giỏ hàng!');
        return res.redirect('back');
    }
}

// [GET] /cart/update/:id/:quantity
export const update = async (req, res) => {
    try {
        // Sử dụng dữ liệu đã được validate từ middleware
        const userId = req.validatedUserId;
        const productId = req.validatedProductId;
        const quantity = req.validatedQuantity;

        // Tìm cart và validate
        const cart = await Cart.findOne({ user_id: userId });
        if (!cart) {
            req.flash('error', 'Giỏ hàng không tồn tại!');
            return res.redirect('back');
        }

        // Validate cart integrity
        const integrityCheck = validateCartIntegrity(cart);
        if (!integrityCheck.isValid) {
            req.flash('error', 'Dữ liệu giỏ hàng không hợp lệ!');
            return res.redirect('back');
        }

        // Tìm sản phẩm trong cart
        const product = cart.products.find(p => p.product_id.toString() === productId);
        if (!product) {
            req.flash('error', 'Sản phẩm không có trong giỏ hàng!');
            return res.redirect('back');
        }

        // Kiểm tra product có tồn tại trong database không
        const productInfo = await Product.findById(productId);
        if (!productInfo) {
            req.flash('error', 'Sản phẩm không tồn tại!');
            return res.redirect('back');
        }

        if (productInfo.status !== 'active') {
            req.flash('error', 'Sản phẩm không khả dụng!');
            return res.redirect('back');
        }

        // Kiểm tra stock nếu có
        if (productInfo.stock !== undefined && productInfo.stock < quantity) {
            req.flash('error', 'Số lượng sản phẩm trong kho không đủ!');
            return res.redirect('back');
        }

        // Cập nhật quantity
        product.quantity = quantity;
        await cart.save();

        req.flash('success', 'Cập nhật số lượng sản phẩm thành công!');
        res.redirect('back');
    } catch (error) {
        req.flash('error', 'Lỗi khi cập nhật số lượng sản phẩm!');
        return res.redirect('back');
    }
}