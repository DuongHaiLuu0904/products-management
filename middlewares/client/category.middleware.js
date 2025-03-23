const ProductCategory = require('../../models/product-category.model');
const createTreeHelper = require("../../helpers/createTree")

module.exports.caegory = async (req, res, next) => {
    
    const records = await ProductCategory.find({ deleted: false })

    const newRecords = createTreeHelper.createTree(records)
    res.locals.layoutProductCategory = newRecords
    next()
}