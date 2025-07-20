import cacheHelper from '../../helpers/cache.js';

// Middleware để cache response
export const cacheResponse = (ttl = 3600) => {
    return async (req, res, next) => {
        try {
            // Tạo cache key từ URL và query parameters
            const cacheKey = `response:${req.method}:${req.originalUrl}`;
            
            // Kiểm tra cache
            const cachedResponse = await cacheHelper.redis.get(cacheKey);
            
            if (cachedResponse) {
                console.log(`📦 Cache hit for: ${req.originalUrl}`);
                const parsed = JSON.parse(cachedResponse);
                
                // Set headers nếu có
                if (parsed.headers) {
                    Object.keys(parsed.headers).forEach(key => {
                        res.set(key, parsed.headers[key]);
                    });
                }
                
                return res.status(parsed.statusCode || 200).send(parsed.body);
            }
            
            // Override res.send để cache response
            const originalSend = res.send;
            
            res.send = function(body) {
                // Cache response nếu status code thành công
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const responseData = {
                        statusCode: res.statusCode,
                        headers: res.getHeaders(),
                        body: body
                    };
                    
                    cacheHelper.redis.setex(cacheKey, ttl, JSON.stringify(responseData))
                        .catch(err => console.error('Cache save error:', err));
                        
                    console.log(`💾 Response cached for: ${req.originalUrl}`);
                }
                
                originalSend.call(this, body);
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next(); // Tiếp tục xử lý ngay cả khi cache lỗi
        }
    };
};

// Middleware để invalidate cache
export const invalidateCache = (patterns) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = async function(body) {
            // Chỉ invalidate cache khi response thành công
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    for (const pattern of patterns) {
                        await cacheHelper.clearCacheByPattern(pattern);
                        console.log(`🗑️ Cache invalidated for pattern: ${pattern}`);
                    }
                } catch (error) {
                    console.error('Cache invalidation error:', error);
                }
            }
            
            originalSend.call(this, body);
        };
        
        next();
    };
};

// Middleware để rate limiting
export const rateLimit = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100, // limit each IP to 100 requests per windowMs
        message = 'Too many requests from this IP, please try again later.',
        keyGenerator = (req) => req.ip
    } = options;
    
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);
            const windowSeconds = Math.floor(windowMs / 1000);
            
            const isAllowed = await cacheHelper.setRateLimit(key, max, windowSeconds);
            
            if (!isAllowed) {
                return res.status(429).json({
                    error: message,
                    retryAfter: windowSeconds
                });
            }
            
            const current = await cacheHelper.getRateLimitCount(key);
            
            // Set headers
            res.set({
                'X-RateLimit-Limit': max,
                'X-RateLimit-Remaining': Math.max(0, max - current),
                'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
            });
            
            next();
        } catch (error) {
            console.error('Rate limit middleware error:', error);
            next(); // Cho phép request đi qua nếu rate limiting lỗi
        }
    };
};

// Middleware để cache user session
export const cacheUserSession = async (req, res, next) => {
    try {
        if (req.user && req.user.id) {
            const cachedSession = await cacheHelper.getCachedUserSession(req.user.id);
            
            if (!cachedSession) {
                // Cache user session data
                const sessionData = {
                    userId: req.user.id,
                    email: req.user.email,
                    fullName: req.user.fullName,
                    avatar: req.user.avatar,
                    role_id: req.user.role_id,
                    lastActivity: new Date()
                };
                
                await cacheHelper.cacheUserSession(req.user.id, sessionData);
                console.log(`👤 User session cached: ${req.user.id}`);
            } else {
                // Update last activity
                cachedSession.lastActivity = new Date();
                await cacheHelper.cacheUserSession(req.user.id, cachedSession);
            }
        }
        
        next();
    } catch (error) {
        console.error('Cache user session error:', error);
        next();
    }
};

// Middleware để check token blacklist
export const checkTokenBlacklist = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.cookies.token;
        
        if (token) {
            const isBlacklisted = await cacheHelper.isTokenBlacklisted(token);
            
            if (isBlacklisted) {
                return res.status(401).json({
                    code: 401,
                    message: 'Token has been invalidated'
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('Token blacklist check error:', error);
        next();
    }
};

export default {
    cacheResponse,
    invalidateCache,
    rateLimit,
    cacheUserSession,
    checkTokenBlacklist
};
