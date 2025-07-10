const Product = require('../../models/product.model')
const productHelper = require('../../helpers/product')
const fuzzySearchHelper = require('../../helpers/fuzzySearch')


// [GET] /
module.exports.index = async (req, res) => {
    const keyword = req.query.keyword 

    let newProducts = []
    let searchType = 'none'
    let totalFound = 0
    
    if (keyword) {
        // Lấy tất cả sản phẩm active
        const allProducts = await Product.find({
            deleted: false,
            status: 'active'
        })

        // Sử dụng tìm kiếm mờ với Fuse.js
        const fuzzyResult = fuzzySearchHelper.searchProducts(allProducts, keyword)
        
        if (fuzzyResult.results.length > 0) {
            newProducts = productHelper.priceNew(fuzzyResult.results)
            searchType = 'fuzzy'
            totalFound = fuzzyResult.totalFound
        } else {
            // Fallback về tìm kiếm regex nếu không tìm thấy kết quả mờ
            const keywordRegex = new RegExp(keyword, 'i')
            const products = await Product.find({
                deleted: false,
                status: 'active',
                title: keywordRegex
            })
            newProducts = productHelper.priceNew(products)
            searchType = 'regex'
            totalFound = products.length
        }
    }

    res.render('client/pages/search/index', {
        title: 'Kết quả tìm kiếm',
        products: newProducts,
        keyword: keyword,
        searchType: searchType,
        totalFound: totalFound
    })
}
