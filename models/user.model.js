import { Schema, model } from 'mongoose';
import { generateRamdomString } from '../helpers/generate.js';

const userSchema = new Schema({
    fullName: String,
    email: String,
    password: String,
    tokenUser: {
        type: String,
        default: () => generateRamdomString(32) 
    },
    refreshToken: {
        type: String,
        default: null
    },
    refreshTokenExpires: {
        type: Date,
        default: null
    },
    // OAuth fields
    googleId: String,
    githubId: String,
    // End OAuth fields
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

const User = model('User', userSchema, 'user');
export default User;