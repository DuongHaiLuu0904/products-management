const mongoose = require('mongoose')

const roleSchema = new mongoose.Schema({
    title: String,
    description: String,
    permissions: {
        type: Array,
        default: []
    },
    slug: {
        type: String, 
        slug: "title", 
        unique: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deleteAt: Date
}, {
    timestamps: true
});

const Role = mongoose.model('Role', roleSchema, 'roles');
module.exports = Role;