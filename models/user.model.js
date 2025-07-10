const mongoose = require('mongoose')
const generate = require('../helpers/generate');

const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    tokenUser: {
        type: String,
        default: () => generate.generateRamdomString(32) 
    },
    address: String,
    phone: String,
    public_id: String,
    avatar: String,
    friendList: [
        {
            user_id: String,
            room_chat_id: String
        }
    ],
    acceptFriend: Array,
    requestFriend: Array,
    productComments: [
        {
            product_id: String,
            content: String,
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    status: {
        type: String,
        default: 'active'
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deleteAt: Date
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema, 'user');
module.exports = User;