import Order from '../../models/order.model.js'
import Cart from '../../models/cart.model.js'
import Product from '../../models/product.model.js'

import { priceNewProduct } from '../../helpers/product.js'

//[GET] /checkout
export async function index(req, res) {
    const userId = res.locals.user?._id

    if (!userId) {
        req.flash('error', 'Bạn cần đăng nhập để thanh toán!')
        return res.redirect('/login')
    }

    const cart = await Cart.findOne({
        user_id: userId
    }) 
    
    if (!cart || !cart.products || cart.products.length === 0) {
        req.flash('error', 'Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.')
        return res.redirect('/cart')
    }
    
    for (const item of cart.products) {
        const product = await Product.findById(item.product_id)

        if (!product) {
            req.flash('error', 'Có sản phẩm trong giỏ hàng không tồn tại!')
            return res.redirect('/cart')
        }

        product.priceNew = priceNewProduct(product)
        item.totalPrice = item.quantity * product.priceNew
        item.productInfo = product
    }
    
    cart.totalPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0)

    res.render('client/pages/checkout/index', {
        title: 'Thanh toán',
        cartDetail: cart
    })
}

//[POST] /checkout/order
export async function orderPost(req, res) {
    const userId = res.locals.user?._id
    const userInfo = req.body

    if (!userId) {
        req.flash('error', 'Bạn cần đăng nhập để đặt hàng!')
        return res.redirect('/login')
    }

    const cart = await Cart.findOne({
        user_id: userId
    })

    if (!cart || !cart.products || cart.products.length === 0) {
        req.flash('error', 'Giỏ hàng của bạn đang trống. Không thể thực hiện đặt hàng.')
        return res.redirect('/cart')
    }

    for (const cartProduct of cart.products) {
        const productInfo = await Product.findById(cartProduct.product_id)
        
        if (!productInfo) {
            req.flash('error', 'Có sản phẩm trong giỏ hàng không tồn tại!')
            return res.redirect('/cart')
        }
        
        if (cartProduct.quantity <= 0) {
            req.flash('error', `Số lượng sản phẩm "${productInfo.title}" không hợp lệ. Vui lòng kiểm tra lại.`)
            return res.redirect('/checkout')
        }

        if (productInfo.stock <= 0) {
            req.flash('error', `Sản phẩm "${productInfo.title}" đã hết hàng, không thể đặt hàng.`)
            return res.redirect('/checkout')
        }

        if (productInfo.stock < cartProduct.quantity) {
            req.flash('error', `Sản phẩm "${productInfo.title}" chỉ còn ${productInfo.stock} sản phẩm trong kho, không đủ số lượng bạn yêu cầu (${cartProduct.quantity}).`)
            return res.redirect('/checkout')
        }
    }

    let products = []

    for (const cartProduct of cart.products) {
        const productInfo = await Product.findById(cartProduct.product_id)
        
        const objectProduct = {
            product_id: cartProduct.product_id,
            price: productInfo.price,
            discountPercentage: productInfo.discountPercentage,
            quantity: cartProduct.quantity
        }

        products.push(objectProduct)
    }

    const objectOrder = {
        user_id: userId, 
        cart_id: cart._id,
        userInfo: userInfo,
        products: products
    }

    const order = new Order(objectOrder)
    await order.save()

    for (const cartProduct of cart.products) {
        await Product.updateOne({
            _id: cartProduct.product_id
        }, {
            $inc: {
                stock: -cartProduct.quantity
            }
        })
    }

    await Cart.updateOne({
        user_id: userId
    }, {
        $set: {
            products: []
        }
    })

    res.redirect(`/checkout/success/${order.id}`)
}

//[GET] /checkout/success/:id
export async function success(req, res) {
    const userId = res.locals.user?._id
    const orderId = req.params.id

    if (!userId) {
        req.flash('error', 'Bạn cần đăng nhập để xem đơn hàng!')
        return res.redirect('/login')
    }
    
    const order = await Order.findOne({
        _id: orderId
    })

    for (const product of order.products) {
        const productInfo = await Product.findById(product.product_id)
            .select('title thumbnail')

        if (productInfo) {
            product.productInfo = productInfo
            product.priceNew = priceNewProduct(product)
            product.totalPrice = product.quantity * product.priceNew
        }
    }

    order.totalPrice = order.products.reduce((sum, item) => sum + item.totalPrice, 0)

    res.render('client/pages/checkout/success', {
        title: 'Đặt hàng thành công',
        order: order
    })
}