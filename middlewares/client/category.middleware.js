import ProductCategory from '../../models/product-category.model.js';
import { createTree } from "../../helpers/createTree.js";

export async function caegory(req, res, next) {
    
    const records = await ProductCategory.find({ deleted: false })

    const newRecords = createTree(records)
    res.locals.layoutProductCategory = newRecords
    next()
}