const Category = require('../../models/product-category.model')
const Product = require('../../models/product.model')
const User = require('../../models/user.model')
const Account = require('../../models/account.model')
const Order = require('../../models/order.model')

// [GET] /admin/dashboard
module.exports.dashboard = async (req, res) => {
    // Tính toán doanh thu và thống kê đơn hàng
    const orders = await Order.find({});
    
    // Tính tổng doanh thu
    let totalRevenue = 0;
    let totalOrders = orders.length;
    
    orders.forEach(order => {
        order.products.forEach(product => {
            const price = product.price * (1 - product.discountPercentage / 100);
            totalRevenue += price * product.quantity;
        });
    });
    
    // Thống kê đơn hàng theo tháng hiện tại
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const ordersThisMonth = await Order.find({
        createdAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1)
        }
    });
    
    let revenueThisMonth = 0;
    ordersThisMonth.forEach(order => {
        order.products.forEach(product => {
            const price = product.price * (1 - product.discountPercentage / 100);
            revenueThisMonth += price * product.quantity;
        });
    });

    // Thống kê đơn hàng theo ngày hôm nay
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const ordersToday = await Order.find({
        createdAt: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    });
    
    let revenueToday = 0;
    ordersToday.forEach(order => {
        order.products.forEach(product => {
            const price = product.price * (1 - product.discountPercentage / 100);
            revenueToday += price * product.quantity;
        });
    });

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
        },
        order: {
            total: totalOrders,
            thisMonth: ordersThisMonth.length,
            today: ordersToday.length
        },
        revenue: {
            total: Math.round(totalRevenue),
            thisMonth: Math.round(revenueThisMonth),
            today: Math.round(revenueToday)
        }
    }
    
    res.render('admin/pages/dashboard/index', {
        title: 'Trang tổng quan',
        statistics: statistics
    });
}

// [GET] /admin/dashboard/statistics
module.exports.getStatistics = async (req, res) => {
    try {
        const { period } = req.query; // 'week', 'month', 'year'
        
        let dateFilter = {};
        const currentDate = new Date();
        
        switch(period) {
            case 'week':
                const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
            case 'year':
                const yearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
                dateFilter = { createdAt: { $gte: yearAgo } };
                break;
            default:
                dateFilter = {};
        }
        
        const orders = await Order.find(dateFilter);
        
        // Tạo mảng dữ liệu cho biểu đồ
        const chartData = {};
        
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!chartData[date]) {
                chartData[date] = {
                    orders: 0,
                    revenue: 0
                };
            }
            
            chartData[date].orders += 1;
            
            order.products.forEach(product => {
                const price = product.price * (1 - product.discountPercentage / 100);
                chartData[date].revenue += price * product.quantity;
            });
        });
        
        res.json(chartData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
