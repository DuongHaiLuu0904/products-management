import productRoute from './products.route.js'
import homeRoute from './home.route.js'
import searchRoute from './search.route.js'
import cartRoute from './cart.route.js'
import checkoutRoute from './checkout.route.js'
import userRoute from './user.route.js'
import chatRoute from './chat.route.js'
import usersRoute from './users.route.js'
import commentRoute from './comment.route.js'
import tokenRoute from './token.route.js'

import { caegory } from '../../middlewares/client/category.middleware.js'
import { cardId } from '../../middlewares/client/cart.middleware.js'
import { infoUser } from '../../middlewares/client/user.middleware.js'
import { infoSetting } from '../../middlewares/client/setting.middleware.js'
import { autoRefreshToken } from '../../middlewares/client/autoRefresh.middleware.js'

import { reuireAuth } from '../../middlewares/client/auth.middleware.js'

export default (app) => {
    app.use(autoRefreshToken)
    app.use(caegory)
    app.use(cardId)
    app.use(infoUser)
    app.use(infoSetting)

    app.use('/', homeRoute)
    
    app.use('/products', productRoute) 
    
    app.use('/search', searchRoute) 

    app.use('/cart', cartRoute)

    app.use('/checkout', checkoutRoute)

    app.use('/user', userRoute)

    app.use('/chat', reuireAuth, chatRoute)

    app.use('/users', reuireAuth, usersRoute)

    app.use('/comments', commentRoute)
    
    app.use('/token', tokenRoute)
}