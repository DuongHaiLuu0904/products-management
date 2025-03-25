const Product = require('../../models/product.model')
const productHelper = require('../../helpers/product')

// [GET] /
module.exports.index = async (req, res) => {
    const productFeature = await Product.find({
        featured: "1",
        deleted: false,
        status: "active"
    })

    const newProducts = productHelper.priceNew(productFeature)

    res.render('client/pages/home/index', {
        title: 'Trang chủ',
        productFeature: newProducts
    })
}