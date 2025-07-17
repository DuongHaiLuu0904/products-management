import Product from '../../models/product.model.js'
import { priceNew } from '../../helpers/product.js'

// [GET] /
export async function index(req, res) {
    const productFeature = await Product.find({
        featured: "1",
        deleted: false,
        status: "active"
    })

    const newProducts = priceNew(productFeature)

    res.render('client/pages/home/index', {
        title: 'Trang chủ',
        productFeature: newProducts
    })
}