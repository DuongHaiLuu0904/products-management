const Product = require('../../models/product.model')
const productHelper = require('../../helpers/product')

// [GET] /
module.exports.index = async (req, res) => {
    const keyword = req.query.keyword 

    let newProducts = []
    
    if (keyword) {
        const keywordRegex = new RegExp(keyword, 'i')

        const products = await Product.find({
            deleted: false,
            status: 'active',
            title: keywordRegex
        })

        newProducts = productHelper.priceNew(products)
    }

    res.render('client/pages/search/index', {
        title: 'Kết quả tìm kiếm',
        products: newProducts,
        keyword: keyword 
    })
}