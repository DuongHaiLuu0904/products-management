const Category = require('../../models/product-category.model')
const Product = require('../../models/product.model')
const User = require('../../models/user.model')
const Account = require('../../models/account.model')

// [GET] /admin/dashboard
module.exports.dashboard = async (req, res) => {
    let statistics = {
        category: {
            total: await Category.countDocuments({deleted: false}),
            active: await Category.countDocuments({deleted: false, status: 'active'}),
            inactive: await Category.countDocuments({deleted: false, status: 'inactive'})
        },
        product: {
            total: await Product.countDocuments({deleted: false}),
            active: await Product.countDocuments({deleted: false, status: 'active'}),
            inactive: await Product.countDocuments({deleted: false, status: 'inactive'})
        },
        user: {
            total: await User.countDocuments({deleted: false}),
            active: await User.countDocuments({deleted: false, status: 'active'}),
            inactive: await User.countDocuments({deleted: false, status: 'inactive'})
        },
        account: {
            total: await Account.countDocuments({deleted: false}),
            active: await Account.countDocuments({deleted: false, status: 'active'}),
            inactive: await Account.countDocuments({deleted: false, status: 'inactive'})
        }
    }
    res.render('admin/pages/dashboard/index', {
        title: 'Trang tổng quan',
        statistics: statistics
    });
}
