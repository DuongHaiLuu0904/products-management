const systemconfig = require('../../config/system')

const dashboardRoute = require('./dashboard.route')
const productRoute = require('./product.route')


module.exports = (app) => {
    const PATH_ADMIN = systemconfig.prefixAdmin

    app.use(PATH_ADMIN + '/dashboard', dashboardRoute)
    app.use(PATH_ADMIN + '/products', productRoute)
}