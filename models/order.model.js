import { Schema, model } from 'mongoose';

const orderSchema = new Schema({
    cart_id: String,
    userInfo: {
        fullname: String,
        phone: String,
        address: String
    },
    products: [
        {
            product_id: String,
            price: Number,
            discountPercentage: Number,
            quantity: Number
        }
    ],
}, {
    timestamps: true
});

const Order = model('Order', orderSchema, 'order');
export default Order;