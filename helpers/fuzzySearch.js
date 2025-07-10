const Fuse = require('fuse.js');

module.exports.fuzzySearch = (data, keyword, options = {}) => {
    if (!data || !Array.isArray(data) || !keyword) {
        return {
            results: [],
            resultsWithScore: []
        };
    }

    // Cấu hình mặc định cho Fuse.js
    const defaultOptions = {
        // Độ tương đối khi tìm kiếm (0 = chính xác hoàn toàn, 1 = khớp mọi thứ)
        threshold: 0.4,
        // Bao gồm điểm số trong kết quả
        includeScore: true,
        // Vị trí của từ khóa trong chuỗi có ảnh hưởng đến điểm số
        location: 0,
        // Độ dài tối đa cho pattern
        distance: 100,
        // Độ dài pattern tối đa
        maxPatternLength: 32,
        // Độ dài pattern tối thiểu  
        minMatchCharLength: 1,
        // Các trường để tìm kiếm
        keys: ['title', 'description']
    };

    // Merge với options tùy chỉnh
    const fuseOptions = { ...defaultOptions, ...options };

    // Tạo instance Fuse
    const fuse = new Fuse(data, fuseOptions);

    // Thực hiện tìm kiếm
    const searchResults = fuse.search(keyword);

    return {
        results: searchResults.map(result => result.item),
        resultsWithScore: searchResults,
        totalFound: searchResults.length
    };
};


module.exports.searchProducts = (products, keyword) => {
    const options = {
        threshold: 0.3,
        keys: [
            {
                name: 'title',
                weight: 0.5
            }
        ]
    };

    return this.fuzzySearch(products, keyword, options);
};


module.exports.searchCategories = (categories, keyword) => {
    const options = {
        threshold: 0.3,
        keys: [
            {
                name: 'title',
                weight: 0.5
            }
        ]
    };

    return this.fuzzySearch(categories, keyword, options);
};


module.exports.searchUsers = (users, keyword) => {
    const options = {
        threshold: 0.3,
        keys: [
            {
                name: 'fullName',
                weight: 0.5
            }
        ]
    };

    return this.fuzzySearch(users, keyword, options);
};
