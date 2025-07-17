import { plugin, Schema, model } from 'mongoose';
import slug from 'mongoose-slug-updater';
plugin(slug)

const roleSchema = new Schema({
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

const Role = model('Role', roleSchema, 'roles');
export default Role;