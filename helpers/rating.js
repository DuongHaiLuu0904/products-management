import Comment from '../models/comment.model.js';

// Tính rating trung bình của sản phẩm
export async function calculateAverageRating(productId) {
    try {
        const comments = await Comment.find({
            product_id: productId,
            deleted: false,
            status: "active",
            rating: { $exists: true, $ne: null }
        });

        if (comments.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0
            };
        }

        const totalRating = comments.reduce((sum, comment) => sum + comment.rating, 0);
        const averageRating = (totalRating / comments.length).toFixed(1);

        return {
            averageRating: parseFloat(averageRating),
            totalReviews: comments.length
        };
    } catch (error) {
        console.log(error);
        return {
            averageRating: 0,
            totalReviews: 0
        };
    }
}

// Lấy phân bố rating (1 sao, 2 sao, ...)
export async function getRatingDistribution(productId) {
    try {
        const comments = await Comment.find({
            product_id: productId,
            deleted: false,
            status: "active",
            rating: { $exists: true, $ne: null }
        });

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        comments.forEach(comment => {
            if (comment.rating >= 1 && comment.rating <= 5) {
                distribution[comment.rating]++;
            }
        });

        return distribution;
    } catch (error) {
        console.log(error);
        return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
}
