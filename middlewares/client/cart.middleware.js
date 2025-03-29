const e = require('express');
const Cart = require('../../models/cart.model');

module.exports.cardId = async (req, res, next) => {
    if (!req.cookies.cartId) {
        const cart = new Cart({
            user_id: req.cookies.cartId,
            products: []
        });
        await cart.save()
        res.cookie('cartId', cart._id, { 
            expires: new Date(Date.now() + 1000*60*60*24*30*365), 
            httpOnly: true, 
            secure: false, 
            sameSite: 'strict' 
        });
    } else {
        const cart = await Cart.findOne({ _id: req.cookies.cartId });
        
        cart.totalQuantity = cart.products.reduce((total, product) => total + product.quantity, 0)

        res.locals.cart = cart;
    }
    next();
}