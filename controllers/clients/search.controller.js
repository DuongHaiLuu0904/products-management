import Product from '../../models/product.model.js'
import { priceNew } from '../../helpers/product.js'
import { searchProducts } from '../../helpers/fuzzySearch.js'
import CacheService from '../../services/cache.service.js'
import { redisConfig } from '../../config/redis.js'


// [GET] /
export async function index(req, res) {
    try {
        const keyword = req.query.keyword;

        let newProducts = [];
        let searchType = 'none';
        let totalFound = 0;
        
        if (keyword) {
            // Sử dụng cache cho search results
            const searchResults = await CacheService.getSearchResultsWithCache(
                keyword,
                async () => {
                    // Cache tất cả products active để tăng tốc fuzzy search
                    const allProductsCacheKey = 'all_active_products';
                    let allProducts = await redisConfig.get(allProductsCacheKey);
                    
                    if (!allProducts) {
                        allProducts = await Product.find({
                            deleted: false,
                            status: 'active'
                        });
                        await redisConfig.set(allProductsCacheKey, allProducts, 1800); // 30 minutes
                        console.log('💾 All active products cached');
                    } else {
                        console.log('📦 All active products cache hit');
                    }

                    const fuzzyResult = searchProducts(allProducts, keyword);
                    
                    if (fuzzyResult.results.length > 0) {
                        return {
                            products: priceNew(fuzzyResult.results),
                            searchType: 'fuzzy',
                            totalFound: fuzzyResult.totalFound
                        };
                    } else {
                        // Fallback to regex search
                        const keywordRegex = new RegExp(keyword, 'i');
                        const products = await Product.find({
                            deleted: false,
                            status: 'active',
                            title: keywordRegex
                        });
                        
                        return {
                            products: priceNew(products),
                            searchType: 'regex',
                            totalFound: products.length
                        };
                    }
                }
            );

            newProducts = searchResults.products;
            searchType = searchResults.searchType;
            totalFound = searchResults.totalFound;
        }

        res.render('client/pages/search/index', {
            title: 'Kết quả tìm kiếm',
            products: newProducts,
            keyword: keyword,
            searchType: searchType,
            totalFound: totalFound
        });
    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).render('client/pages/error/500', {
            title: 'Lỗi tìm kiếm'
        });
    }
}
