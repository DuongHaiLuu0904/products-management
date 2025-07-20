import cacheHelper from '../../helpers/cache.js';

// Middleware để cache dashboard data
export const cacheDashboardData = (ttl = 300) => { // 5 minutes
    return async (req, res, next) => {
        try {
            const cacheKey = `dashboard:${req.user?.id || 'guest'}`;
            
            const cachedData = await cacheHelper.redis.get(cacheKey);
            
            if (cachedData) {
                console.log('📊 Dashboard cache hit');
                req.cachedDashboard = JSON.parse(cachedData);
            }
            
            // Override res.json để cache dashboard data
            const originalJson = res.json;
            
            res.json = function(data) {
                if (res.statusCode === 200 && data) {
                    cacheHelper.redis.setex(cacheKey, ttl, JSON.stringify(data))
                        .catch(err => console.error('Dashboard cache error:', err));
                    console.log('💾 Dashboard data cached');
                }
                
                originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('Dashboard cache middleware error:', error);
            next();
        }
    };
};

// Middleware để invalidate admin cache
export const invalidateAdminCache = (patterns) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        const originalJson = res.json;
        
        const invalidatePatterns = async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    for (const pattern of patterns) {
                        await cacheHelper.clearCacheByPattern(pattern);
                        console.log(`🗑️ Admin cache invalidated: ${pattern}`);
                    }
                } catch (error) {
                    console.error('Admin cache invalidation error:', error);
                }
            }
        };
        
        res.send = async function(body) {
            await invalidatePatterns();
            originalSend.call(this, body);
        };
        
        res.json = async function(data) {
            await invalidatePatterns();
            originalJson.call(this, data);
        };
        
        next();
    };
};

// Middleware để cache admin session với quyền hạn
export const cacheAdminSession = async (req, res, next) => {
    try {
        if (req.user && req.user.id) {
            const cacheKey = `admin_session:${req.user.id}`;
            
            const sessionData = {
                userId: req.user.id,
                email: req.user.email,
                fullName: req.user.fullName,
                avatar: req.user.avatar,
                role_id: req.user.role_id,
                permissions: req.user.role?.permissions || [],
                lastActivity: new Date(),
                isAdmin: true
            };
            
            await cacheHelper.cacheUserSession(`admin_${req.user.id}`, sessionData, 7200); // 2 hours
            console.log(`👨‍💼 Admin session cached: ${req.user.id}`);
        }
        
        next();
    } catch (error) {
        console.error('Admin session cache error:', error);
        next();
    }
};

// Middleware để rate limit cho admin actions
export const adminRateLimit = (max = 1000, windowMs = 15 * 60 * 1000) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return next();
            }
            
            const key = `admin_rate:${req.user.id}`;
            const windowSeconds = Math.floor(windowMs / 1000);
            
            const isAllowed = await cacheHelper.setRateLimit(key, max, windowSeconds);
            
            if (!isAllowed) {
                return res.status(429).json({
                    code: 429,
                    message: 'Too many admin requests, please try again later.'
                });
            }
            
            next();
        } catch (error) {
            console.error('Admin rate limit error:', error);
            next();
        }
    };
};

// Middleware để cache product statistics
export const cacheProductStats = (ttl = 600) => { // 10 minutes
    return async (req, res, next) => {
        try {
            const cacheKey = 'admin:product_stats';
            
            const cachedStats = await cacheHelper.redis.get(cacheKey);
            
            if (cachedStats) {
                console.log('📈 Product stats cache hit');
                req.cachedProductStats = JSON.parse(cachedStats);
            }
            
            // Middleware để cache response
            const originalJson = res.json;
            
            res.json = function(data) {
                if (res.statusCode === 200 && data && data.stats) {
                    cacheHelper.redis.setex(cacheKey, ttl, JSON.stringify(data.stats))
                        .catch(err => console.error('Product stats cache error:', err));
                    console.log('💾 Product stats cached');
                }
                
                originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('Product stats cache middleware error:', error);
            next();
        }
    };
};

// Middleware để log admin activities
export const logAdminActivity = async (req, res, next) => {
    try {
        if (req.user && req.user.id) {
            const activity = {
                userId: req.user.id,
                action: `${req.method} ${req.originalUrl}`,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                timestamp: new Date()
            };
            
            await cacheHelper.addRecentActivity(`admin_${req.user.id}`, activity, 50);
        }
        
        next();
    } catch (error) {
        console.error('Admin activity log error:', error);
        next();
    }
};

export default {
    cacheDashboardData,
    invalidateAdminCache,
    cacheAdminSession,
    adminRateLimit,
    cacheProductStats,
    logAdminActivity
};
