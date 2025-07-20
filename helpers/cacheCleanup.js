import { redisConfig } from '../config/redis.js';
import cacheHelper from './cache.js';

/**
 * Helper để cleanup cache cũ và không cần thiết
 */
class CacheCleanup {
    constructor() {
        this.redis = redisConfig.getInstance();
    }

    /**
     * Xóa cache cũ dựa trên TTL và pattern
     */
    async cleanupExpiredCache() {
        try {
            console.log('🧹 Starting cache cleanup...');
            
            const allKeys = await this.redis.keys('*');
            let expiredCount = 0;
            let cleanedCount = 0;

            for (const key of allKeys) {
                try {
                    const ttl = await this.redis.ttl(key);
                    
                    // TTL = -1 nghĩa là key không có expiration
                    // TTL = -2 nghĩa là key đã expired hoặc không tồn tại
                    if (ttl === -2) {
                        await this.redis.del(key);
                        expiredCount++;
                    }
                } catch (error) {
                    console.error(`Error checking TTL for key ${key}:`, error);
                }
            }

            cleanedCount = expiredCount;
            
            console.log(`✅ Cache cleanup completed: ${cleanedCount} expired keys removed`);
            return {
                success: true,
                cleanedKeys: cleanedCount,
                totalKeys: allKeys.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Cache cleanup error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Xóa cache cũ dựa trên thời gian (keys cũ hơn maxAge)
     */
    async cleanupOldCache(maxAgeHours = 24) {
        try {
            console.log(`🧹 Cleaning cache older than ${maxAgeHours} hours...`);
            
            const maxAgeSeconds = maxAgeHours * 3600;
            const allKeys = await this.redis.keys('*');
            let cleanedCount = 0;

            for (const key of allKeys) {
                try {
                    const ttl = await this.redis.ttl(key);
                    
                    // Nếu key có TTL và sắp hết hạn trong vòng 1 giờ
                    if (ttl > 0 && ttl < 3600) {
                        await this.redis.del(key);
                        cleanedCount++;
                    }
                } catch (error) {
                    console.error(`Error processing key ${key}:`, error);
                }
            }

            console.log(`✅ Old cache cleanup completed: ${cleanedCount} old keys removed`);
            return {
                success: true,
                cleanedKeys: cleanedCount,
                maxAgeHours,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Old cache cleanup error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Xóa cache theo pattern cụ thể
     */
    async cleanupCacheByPattern(patterns = []) {
        try {
            console.log(`🧹 Cleaning cache by patterns: ${patterns.join(', ')}`);
            
            let totalCleaned = 0;
            const results = {};

            for (const pattern of patterns) {
                try {
                    const keys = await this.redis.keys(pattern);
                    if (keys.length > 0) {
                        await this.redis.del(...keys);
                        results[pattern] = keys.length;
                        totalCleaned += keys.length;
                    } else {
                        results[pattern] = 0;
                    }
                } catch (error) {
                    console.error(`Error cleaning pattern ${pattern}:`, error);
                    results[pattern] = -1;
                }
            }

            console.log(`✅ Pattern cleanup completed: ${totalCleaned} keys removed`);
            return {
                success: true,
                cleanedKeys: totalCleaned,
                results,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Pattern cleanup error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Xóa cache theo loại cụ thể
     */
    async cleanupCacheByType(type) {
        const patterns = {
            products: ['product:*', 'products:*', 'product_detail:*'],
            categories: ['category:*', 'category_products:*', 'subcategories:*'],
            searches: ['search:*'],
            comments: ['comments:*', 'rating:*', 'rating_dist:*'],
            carts: ['cart:*'],
            sessions: ['session:*', 'admin_session:*'],
            rateLimit: ['ratelimit:*', 'admin_rate:*'],
            blacklist: ['blacklist:*'],
            dashboard: ['dashboard:*', 'admin:*'],
            all: ['*']
        };

        if (!patterns[type]) {
            throw new Error(`Unknown cache type: ${type}`);
        }

        return await this.cleanupCacheByPattern(patterns[type]);
    }

    /**
     * Cleanup cache không sử dụng (orphaned cache)
     */
    async cleanupOrphanedCache() {
        try {
            console.log('🧹 Cleaning orphaned cache...');
            
            const allKeys = await this.redis.keys('*');
            let orphanedCount = 0;
            
            // Các pattern cache có thể bị orphaned
            const orphanedPatterns = [
                /^product:\w+$/, // Products không tồn tại
                /^category:\w+$/, // Categories không tồn tại
                /^session:\w+$/, // User sessions cũ
                /^cart:\w+$/, // Carts abandoned
                /^ratelimit:.*/, // Rate limit cũ
                /^response:.*/ // Response cache cũ
            ];

            for (const key of allKeys) {
                try {
                    // Kiểm tra TTL
                    const ttl = await this.redis.ttl(key);
                    
                    // Xóa keys không có TTL hoặc TTL quá lâu (> 7 ngày)
                    if (ttl === -1 || ttl > 7 * 24 * 3600) {
                        const shouldDelete = orphanedPatterns.some(pattern => pattern.test(key));
                        
                        if (shouldDelete) {
                            await this.redis.del(key);
                            orphanedCount++;
                        }
                    }
                } catch (error) {
                    console.error(`Error processing orphaned key ${key}:`, error);
                }
            }

            console.log(`✅ Orphaned cache cleanup completed: ${orphanedCount} keys removed`);
            return {
                success: true,
                cleanedKeys: orphanedCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Orphaned cache cleanup error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Comprehensive cache cleanup
     */
    async comprehensiveCleanup(options = {}) {
        const {
            maxAgeHours = 24,
            cleanOrphaned = true,
            cleanExpired = true,
            patterns = []
        } = options;

        try {
            console.log('🧹 Starting comprehensive cache cleanup...');
            
            const results = {
                expired: null,
                old: null,
                orphaned: null,
                patterns: null,
                timestamp: new Date().toISOString()
            };

            // Cleanup expired cache
            if (cleanExpired) {
                results.expired = await this.cleanupExpiredCache();
            }

            // Cleanup old cache
            if (maxAgeHours > 0) {
                results.old = await this.cleanupOldCache(maxAgeHours);
            }

            // Cleanup orphaned cache
            if (cleanOrphaned) {
                results.orphaned = await this.cleanupOrphanedCache();
            }

            // Cleanup by patterns
            if (patterns.length > 0) {
                results.patterns = await this.cleanupCacheByPattern(patterns);
            }

            const totalCleaned = [
                results.expired?.cleanedKeys || 0,
                results.old?.cleanedKeys || 0,
                results.orphaned?.cleanedKeys || 0,
                results.patterns?.cleanedKeys || 0
            ].reduce((a, b) => a + b, 0);

            console.log(`✅ Comprehensive cleanup completed: ${totalCleaned} total keys removed`);
            
            return {
                success: true,
                totalCleaned,
                details: results
            };
        } catch (error) {
            console.error('❌ Comprehensive cleanup error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get cache memory usage info
     */
    async getCacheMemoryInfo() {
        try {
            // Kiểm tra kết nối Redis trước
            if (!this.redis) {
                throw new Error('Redis connection not available');
            }
            
            // Test connection
            await this.redis.ping();
            
            const keys = await this.redis.keys('*');
            
            // Thử lấy memory info, nếu không được thì bỏ qua
            let memoryInfo = null;
            try {
                memoryInfo = await this.redis.info('memory');
            } catch (infoError) {
                console.warn('Could not get Redis memory info:', infoError.message);
                memoryInfo = 'Memory info not available';
            }
            
            return {
                totalKeys: keys.length,
                memoryInfo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get cache memory info error:', error);
            return {
                error: error.message,
                totalKeys: 0,
                memoryInfo: null,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export singleton instance
const cacheCleanup = new CacheCleanup();
export default cacheCleanup;

// Export class for dependency injection
export { CacheCleanup };
