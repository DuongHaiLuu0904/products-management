import { Schema, model } from 'mongoose';
import { generateRamdomString } from '../helpers/generate.js';

const accountSchema = new Schema({
    fullName: String,
    email: String,
    password: String,
    token: {
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
    phone: String,
    avatar: String,
    public_id: String,
    role_id: String,
    status: String,
    deleted: {
        type: Boolean,
        default: false
    },
    deleteAt: Date
}, {
    timestamps: true
});

const Account = model('Account', accountSchema, 'accounts');
export default Account;
