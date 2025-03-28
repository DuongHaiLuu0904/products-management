const ProductCategory = require('../models/product-category.model')

module.exports.getSubCategory = async (parentId) => {
    const getCategory = async (parentId) => {
        const subs = await ProductCategory.find({
            deleted: false,
            status: 'active',
            parent_id: parentId
        })
    
        let allSub = [...subs]
    
        for (const sub of subs) {
            const childs = await getCategory(sub.id)
            allSub = allSub.concat(childs)
        }
        return allSub
    }

    const listCategory = await getCategory(parentId)
    return listCategory
}
