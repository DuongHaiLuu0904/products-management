import cacheCleanup from '../../helpers/cacheCleanup.js';
import CacheService from '../../services/cache.service.js';

// [GET] /admin/cache
export const index = async (req, res) => {
    try {
        let cacheStats = {
            totalKeys: 0,
            patterns: {
                products: 0,
                categories: 0,
                searches: 0,
                comments: 0,
                carts: 0,
                sessions: 0,
                rateLimit: 0,
                blacklist: 0,
                other: 0
            },
            health: { status: 'unknown' },
            timestamp: new Date().toISOString()
        };
        
        let memoryInfo = {
            totalKeys: 0,
            memoryInfo: 'Not available',
            timestamp: new Date().toISOString()
        };
        
        // Get cache statistics with error handling
        try {
            cacheStats = await CacheService.getCacheStats();
        } catch (error) {
            console.error('Error loading cache stats:', error);
            cacheStats.error = error.message;
        }
        
        // Get memory info with error handling
        try {
            memoryInfo = await cacheCleanup.getCacheMemoryInfo();
        } catch (error) {
            console.error('Error loading memory info:', error);
            memoryInfo.error = error.message;
        }
        
        // Render template
        res.render('admin/pages/cache/simple', {
            title: 'Quản lý Cache',
            cacheStats,
            memoryInfo
        });
        
        // Temporary JSON response (disabled)
        // res.json({
        //     success: true,
        //     title: 'Quản lý Cache',
        //     cacheStats,
        //     memoryInfo,
        //     message: 'Cache management data loaded successfully.'
        // });
    } catch (error) {
        console.error('Cache management page error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

// [POST] /admin/cache/cleanup
export const cleanup = async (req, res) => {
    try {
        const { type, options } = req.body;
        let result;

        switch (type) {
            case 'expired':
                result = await cacheCleanup.cleanupExpiredCache();
                break;
                
            case 'old':
                const maxAgeHours = parseInt(options?.maxAgeHours) || 24;
                result = await cacheCleanup.cleanupOldCache(maxAgeHours);
                break;
                
            case 'pattern':
                const patterns = options?.patterns ? options.patterns.split(',').map(p => p.trim()) : [];
                result = await cacheCleanup.cleanupCacheByPattern(patterns);
                break;
                
            case 'type':
                const cacheType = options?.cacheType || 'products';
                result = await cacheCleanup.cleanupCacheByType(cacheType);
                break;
                
            case 'orphaned':
                result = await cacheCleanup.cleanupOrphanedCache();
                break;
                
            case 'comprehensive':
                const comprehensiveOptions = {
                    maxAgeHours: parseInt(options?.maxAgeHours) || 24,
                    cleanOrphaned: options?.cleanOrphaned !== 'false',
                    cleanExpired: options?.cleanExpired !== 'false',
                    patterns: options?.patterns ? options.patterns.split(',').map(p => p.trim()) : []
                };
                result = await cacheCleanup.comprehensiveCleanup(comprehensiveOptions);
                break;
                
            case 'all':
                result = await CacheService.clearAllCache();
                result = {
                    success: true,
                    cleanedKeys: 'all',
                    message: 'Đã xóa toàn bộ cache'
                };
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Loại cleanup không hợp lệ'
                });
        }

        if (result.success) {
            req.flash('success', `Cache cleanup thành công: ${result.cleanedKeys} keys đã được xóa`);
        } else {
            req.flash('error', `Cache cleanup thất bại: ${result.error}`);
        }

        res.json({
            success: result.success,
            message: result.success ? `Đã xóa ${result.cleanedKeys} cache keys` : result.error,
            result
        });

    } catch (error) {
        console.error('Cache cleanup error:', error);
        req.flash('error', 'Có lỗi khi thực hiện cleanup cache');
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// [GET] /admin/cache/stats
export const stats = async (req, res) => {
    try {
        const cacheStats = await CacheService.getCacheStats();
        const memoryInfo = await cacheCleanup.getCacheMemoryInfo();
        
        res.json({
            success: true,
            data: {
                stats: cacheStats,
                memory: memoryInfo,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get cache stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thống kê cache',
            error: error.message
        });
    }
};

// [POST] /admin/cache/invalidate
export const invalidate = async (req, res) => {
    try {
        const { patterns } = req.body;
        
        if (!patterns || !Array.isArray(patterns)) {
            return res.status(400).json({
                success: false,
                message: 'Patterns phải là một array'
            });
        }

        let totalInvalidated = 0;
        const results = {};

        for (const pattern of patterns) {
            try {
                const count = await CacheService.clearCacheByPattern(pattern);
                results[pattern] = count;
                totalInvalidated += count;
            } catch (error) {
                results[pattern] = { error: error.message };
            }
        }

        req.flash('success', `Đã invalidate ${totalInvalidated} cache keys`);
        
        res.json({
            success: true,
            message: `Đã invalidate ${totalInvalidated} cache keys`,
            results,
            totalInvalidated
        });

    } catch (error) {
        console.error('Cache invalidate error:', error);
        req.flash('error', 'Có lỗi khi invalidate cache');
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// [POST] /admin/cache/refresh
export const refresh = async (req, res) => {
    try {
        const { type } = req.body;
        
        // Refresh cache for specific types
        switch (type) {
            case 'products':
                // Có thể implement logic refresh cache products
                await CacheService.clearCacheByPattern('product:*');
                await CacheService.clearCacheByPattern('products:*');
                break;
                
            case 'categories':
                await CacheService.clearCacheByPattern('category:*');
                await CacheService.clearCacheByPattern('category_products:*');
                break;
                
            case 'dashboard':
                await CacheService.clearCacheByPattern('dashboard:*');
                await CacheService.clearCacheByPattern('admin:*');
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Loại refresh không hợp lệ'
                });
        }

        req.flash('success', `Cache ${type} đã được refresh`);
        
        res.json({
            success: true,
            message: `Cache ${type} đã được refresh`
        });

    } catch (error) {
        console.error('Cache refresh error:', error);
        req.flash('error', 'Có lỗi khi refresh cache');
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
