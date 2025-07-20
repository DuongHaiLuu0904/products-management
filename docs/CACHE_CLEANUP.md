# Cache Cleanup System

Hệ thống quản lý và làm sạch cache cho ứng dụng Products Management.

## Tính năng

### 1. Cache Cleanup tự động
- Chạy mỗi 6 giờ để xóa cache cũ và hết hạn
- Cleanup ban đầu khi khởi động ứng dụng

### 2. Admin Interface
- Giao diện web để quản lý cache tại `/admin/cache`
- Thống kê cache theo loại
- Thông tin memory usage
- Quick actions và advanced cleanup options

### 3. CLI Commands
Các lệnh có thể chạy từ terminal:

```bash
# Xóa cache hết hạn
npm run cache-cleanup:expired

# Xóa cache cũ hơn 24 giờ
npm run cache-cleanup:old

# Xóa cache mồ côi (orphaned)
npm run cache-cleanup:orphaned

# Cleanup toàn diện
npm run cache-cleanup:comprehensive

# Xem thống kê cache
npm run cache-stats

# Custom cleanup
npm run cache-cleanup -- <command> [options]
```

## Các loại Cache

### Products Cache
- `product:*` - Cache thông tin sản phẩm
- `products:*` - Cache danh sách sản phẩm
- `product_detail:*` - Cache chi tiết sản phẩm

### Categories Cache
- `category:*` - Cache thông tin danh mục
- `category_products:*` - Cache sản phẩm theo danh mục
- `subcategories:*` - Cache danh mục con

### Search Cache
- `search:*` - Cache kết quả tìm kiếm

### Comments Cache
- `comments:*` - Cache bình luận
- `rating:*` - Cache đánh giá
- `rating_dist:*` - Cache phân bố đánh giá

### Session Cache
- `session:*` - Cache phiên người dùng
- `admin_session:*` - Cache phiên admin

### Other Cache
- `cart:*` - Cache giỏ hàng
- `ratelimit:*` - Cache rate limiting
- `blacklist:*` - Cache token blacklist
- `dashboard:*` - Cache dashboard data

## API Endpoints

### Admin Routes
- `GET /admin/cache` - Trang quản lý cache
- `POST /admin/cache/cleanup` - Thực hiện cleanup
- `GET /admin/cache/stats` - Lấy thống kê cache
- `POST /admin/cache/invalidate` - Invalidate cache theo pattern
- `POST /admin/cache/refresh` - Refresh cache theo loại

### API Routes
- `POST /api/cache/cleanup` - API cleanup cache
- `GET /api/cache/stats` - API lấy thống kê cache

## CLI Usage Examples

```bash
# Cleanup cơ bản
npm run cache-cleanup:expired

# Cleanup cache cũ hơn 12 giờ
npm run cache-cleanup -- old 12

# Cleanup theo pattern
npm run cache-cleanup -- pattern "product:*" "search:*"

# Cleanup theo loại
npm run cache-cleanup -- type products

# Comprehensive cleanup với custom options
npm run cache-cleanup -- comprehensive 6

# Xem thống kê
npm run cache-stats
```

## Configuration

### Automatic Cleanup Schedule
Trong `index.js`:
- Cache cleanup: mỗi 6 giờ
- Token cleanup: mỗi 24 giờ

### Default TTL Values
- Products: 1 giờ (3600s)
- Categories: 2 giờ (7200s)
- Product Lists: 30 phút (1800s)
- Search Results: 1 giờ (3600s)
- Comments: 30 phút (1800s)
- User Sessions: 24 giờ (86400s)
- Carts: 2 giờ (7200s)

## Safety Features

1. **Error Handling**: Tất cả operations đều có error handling
2. **Logging**: Chi tiết logs cho mọi cleanup operations
3. **Confirmation**: Xác nhận trước khi xóa cache quan trọng
4. **Gradual Cleanup**: Không xóa quá nhiều keys cùng lúc
5. **Health Check**: Monitor Redis connection status

## Monitoring

### Logs
```bash
# Thành công
✅ Cache cleanup completed: 150 expired keys removed

# Lỗi
❌ Cache cleanup error: Connection timeout

# Thông tin
🧹 Starting cache cleanup...
📊 Cache Statistics: {...}
```

### Health Check
System tự động kiểm tra:
- Redis connection status
- Memory usage
- Key count và distribution
- Error rates

## Troubleshooting

### Redis Connection Issues
1. Kiểm tra Redis server status
2. Verify connection string trong `.env`
3. Check network connectivity

### Memory Issues
1. Monitor Redis memory usage
2. Adjust cleanup frequency
3. Reduce TTL values if needed

### Performance Issues
1. Use pattern-based cleanup thay vì full cleanup
2. Schedule cleanup during low-traffic periods
3. Monitor cleanup duration

## Best Practices

1. **Regular Monitoring**: Kiểm tra cache stats thường xuyên
2. **Scheduled Cleanup**: Để automatic cleanup chạy
3. **Pattern-based Operations**: Sử dụng patterns thay vì xóa toàn bộ
4. **Testing**: Test cleanup trên staging trước khi production
5. **Backup**: Backup important cache data nếu cần

## Security

- Admin authentication required cho tất cả admin operations
- Rate limiting cho API endpoints
- Input validation cho tất cả parameters
- Audit logging cho admin actions
