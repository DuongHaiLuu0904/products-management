#!/usr/bin/env node

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
config();

// Import database connection
import { connectRedis } from '../config/redis.js';
import cacheCleanup from '../helpers/cacheCleanup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
    try {
        // Connect to Redis
        await connectRedis();
        console.log('✅ Connected to Redis');
        
        const args = process.argv.slice(2);
        const command = args[0] || 'expired';
        
        console.log(`🧹 Starting cache cleanup: ${command}`);
        
        let result;
        
        switch (command) {
            case 'expired':
                result = await cacheCleanup.cleanupExpiredCache();
                break;
                
            case 'old':
                const hours = parseInt(args[1]) || 24;
                result = await cacheCleanup.cleanupOldCache(hours);
                break;
                
            case 'orphaned':
                result = await cacheCleanup.cleanupOrphanedCache();
                break;
                
            case 'pattern':
                const patterns = args.slice(1);
                if (patterns.length === 0) {
                    console.error('❌ Please provide patterns to clean');
                    process.exit(1);
                }
                result = await cacheCleanup.cleanupCacheByPattern(patterns);
                break;
                
            case 'type':
                const type = args[1];
                if (!type) {
                    console.error('❌ Please provide cache type to clean');
                    console.log('Available types: products, categories, searches, comments, carts, sessions, rateLimit, blacklist, dashboard, all');
                    process.exit(1);
                }
                result = await cacheCleanup.cleanupCacheByType(type);
                break;
                
            case 'comprehensive':
                const options = {
                    maxAgeHours: parseInt(args[1]) || 24,
                    cleanOrphaned: true,
                    cleanExpired: true
                };
                result = await cacheCleanup.comprehensiveCleanup(options);
                break;
                
            case 'stats':
                const stats = await cacheCleanup.getCacheMemoryInfo();
                console.log('📊 Cache Statistics:');
                console.log(JSON.stringify(stats, null, 2));
                process.exit(0);
                break;
                
            case 'all':
                console.log('⚠️  This will delete ALL cache keys!');
                result = await cacheCleanup.cleanupCacheByType('all');
                break;
                
            default:
                console.log('Available commands:');
                console.log('  expired                    - Clean expired cache keys');
                console.log('  old [hours]               - Clean cache older than X hours (default: 24)');
                console.log('  orphaned                  - Clean orphaned cache keys');
                console.log('  pattern <pattern1> <pattern2> - Clean cache by patterns');
                console.log('  type <type>               - Clean cache by type');
                console.log('  comprehensive [hours]     - Comprehensive cleanup (default: 24 hours)');
                console.log('  stats                     - Show cache statistics');
                console.log('  all                       - Clean ALL cache (dangerous!)');
                process.exit(1);
        }
        
        if (result.success) {
            console.log(`✅ Cache cleanup completed successfully`);
            console.log(`📊 Cleaned keys: ${result.cleanedKeys || result.totalCleaned || 0}`);
            
            if (result.details) {
                console.log('📋 Details:');
                console.log(JSON.stringify(result.details, null, 2));
            }
        } else {
            console.error(`❌ Cache cleanup failed: ${result.error}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Error during cache cleanup:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the script
main();
