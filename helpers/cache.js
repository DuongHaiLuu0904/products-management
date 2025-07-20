import { redisConfig } from '../config/redis.js';

class CacheHelper {
    constructor() {
        this.redis = redisConfig.getInstance();
        this.defaultTTL = 3600; // 1 hour
    }

    // Cache cho products
    async cacheProduct(productId, productData, ttl = this.defaultTTL) {
        try {
            const key = `product:${productId}`;
            
            // Đảm bảo data có structure đúng trước khi cache
            if (productData && typeof productData === 'object') {
                // Kiểm tra và fix các field quan trọng
                const sanitizedData = {
                    ...productData,
                    price: productData.price || 0,
                    discountPercentage: productData.discountPercentage || 0,
                    stock: productData.stock || 0
                };
                
                return await redisConfig.set(key, sanitizedData, ttl);
            }
            
            return await redisConfig.set(key, productData, ttl);
        } catch (error) {
            console.error('Cache product error:', error);
            return false;
        }
    }

    async getCachedProduct(productId) {
        const key = `product:${productId}`;
        return await redisConfig.get(key);
    }

    async deleteCachedProduct(productId) {
        const key = `product:${productId}`;
        return await redisConfig.del(key);
    }

    // Cache cho product categories
    async cacheProductCategory(categoryId, categoryData, ttl = this.defaultTTL) {
        const key = `category:${categoryId}`;
        return await redisConfig.set(key, categoryData, ttl);
    }

    async getCachedProductCategory(categoryId) {
        const key = `category:${categoryId}`;
        return await redisConfig.get(key);
    }

    async deleteCachedProductCategory(categoryId) {
        const key = `category:${categoryId}`;
        return await redisConfig.del(key);
    }

    // Cache cho danh sách products
    async cacheProductList(filters, products, ttl = 1800) { // 30 minutes
        try {
            const key = `products:${JSON.stringify(filters)}`;
            
            // Sanitize products list
            if (Array.isArray(products)) {
                const sanitizedProducts = products.map(product => ({
                    ...product,
                    price: product.price || 0,
                    discountPercentage: product.discountPercentage || 0,
                    stock: product.stock || 0
                }));
                
                return await redisConfig.set(key, sanitizedProducts, ttl);
            }
            
            return await redisConfig.set(key, products, ttl);
        } catch (error) {
            console.error('Cache product list error:', error);
            return false;
        }
    }

    async getCachedProductList(filters) {
        const key = `products:${JSON.stringify(filters)}`;
        return await redisConfig.get(key);
    }

    // Cache cho user sessions
    async cacheUserSession(userId, sessionData, ttl = 86400) { // 24 hours
        const key = `session:${userId}`;
        return await redisConfig.set(key, sessionData, ttl);
    }

    async getCachedUserSession(userId) {
        const key = `session:${userId}`;
        return await redisConfig.get(key);
    }

    async deleteCachedUserSession(userId) {
        const key = `session:${userId}`;
        return await redisConfig.del(key);
    }

    // Cache cho cart data
    async cacheCart(cartId, cartData, ttl = 7200) { // 2 hours
        const key = `cart:${cartId}`;
        return await redisConfig.set(key, cartData, ttl);
    }

    async getCachedCart(cartId) {
        const key = `cart:${cartId}`;
        return await redisConfig.get(key);
    }

    async deleteCachedCart(cartId) {
        const key = `cart:${cartId}`;
        return await redisConfig.del(key);
    }

    // Cache cho search results
    async cacheSearchResults(searchQuery, results, ttl = 3600) {
        const key = `search:${searchQuery}`;
        return await redisConfig.set(key, results, ttl);
    }

    async getCachedSearchResults(searchQuery) {
        const key = `search:${searchQuery}`;
        return await redisConfig.get(key);
    }

    // Cache cho comments
    async cacheComments(productId, comments, ttl = 1800) {
        const key = `comments:${productId}`;
        return await redisConfig.set(key, comments, ttl);
    }

    async getCachedComments(productId) {
        const key = `comments:${productId}`;
        return await redisConfig.get(key);
    }

    async deleteCachedComments(productId) {
        const key = `comments:${productId}`;
        return await redisConfig.del(key);
    }

    // Rate limiting
    async setRateLimit(identifier, limit, windowSeconds = 3600) {
        const key = `ratelimit:${identifier}`;
        const current = await redisConfig.get(key) || 0;
        
        if (current >= limit) {
            return false; // Rate limit exceeded
        }
        
        await redisConfig.set(key, current + 1, windowSeconds);
        return true;
    }

    async getRateLimitCount(identifier) {
        const key = `ratelimit:${identifier}`;
        return await redisConfig.get(key) || 0;
    }

    // Token blacklist (for logout)
    async blacklistToken(token, ttl = 86400) {
        const key = `blacklist:${token}`;
        return await redisConfig.set(key, 'blacklisted', ttl);
    }

    async isTokenBlacklisted(token) {
        const key = `blacklist:${token}`;
        return await redisConfig.exists(key);
    }

    // Chat room management
    async addUserToRoom(roomId, userId) {
        const key = `room:${roomId}:users`;
        return await redisConfig.sadd(key, userId);
    }

    async removeUserFromRoom(roomId, userId) {
        const key = `room:${roomId}:users`;
        return await redisConfig.srem(key, userId);
    }

    async getRoomUsers(roomId) {
        const key = `room:${roomId}:users`;
        return await redisConfig.smembers(key);
    }

    // Recent activity tracking
    async addRecentActivity(userId, activity, maxItems = 10) {
        const key = `activity:${userId}`;
        await redisConfig.lpush(key, activity);
        await redisConfig.ltrim(key, 0, maxItems - 1);
        return await redisConfig.expire(key, 86400); // 24 hours
    }

    async getRecentActivity(userId, count = 10) {
        const key = `activity:${userId}`;
        return await redisConfig.lrange(key, 0, count - 1);
    }

    // Utility methods
    async clearAllCache() {
        return await redisConfig.flushall();
    }

    async clearCacheByPattern(pattern) {
        const keys = await redisConfig.keys(pattern);
        if (keys.length > 0) {
            return await redisConfig.del(...keys);
        }
        return 0;
    }

    async getCacheKeys(pattern = '*') {
        return await redisConfig.keys(pattern);
    }

    // Health check
    async healthCheck() {
        try {
            const ping = await redisConfig.ping();
            return {
                status: 'healthy',
                ping: ping,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export singleton instance
const cacheHelper = new CacheHelper();
export default cacheHelper;
