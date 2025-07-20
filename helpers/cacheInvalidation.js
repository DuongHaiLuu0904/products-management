import CacheService from '../services/cache.service.js';

class CacheInvalidation {
    // Invalidate khi product thay đổi
    static async invalidateProductCaches(productId, productSlug = null) {
        try {
            // Xóa cache của product cụ thể
            await CacheService.invalidateProductCache(productId);
            
            if (productSlug) {
                await CacheService.clearCacheByPattern(`product_detail:${productSlug}`);
            }
            
            // Xóa cache liên quan
            await CacheService.clearCacheByPattern('products_list:*');
            await CacheService.clearCacheByPattern('category_products:*');
            await CacheService.clearCacheByPattern('search:*');
            await CacheService.clearCacheByPattern('homepage_featured_products');
            await CacheService.clearCacheByPattern('all_active_products');
            await CacheService.clearCacheByPattern(`rating:${productId}`);
            await CacheService.clearCacheByPattern(`rating_dist:${productId}`);
            
        } catch (error) {
            console.error('❌ Error invalidating product caches:', error);
        }
    }
    
    // Invalidate khi category thay đổi
    static async invalidateCategoryCaches(categoryId, categorySlug = null) {
        try {
            // Xóa cache của category cụ thể
            await CacheService.invalidateCategoryCache(categoryId);
            
            if (categorySlug) {
                await CacheService.clearCacheByPattern(`category_slug:${categorySlug}`);
            }
            
            // Xóa cache liên quan
            await CacheService.clearCacheByPattern('category_products:*');
            await CacheService.clearCacheByPattern('products_list:*');
            await CacheService.clearCacheByPattern(`subcategories:${categoryId}`);
            await CacheService.clearCacheByPattern('subcategories:*');
            
        } catch (error) {
            console.error('❌ Error invalidating category caches:', error);
        }
    }
    
    // Invalidate khi comment thay đổi
    static async invalidateCommentCaches(productId) {
        try {
            await CacheService.invalidateCommentsCache(productId);
            await CacheService.clearCacheByPattern(`rating:${productId}`);
            await CacheService.clearCacheByPattern(`rating_dist:${productId}`);
            
        } catch (error) {
            console.error('❌ Error invalidating comment caches:', error);
        }
    }
    
    // Invalidate khi user thay đổi
    static async invalidateUserCaches(userId) {
        try {
            await CacheService.deleteUserSession(userId);
            await CacheService.clearCacheByPattern(`admin_session:${userId}`);
            await CacheService.clearCacheByPattern(`activity:${userId}`);
            await CacheService.clearCacheByPattern(`admin_activity:${userId}`);
            
        } catch (error) {
            console.error('❌ Error invalidating user caches:', error);
        }
    }
    
    // Invalidate khi cart thay đổi
    static async invalidateCartCaches(cartId) {
        try {
            await CacheService.invalidateCartCache(cartId);
            
        } catch (error) {
            console.error('❌ Error invalidating cart caches:', error);
        }
    }
    
    // Invalidate toàn bộ cache (dùng khi cần thiết)
    static async invalidateAllCaches() {
        try {
            await CacheService.clearAllCache();
            
        } catch (error) {
            console.error('❌ Error clearing all caches:', error);
        }
    }
    
    // Invalidate cache theo pattern cụ thể
    static async invalidateByPattern(pattern) {
        try {
            const count = await CacheService.clearCacheByPattern(pattern);
            
            return count;
        } catch (error) {
            console.error('❌ Error invalidating caches by pattern:', error);
            return 0;
        }
    }
    
    // Invalidate khi admin thực hiện thay đổi hàng loạt
    static async invalidateAdminBulkChanges() {
        try {
            // Xóa cache products và categories
            await CacheService.clearCacheByPattern('products_list:*');
            await CacheService.clearCacheByPattern('category_products:*');
            await CacheService.clearCacheByPattern('product_detail:*');
            await CacheService.clearCacheByPattern('category_slug:*');
            await CacheService.clearCacheByPattern('subcategories:*');
            await CacheService.clearCacheByPattern('search:*');
            await CacheService.clearCacheByPattern('homepage_featured_products');
            await CacheService.clearCacheByPattern('all_active_products');
            
            // Xóa dashboard cache
            await CacheService.clearCacheByPattern('dashboard:*');
            await CacheService.clearCacheByPattern('admin:*');
            
        } catch (error) {
            console.error('❌ Error invalidating admin bulk change caches:', error);
        }
    }
}

export default CacheInvalidation;
