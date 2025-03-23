const productRoute = require('./products.route')
const homeRoute = require('./home.route')

const categoryMiddleware = require('../../middlewares/client/category.middleware')

module.exports = (app) => {
    app.use(categoryMiddleware.caegory)

    app.use('/', homeRoute)
    
    app.use('/products', productRoute) 
}