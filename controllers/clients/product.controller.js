const Product = require('../../models/product.model');
const ProductCategory = require('../../models/product-category.model');
const productHelper = require('../../helpers/product')
const productCategoryHelper = require('../../helpers/products-category')

// [GET] /products
module.exports.index = async (req, res) => {
    const products = await Product.find({
        status: 'active',
        deleted: false
    }).sort({ position: "desc" })

    const newProducts = productHelper.priceNew(products)

    // console.log(newProducts)
    res.render('client/pages/products/index', {
        title: 'Trang sản phẩm',
        products: newProducts
    })
}

// [GET] /products/:slug
module.exports.detail = async (req, res) => {
    try {
        const find = {
            deleted: false,
            slug: req.params.slug,
            status: 'active'
        }
        const product = await Product.findOne(find)

        console.log(product)

        res.render('client/pages/products/detail', {
            title: 'Chi tiết sản phẩm',
            product: product
        });
    } catch (error) {
        res.redirect(`/products`);
    }
}

// [GET] /products/:slugCategory
module.exports.category = async (req, res) => {
    const category = await ProductCategory.findOne({
        deleted: false,
        slug: req.params.slugCategory,
        status: 'active'
    })

    const listCategorie = await productCategoryHelper.getSubCategory(category.id)

    const listCategorieId = listCategorie.map(item => item.id)

    const products = await Product.find({
        deleted: false,
        status: 'active',
        product_category_id: { $in: [category.id, ...listCategorieId] }
    }).sort({ position : "desc"})

    const newProducts = productHelper.priceNew(products)
    res.render('client/pages/products/index', {
        title: category.title,
        products: newProducts
    })
}