import { Schema, model } from 'mongoose';

const cartSchema = new Schema({
    user_id: String,
    products: [
        {
            product_id: String,
            quantity: Number
        }
    ],
    
}, {
    timestamps: true
});

const Cart = model('Cart', cartSchema, 'cart');
export default Cart;