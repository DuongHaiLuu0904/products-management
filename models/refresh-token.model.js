import { Schema, model } from 'mongoose';

const refreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: String,
        required: true
    },
    user_type: {
        type: String,
        enum: ['user', 'account'],
        required: true
    },
    expires_at: {
        type: Date,
        required: true
    },
    is_revoked: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index để tự động xóa token hết hạn
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = model('RefreshToken', refreshTokenSchema, 'refresh-tokens');
export default RefreshToken;
