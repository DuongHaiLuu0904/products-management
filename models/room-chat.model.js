import { Schema, model } from 'mongoose';

const RoomChatSchema = new Schema({
    title: String,
    avatar: String,
    typeRoom: String, // "group" hoặc "friend"
    status: String,
    users: [
        {
            user_id: String,
            role: String
        }
    ],
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, {
    timestamps: true
});

const RoomChat = model('RoomChat', RoomChatSchema, 'rooms-chat');
export default RoomChat;
