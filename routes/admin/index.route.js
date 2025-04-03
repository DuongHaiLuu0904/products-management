const systemconfig = require('../../config/system')

const middleware = require('../../middlewares/admin/auth.middleware')

const dashboardRoute = require('./dashboard.route')
const productRoute = require('./product.route')
const productCategoryRoute = require('./product-category.route')
const roleRoute = require('./role.route')
const accountRoute = require('./account.route')
const authRoute = require('./auth.route')
const my_accountRoute = require('./my-account.route')
const settingRoute = require('./setting.route')
const userRoute = require('./user.route')

module.exports = (app) => {
    const PATH_ADMIN = systemconfig.prefixAdmin

    app.use(PATH_ADMIN + '/dashboard', middleware.reuireAuth, dashboardRoute)

    app.use(PATH_ADMIN + '/products', middleware.reuireAuth, productRoute)

    app.use(PATH_ADMIN + '/products-category', middleware.reuireAuth, productCategoryRoute)

    app.use(PATH_ADMIN + '/roles', middleware.reuireAuth, roleRoute)

    app.use(PATH_ADMIN + '/accounts', middleware.reuireAuth, accountRoute)

    app.use(PATH_ADMIN + '/auth', authRoute)

    app.use(PATH_ADMIN + '/my-account', middleware.reuireAuth, my_accountRoute)

    app.use(PATH_ADMIN + '/setting', middleware.reuireAuth, settingRoute)

    app.use(PATH_ADMIN + '/users', middleware.reuireAuth, userRoute)
}