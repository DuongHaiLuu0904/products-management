const mongoose = require('mongoose');
const generate = require('../helpers/generate')

const accountSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    token: {
        type: String,
        default: () => generate.generateRamdomString(32) 
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

const Account = mongoose.model('Account', accountSchema, 'accounts');
module.exports = Account;
