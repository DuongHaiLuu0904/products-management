import { Schema, model } from 'mongoose';

const ChatSchema = new Schema({
    user_id: String,
    room_chat_id: String,
    content: String,
    images: Array,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, {
    timestamps: true
});

const Chat = model('Chat', ChatSchema, 'chat');
export default Chat;