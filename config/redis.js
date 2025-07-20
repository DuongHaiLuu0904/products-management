import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class RedisConfig {
    constructor() {
        this.redis = null;
        this.isConnected = false;
    }

    // Kết nối Redis với cấu hình TLS cho Upstash
    connect() {
        try {
            this.redis = new Redis({
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD,
                tls: {
                    rejectUnauthorized: false
                },
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000,
                family: 4, // IPv4
            });

            // Event listeners
            this.redis.on('connect', () => {
                this.isConnected = true;
            });

            this.redis.on('ready', () => {
                console.log('Redis is ready');
            });

            this.redis.on('error', (err) => {
                console.error('Redis connection error:', err);
                this.isConnected = false;
            });

            this.redis.on('close', () => {
                this.isConnected = false;
            });

            this.redis.on('reconnecting', () => {
                console.log('Redis is reconnecting');
            });

            return this.redis;
        } catch (error) {
            console.error('Error creating Redis connection:', error);
            throw error;
        }
    }

    // Lấy instance Redis
    getInstance() {
        if (!this.redis) {
            this.connect();
        }
        return this.redis;
    }

    // Kiểm tra kết nối
    async ping() {
        try {
            const result = await this.redis.ping();
            return result === 'PONG';
        } catch (error) {
            console.error('Redis ping error:', error);
            return false;
        }
    }

    // Cache methods
    async set(key, value, ttl = 3600) {
        try {
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            
            if (ttl) {
                return await this.redis.setex(key, ttl, value);
            } else {
                return await this.redis.set(key, value);
            }
        } catch (error) {
            console.error('Redis set error:', error);
            throw error;
        }
    }

    async get(key) {
        try {
            const value = await this.redis.get(key);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error('Redis get error:', error);
            throw error;
        }
    }

    async del(key) {
        try {
            return await this.redis.del(key);
        } catch (error) {
            console.error('Redis del error:', error);
            throw error;
        }
    }

    async exists(key) {
        try {
            return await this.redis.exists(key);
        } catch (error) {
            console.error('Redis exists error:', error);
            throw error;
        }
    }

    async expire(key, ttl) {
        try {
            return await this.redis.expire(key, ttl);
        } catch (error) {
            console.error('Redis expire error:', error);
            throw error;
        }
    }

    // Hash methods
    async hset(key, field, value) {
        try {
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            return await this.redis.hset(key, field, value);
        } catch (error) {
            console.error('Redis hset error:', error);
            throw error;
        }
    }

    async hget(key, field) {
        try {
            const value = await this.redis.hget(key, field);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.error('Redis hget error:', error);
            throw error;
        }
    }

    async hgetall(key) {
        try {
            const hash = await this.redis.hgetall(key);
            const result = {};
            
            for (const [field, value] of Object.entries(hash)) {
                try {
                    result[field] = JSON.parse(value);
                } catch {
                    result[field] = value;
                }
            }
            
            return result;
        } catch (error) {
            console.error('Redis hgetall error:', error);
            throw error;
        }
    }

    async hdel(key, field) {
        try {
            return await this.redis.hdel(key, field);
        } catch (error) {
            console.error('Redis hdel error:', error);
            throw error;
        }
    }

    // List methods
    async lpush(key, ...values) {
        try {
            const serializedValues = values.map(v => 
                typeof v === 'object' ? JSON.stringify(v) : v
            );
            return await this.redis.lpush(key, ...serializedValues);
        } catch (error) {
            console.error('Redis lpush error:', error);
            throw error;
        }
    }

    async rpush(key, ...values) {
        try {
            const serializedValues = values.map(v => 
                typeof v === 'object' ? JSON.stringify(v) : v
            );
            return await this.redis.rpush(key, ...serializedValues);
        } catch (error) {
            console.error('Redis rpush error:', error);
            throw error;
        }
    }

    async lrange(key, start = 0, stop = -1) {
        try {
            const values = await this.redis.lrange(key, start, stop);
            return values.map(value => {
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            });
        } catch (error) {
            console.error('Redis lrange error:', error);
            throw error;
        }
    }

    // Set methods
    async sadd(key, ...members) {
        try {
            const serializedMembers = members.map(m => 
                typeof m === 'object' ? JSON.stringify(m) : m
            );
            return await this.redis.sadd(key, ...serializedMembers);
        } catch (error) {
            console.error('Redis sadd error:', error);
            throw error;
        }
    }

    async smembers(key) {
        try {
            const members = await this.redis.smembers(key);
            return members.map(member => {
                try {
                    return JSON.parse(member);
                } catch {
                    return member;
                }
            });
        } catch (error) {
            console.error('Redis smembers error:', error);
            throw error;
        }
    }

    // Utility methods
    async flushall() {
        try {
            return await this.redis.flushall();
        } catch (error) {
            console.error('Redis flushall error:', error);
            throw error;
        }
    }

    async keys(pattern = '*') {
        try {
            return await this.redis.keys(pattern);
        } catch (error) {
            console.error('Redis keys error:', error);
            throw error;
        }
    }

    // Đóng kết nối
    async disconnect() {
        try {
            if (this.redis) {
                await this.redis.quit();
                this.isConnected = false;
            }
        } catch (error) {
            console.error('Error disconnecting Redis:', error);
        }
    }
}

export const redisConfig = new RedisConfig();

export async function connectRedis() {
    try {
        redisConfig.connect(); 
        return true;
    } catch (error) {
        console.error('Error connecting to Redis:', error);
        throw error;
    }
}