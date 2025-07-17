import { plugin, Schema, model } from 'mongoose';
import slug from 'mongoose-slug-updater';
plugin(slug)

const productCategorySchema = new Schema({
    title: String,
    parent_id: {
        type: String,
        default: ""
    },
    description: String,
    thumbnail: String,
    public_id: String,
    status: String,
    position: Number,
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

const ProductCategory = model('ProductCategory', productCategorySchema, 'products-category');
export default ProductCategory;