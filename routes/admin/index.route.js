const systemconfig = require('../../config/system')

const dashboardRoute = require('./dashboard.route')
const productRoute = require('./product.route')
const productCategoryRoute = require('./product-category.route')
const roleRoute = require('./role.route')
const accountRoute = require('./account.route')
const authRoute = require('./auth.route')


module.exports = (app) => {
    const PATH_ADMIN = systemconfig.prefixAdmin

    app.use(PATH_ADMIN + '/dashboard', dashboardRoute)
    app.use(PATH_ADMIN + '/products', productRoute)
    app.use(PATH_ADMIN + '/products-category', productCategoryRoute)
    app.use(PATH_ADMIN + '/roles', roleRoute)
    app.use(PATH_ADMIN + '/accounts', accountRoute)
    app.use(PATH_ADMIN + '/auth', authRoute)
}