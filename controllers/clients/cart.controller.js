const Cart = require('../../models/cart.model')
const Product = require('../../models/product.model')
const User = require('../../models/user.model')

const productHelper = require('../../helpers/product')

// [GET] /cart
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
        cart.totalPrice = cart.products.reduce((sum, item) => sum + item.totalPrice, 0)
    }
    

    res.render('client/pages/cart/index', {
        title: 'Giỏ hàng',
        cartDetail: cart
    })
}

// [POST] /cart/add/:id
module.exports.addPost = async (req, res) => {
    const cartId = req.cookies.cartId
    const productId = req.params.productId
    const quantity = parseInt(req.body.quantity)

    const cart = await Cart.findOne({
        _id: cartId
    })

    const exitsProduct = cart.products.find(product => product.product_id == productId)

    if(exitsProduct) {
        const newQuantity = exitsProduct.quantity + quantity
        await Cart.updateOne(
            {
                _id: cartId,
                'products.product_id': productId
            },
            {
                $set: { 'products.$.quantity': newQuantity }
            }
        )

        req.flash('success', 'Cập nhật số lượng sản phẩm thành công!')                                                                                             
    } else {
        const objectCart = {
            product_id: productId,
            quantity: quantity
        }
    
        await Cart.updateOne(
            {
                _id: cartId
            },
            {
                $push: { products: objectCart }
            }
        )
        req.flash('success', 'Thêm sản phẩm vào giỏ hàng thành công!')
    }

                                                                     
    res.redirect(req.headers.referer)                            
}

// [GET] /cart/delete/:id
module.exports.delete = async (req, res) => {
    const cartId = req.cookies.cartId
    const productId = req.params.id

    await Cart.updateOne(
        {
            _id: cartId
        },
        {
            $pull: { products: { product_id: productId } }
        }
    )

    req.flash('success', 'Xóa sản phẩm khỏi giỏ hàng thành công!')

    res.redirect(req.headers.referer)
}

// [GET] /cart/update/:id/:quantity
module.exports.update = async (req, res) => {
    const cartId = req.cookies.cartId
    const productId = req.params.id
    const quantity = parseInt(req.params.quantity)

    await Cart.updateOne(
        {
            _id: cartId,
            'products.product_id': productId
        },
        {
            $set: { 'products.$.quantity': quantity }
        }
    )

    req.flash('success', 'Cập nhật số lượng sản phẩm thành công!')

    res.redirect(req.headers.referer)
}