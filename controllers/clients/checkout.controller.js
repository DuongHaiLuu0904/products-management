const Order = require('../../models/order.model')
const Cart = require('../../models/cart.model')
const Product = require('../../models/product.model')

const productHelper = require('../../helpers/product')

//[GET] /checkout
module.exports.index = async (req, res) => {
    const cartId = req.cookies.cartId

    const cart = await Cart.findOne({
        _id: cartId
    }) 
    
    if(cart.products.length > 0) {
        for(const item of cart.products) {
            const product = await Product.findOne({
                _id: item.product_id
            })

            product.priceNew = productHelper.priceNewProduct(product)

            item.totalPrice = item.quantity * product.priceNew

            item.productInfo = product
        }
    }
    cart.totalPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0)

    res.render('client/pages/checkout/index', {
        title: 'Thanh toán',
        cartDetail: cart
    })
}

//[POST] /checkout/order
module.exports.orderPost = async (req, res) => {
    const cartId = req.cookies.cartId
    const userInfo = req.body

    const cart = await Cart.findOne({
        _id: cartId
    })

    // Kiểm tra số lượng tồn kho trước khi đặt hàng
    for(const product of cart.products) {
        const productInfo = await Product.findOne({
            _id: product.product_id
        })
        
        if(productInfo.stock < product.quantity) {
            req.flash('error', `Sản phẩm "${productInfo.title}" chỉ còn ${productInfo.stock} sản phẩm trong kho, không đủ số lượng bạn yêu cầu (${product.quantity}).`)
            return res.redirect('/checkout')
        }
    }

    let products = []

    for(const product of cart.products) {
        const objectProduct = {
            product_id: product.product_id,
            price: 0,
            discountPercentage: 0,
            quantity: product.quantity
        }

        const productInfo = await Product.findOne({
            _id: product.product_id
        })
        objectProduct.price = productInfo.price
        objectProduct.discountPercentage = productInfo.discountPercentage

        products.push(objectProduct)
    }

    const objectOrder = {
        cart_id: cartId,
        userInfo: userInfo,
        products: products
    }

    const order = new Order(objectOrder)
    await order.save()

    // Cập nhật số lượng tồn kho của các sản phẩm sau khi đặt hàng thành công
    for(const product of cart.products) {
        await Product.updateOne({
            _id: product.product_id
        }, {
            $inc: {
                stock: -product.quantity
            }
        })
    }

    await Cart.updateOne({
        _id: cartId
    }, {
        $set: {
            products: []
        }
    })

    res.redirect(`/checkout/success/${order.id}`)
}

//[GET] /checkout/success/:id
module.exports.success = async (req, res) => {
    
    const order = await Order.findOne({
        _id: req.params.id
    })

    for(const product of order.products) {
        const productInfo = await Product.findOne({
            _id: product.product_id
        }).select('title thumbnail')

        product.productInfo = productInfo

        product.priceNew = productHelper.priceNewProduct(product)
        
        product.totalPrice = product.quantity * product.priceNew
    }

    order.totalPrice = order.products.reduce((sum, item) => sum + item.totalPrice, 0)

    res.render('client/pages/checkout/success', {
        title: 'Đặt hàng thành công',
        order: order
    })
}