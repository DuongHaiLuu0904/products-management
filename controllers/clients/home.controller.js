import Product from '../../models/product.model.js'
import { priceNew } from '../../helpers/product.js'
import { redisConfig } from '../../config/redis.js'

// [GET] /
export async function index(req, res) {
    try {
        const cacheKey = 'homepage_featured_products';
        
        // Kiểm tra cache trước
        let featuredProducts = await redisConfig.get(cacheKey);
        
        if (featuredProducts) {
            console.log('📦 Featured products cache hit');
        } else {
            console.log('🔍 Fetching featured products from database');
            const productFeature = await Product.find({
                featured: "1",
                deleted: false,
                status: "active"
            });

            featuredProducts = priceNew(productFeature);
            
            // Cache trong 30 phút
            await redisConfig.set(cacheKey, featuredProducts, 1800);
            console.log('💾 Featured products cached');
        }

        res.render('client/pages/home/index', {
            title: 'Trang chủ',
            productFeature: featuredProducts
        });
    } catch (error) {
        console.error('Error in homepage:', error);
        res.redirect('/products');
    }
}