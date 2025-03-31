const mongoose = require('mongoose');

const forgotPasswordSchema = new mongoose.Schema({
    email: String,
    otp: String,
    expriredAt: {
        type: Date,
        expires: 180
    },
}, {
    timestamps: true
});

const forgotPassword = mongoose.model('forgotPassword', forgotPasswordSchema, 'forgot-password');
module.exports = forgotPassword;
