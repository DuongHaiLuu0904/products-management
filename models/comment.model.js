import { Schema, model } from "mongoose";

const commentSchema = new Schema({
    content: String,
    user_id: String,
    product_id: String,
    parent_id: {
        type: String,
        default: ""
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    status: {
        type: String,
        default: "active"
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        account_id: String,
        deleteAt: Date
    },
    updatedBy: [
        {
            account_id: String,
            updateAt: Date
        }
    ]
}, {
    timestamps: true
});

const Comment = model("Comment", commentSchema, "comments");

export default Comment;