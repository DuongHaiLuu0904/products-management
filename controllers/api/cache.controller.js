import cacheCleanup from '../../helpers/cacheCleanup.js';

// [POST] /api/cache/cleanup
export const cleanup = async (req, res) => {
    try {
        const { type = 'expired' } = req.body;
        
        let result;
        
        switch (type) {
            case 'expired':
                result = await cacheCleanup.cleanupExpiredCache();
                break;
            case 'old':
                result = await cacheCleanup.cleanupOldCache(24);
                break;
            case 'orphaned':
                result = await cacheCleanup.cleanupOrphanedCache();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid cleanup type'
                });
        }
        
        res.json(result);
    } catch (error) {
        console.error('API cache cleanup error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// [GET] /api/cache/stats
export const stats = async (req, res) => {
    try {
        const cacheStats = await cacheCleanup.getCacheMemoryInfo();
        res.json({
            success: true,
            data: cacheStats
        });
    } catch (error) {
        console.error('API cache stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
