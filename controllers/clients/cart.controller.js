import Cart from '../../models/cart.model.js'
import Product from '../../models/product.model.js'

import * as productHelper from '../../helpers/product.js'

// [GET] /cart
export const index = async (req, res) => {
    const userId = res.locals.user?._id

    if (!userId) {
        req.flash('error', 'Bạn cần đăng nhập để xem giỏ hàng!')
        return res.redirect('/login')
    }
    
    const cart = await Cart.findOne({
        user_id: userId
    }) 

    if (cart && cart.products && cart.products.length > 0) {
        for (const item of cart.products) {
            const product = await Product.findById(item.product_id)

            if (product) {
                product.priceNew = productHelper.priceNewProduct(product)
                item.totalPrice = item.quantity * product.priceNew
                item.productInfo = product
            }
        }
        cart.totalPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0)
    } else {
        if (cart) {
            cart.totalPrice = 0
        }
    }
    
    res.render('client/pages/cart/index', {
        title: 'Giỏ hàng',
        cartDetail: cart
    })
}

// [POST] /cart/add/:productId
export const addPost = async (req, res) => {
    const userId = res.locals.user?._id

    if (!userId) {
        req.flash('error', 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng!')
        return res.redirect('/login')
    }

    const productId = req.params.productId
    const quantity = parseInt(req.body.quantity) || 1

    // Validate quantity
    if (quantity <= 0) {
        req.flash('error', 'Số lượng sản phẩm phải lớn hơn 0!')
        return res.redirect(req.headers.referer)
    }

    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId)
    if (!product) {
        req.flash('error', 'Sản phẩm không tồn tại!')
        return res.redirect(req.headers.referer)
    }

    // Tìm hoặc tạo cart cho user
    let cart = await Cart.findOne({ user_id: userId })

    if (!cart) {
        cart = new Cart({
            user_id: userId,
            products: []
        })
        await cart.save()
    }

    const existingProduct = cart.products.find(product => product.product_id.toString() === productId)

    if (existingProduct) {
        // Cập nhật số lượng
        existingProduct.quantity += quantity
        await cart.save()
        req.flash('success', 'Cập nhật số lượng sản phẩm thành công!')
    } else {
        // Thêm sản phẩm mới
        cart.products.push({
            product_id: productId,
            quantity: quantity
        })
        await cart.save()
        req.flash('success', 'Thêm sản phẩm vào giỏ hàng thành công!')
    }

    res.redirect(req.headers.referer)
}

// [GET] /cart/delete/:id
export const deleteProduct = async (req, res) => {
    const userId = res.locals.user?._id
    const productId = req.params.id

    if (!userId) {
        req.flash('error', 'Bạn cần đăng nhập!')
        return res.redirect('/login')
    }

    await Cart.updateOne(
        { user_id: userId },
        { $pull: { products: { product_id: productId } } }
    )

    req.flash('success', 'Xóa sản phẩm khỏi giỏ hàng thành công!')
    res.redirect(req.headers.referer)
}

// [GET] /cart/update/:id/:quantity
export const update = async (req, res) => {
    const userId = res.locals.user?._id
    const productId = req.params.id
    const quantity = parseInt(req.params.quantity)

    if (!userId) {
        req.flash('error', 'Bạn cần đăng nhập!')
        return res.redirect('/login')
    }

    // Validate quantity
    if (quantity <= 0) {
        req.flash('error', 'Số lượng sản phẩm phải lớn hơn 0!')
        return res.redirect(req.headers.referer)
    }

    const cart = await Cart.findOne({ user_id: userId })
    if (cart) {
        const product = cart.products.find(p => p.product_id.toString() === productId)
        if (product) {
            product.quantity = quantity
            await cart.save()
            req.flash('success', 'Cập nhật số lượng sản phẩm thành công!')
        }
    }

    res.redirect(req.headers.referer)
}