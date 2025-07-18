import Cart from '../../models/cart.model.js';

export async function cartId(req, res, next) {
    try {
        const userId =  res.locals.user?._id
        if (userId) {
            let cart = await Cart.findOne({ user_id: userId });
            
            if (!cart) {
                cart = new Cart({
                    user_id: userId,
                    products: []
                });
                await cart.save();
            }
            
            cart.totalQuantity = cart.products.reduce((total, product) => total + product.quantity, 0);
            res.locals.cart = cart;
            
            
        } else {
            res.locals.cart = {
                _id: null,
                user_id: null,
                products: [],
                totalQuantity: 0
            };
        }
        next();
    } catch (error) {
        console.error('Cart middleware error:', error);
        res.locals.cart = {
            _id: null,
            user_id: null,
            products: [],
            totalQuantity: 0
        };
        next();
    }
}