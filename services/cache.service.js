import cacheHelper from '../helpers/cache.js';

class CacheService {
    // Product caching
    static async getProductWithCache(productId, fetchFunction) {
        try {
            // Kiểm tra cache trước
            let product = await cacheHelper.getCachedProduct(productId);
            
            if (product) {
                return product;
            }
            
            // Nếu không có cache, fetch từ database
            product = await fetchFunction();
            
            if (product) {
                // Cache product data trong 1 giờ
                await cacheHelper.cacheProduct(productId, product, 3600);
            }
            
            return product;
        } catch (error) {
            console.error('Product cache service error:', error);
            // Fallback to direct fetch
            return await fetchFunction();
        }
    }
    
    static async invalidateProductCache(productId) {
        try {
            await cacheHelper.deleteCachedProduct(productId);
            // Xóa các cache liên quan
            await cacheHelper.clearCacheByPattern(`products:*`);
            await cacheHelper.clearCacheByPattern(`search:*`);
            await cacheHelper.clearCacheByPattern(`comments:${productId}`);
        } catch (error) {
            console.error('Product cache invalidation error:', error);
        }
    }
    
    // Category caching
    static async getCategoryWithCache(categoryId, fetchFunction) {
        try {
            let category = await cacheHelper.getCachedProductCategory(categoryId);
            
            if (category) {
                return category;
            }
            
            category = await fetchFunction();
            
            if (category) {
                await cacheHelper.cacheProductCategory(categoryId, category, 7200); // 2 hours
            }
            
            return category;
        } catch (error) {
            console.error('Category cache service error:', error);
            return await fetchFunction();
        }
    }
    
    static async invalidateCategoryCache(categoryId) {
        try {
            await cacheHelper.deleteCachedProductCategory(categoryId);
            await cacheHelper.clearCacheByPattern(`products:*`);
        } catch (error) {
            console.error('Category cache invalidation error:', error);
        }
    }
    
    // Product list caching
    static async getProductListWithCache(filters, fetchFunction) {
        try {
            const cacheKey = JSON.stringify(filters);
            let products = await cacheHelper.getCachedProductList(filters);
            
            if (products) {
                return products;
            }
            
            products = await fetchFunction();
            
            if (products) {
                await cacheHelper.cacheProductList(filters, products, 1800); // 30 minutes
            }
            
            return products;
        } catch (error) {
            console.error('Product list cache service error:', error);
            return await fetchFunction();
        }
    }
    
    // Search caching
    static async getSearchResultsWithCache(searchQuery, fetchFunction) {
        try {
            let results = await cacheHelper.getCachedSearchResults(searchQuery);
            
            if (results) {
                return results;
            }
            
            results = await fetchFunction();
            
            if (results) {
                await cacheHelper.cacheSearchResults(searchQuery, results, 3600); // 1 hour
            }
            
            return results;
        } catch (error) {
            console.error('Search cache service error:', error);
            return await fetchFunction();
        }
    }
    
    // Comment caching
    static async getCommentsWithCache(productId, fetchFunction) {
        try {
            let comments = await cacheHelper.getCachedComments(productId);
            
            if (comments) {
                return comments;
            }
            
            comments = await fetchFunction();
            
            if (comments) {
                await cacheHelper.cacheComments(productId, comments, 1800); // 30 minutes
            }
            
            return comments;
        } catch (error) {
            console.error('Comments cache service error:', error);
            return await fetchFunction();
        }
    }
    
    static async invalidateCommentsCache(productId) {
        try {
            await cacheHelper.deleteCachedComments(productId);
        } catch (error) {
            console.error('Comments cache invalidation error:', error);
        }
    }
    
    // Cart caching
    static async getCartWithCache(cartId, fetchFunction) {
        try {
            let cart = await cacheHelper.getCachedCart(cartId);
            
            if (cart) {
                return cart;
            }
            
            cart = await fetchFunction();
            
            if (cart) {
                await cacheHelper.cacheCart(cartId, cart, 7200); // 2 hours
            }
            
            return cart;
        } catch (error) {
            console.error('Cart cache service error:', error);
            return await fetchFunction();
        }
    }
    
    static async invalidateCartCache(cartId) {
        try {
            await cacheHelper.deleteCachedCart(cartId);
        } catch (error) {
            console.error('Cart cache invalidation error:', error);
        }
    }
    
    // User session management
    static async getUserSession(userId) {
        try {
            return await cacheHelper.getCachedUserSession(userId);
        } catch (error) {
            console.error('Get user session error:', error);
            return null;
        }
    }
    
    static async setUserSession(userId, sessionData, ttl = 86400) {
        try {
            await cacheHelper.cacheUserSession(userId, sessionData, ttl);
        } catch (error) {
            console.error('Set user session error:', error);
        }
    }
    
    static async deleteUserSession(userId) {
        try {
            await cacheHelper.deleteCachedUserSession(userId);
        } catch (error) {
            console.error('Delete user session error:', error);
        }
    }
    
    // Token blacklist management
    static async blacklistToken(token, ttl = 86400) {
        try {
            await cacheHelper.blacklistToken(token, ttl);
        } catch (error) {
            console.error('Token blacklist error:', error);
        }
    }
    
    static async isTokenBlacklisted(token) {
        try {
            return await cacheHelper.isTokenBlacklisted(token);
        } catch (error) {
            console.error('Token blacklist check error:', error);
            return false;
        }
    }
    
    // Activity tracking
    static async logUserActivity(userId, activity) {
        try {
            await cacheHelper.addRecentActivity(userId, activity);
        } catch (error) {
            console.error('User activity log error:', error);
        }
    }
    
    static async getUserActivity(userId, count = 10) {
        try {
            return await cacheHelper.getRecentActivity(userId, count);
        } catch (error) {
            console.error('Get user activity error:', error);
            return [];
        }
    }
    
    // Cache management
    static async clearAllCache() {
        try {
            await cacheHelper.clearAllCache();
        } catch (error) {
            console.error('Clear all cache error:', error);
        }
    }
    
    static async clearCacheByPattern(pattern) {
        try {
            const count = await cacheHelper.clearCacheByPattern(pattern);
            return count;
        } catch (error) {
            console.error('Clear cache by pattern error:', error);
            return 0;
        }
    }
    
    static async getCacheStats() {
        try {
            const keys = await cacheHelper.getCacheKeys();
            const health = await cacheHelper.healthCheck();
            
            // Phân loại keys theo pattern
            const patterns = {
                products: keys.filter(key => key.startsWith('product:')).length,
                categories: keys.filter(key => key.startsWith('category:')).length,
                searches: keys.filter(key => key.startsWith('search:')).length,
                comments: keys.filter(key => key.startsWith('comments:')).length,
                carts: keys.filter(key => key.startsWith('cart:')).length,
                sessions: keys.filter(key => key.startsWith('session:')).length,
                rateLimit: keys.filter(key => key.startsWith('ratelimit:')).length,
                blacklist: keys.filter(key => key.startsWith('blacklist:')).length,
                other: keys.filter(key => !key.includes(':')).length
            };
            
            return {
                totalKeys: keys.length,
                patterns,
                health,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get cache stats error:', error);
            return {
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

export default CacheService;
