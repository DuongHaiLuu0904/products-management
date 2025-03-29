const productRoute = require('./products.route')
const homeRoute = require('./home.route')
const searchRoute = require('./search.route')
const cartRoute = require('./cart.route')

const categoryMiddleware = require('../../middlewares/client/category.middleware')
const cartMiddleware = require('../../middlewares/client/cart.middleware')

module.exports = (app) => {
    app.use(categoryMiddleware.caegory)
    app.use(cartMiddleware.cardId)

    app.use('/', homeRoute)
    
    app.use('/products', productRoute) 
    
    app.use('/search', searchRoute) 

    app.use('/cart', cartRoute)
}