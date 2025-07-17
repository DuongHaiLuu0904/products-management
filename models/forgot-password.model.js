import { Schema, model } from 'mongoose';

const forgotPasswordSchema = new Schema({
    email: String,
    otp: String,
    expriredAt: {
        type: Date,
        expires: 180
    },
}, {
    timestamps: true
});

const forgotPassword = model('forgotPassword', forgotPasswordSchema, 'forgot-password');
export default forgotPassword;
