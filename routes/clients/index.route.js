const productRoute = require('./products.route')
const homeRoute = require('./home.route')
const searchRoute = require('./search.route')
const cartRoute = require('./cart.route')
const checkoutRoute = require('./checkout.route')
const userRoute = require('./user.route')
const chatRoute = require('./chat.route')
const usersRoute = require('./users.route')

const categoryMiddleware = require('../../middlewares/client/category.middleware')
const cartMiddleware = require('../../middlewares/client/cart.middleware')
const userMiddleware = require('../../middlewares/client/user.middleware')
const settingMiddleware = require('../../middlewares/client/setting.middleware')

const authMiddleware = require('../../middlewares/client/auth.middleware.js')

module.exports = (app) => {
    app.use(categoryMiddleware.caegory)
    app.use(cartMiddleware.cardId)
    app.use(userMiddleware.infoUser)
    app.use(settingMiddleware.infoSetting)

    app.use('/', homeRoute)
    
    app.use('/products', productRoute) 
    
    app.use('/search', searchRoute) 

    app.use('/cart', cartRoute)

    app.use('/checkout', checkoutRoute)

    app.use('/user', userRoute)

    app.use('/chat', authMiddleware.reuireAuth, chatRoute)

    app.use('/users', authMiddleware.reuireAuth, usersRoute)
}