// Migration script để chuyển dữ liệu từ User.productComments sang Comment collection
// Chạy script này một lần để migrate dữ liệu

const mongoose = require('mongoose');
const User = require('./models/user.model');
const Comment = require('./models/comment.model');

const migrateComments = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/product-management-28tech');
        console.log('Connected to database');

        // Lấy tất cả user có productComments
        const users = await User.find({
            'productComments.0': { $exists: true }
        });

        console.log(`Found ${users.length} users with product comments`);

        let migratedCount = 0;

        for (const user of users) {
            if (user.productComments && user.productComments.length > 0) {
                for (const productComment of user.productComments) {
                    // Tạo comment mới
                    const comment = new Comment({
                        content: productComment.content,
                        user_id: user._id.toString(),
                        product_id: productComment.product_id,
                        rating: productComment.rating || null,
                        status: "active",
                        createdAt: productComment.createdAt || new Date(),
                        updatedAt: productComment.createdAt || new Date()
                    });

                    await comment.save();
                    migratedCount++;
                    console.log(`Migrated comment ${migratedCount} from user ${user.fullName}`);
                }
            }
        }

        console.log(`Migration completed! Total comments migrated: ${migratedCount}`);
        
        // Không xóa productComments từ User model ngay, để backup
        console.log('Note: productComments field is kept in User model for backup. You can remove it manually after confirming data integrity.');
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Migration error:', error);
        await mongoose.disconnect();
    }
};

// Chạy migration
if (require.main === module) {
    migrateComments();
}

module.exports = migrateComments;
