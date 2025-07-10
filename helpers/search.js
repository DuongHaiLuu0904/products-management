const Fuse = require('fuse.js');

module.exports = (query, data = null, options = {}) => {
    let objectSearch = {
        keyword: "",
        useFuzzy: false
    }

    if(query.keyword) {
        objectSearch.keyword = query.keyword
        
        // Tạo regex cho tìm kiếm truyền thống
        const regex = new RegExp(objectSearch.keyword, "i")
        objectSearch.regex = regex

        // Nếu có data được truyền vào, sử dụng Fuse.js cho tìm kiếm mờ
        if(data && Array.isArray(data)) {
            objectSearch.useFuzzy = true

            // Cấu hình mặc định cho Fuse.js
            const defaultOptions = {
                // Độ tương đối khi tìm kiếm (0 = chính xác hoàn toàn, 1 = khớp mọi thứ)
                threshold: 0.3,
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
            }

            // Merge với options tùy chỉnh
            const fuseOptions = { ...defaultOptions, ...options }
            
            // Tạo instance Fuse
            const fuse = new Fuse(data, fuseOptions)
            
            // Thực hiện tìm kiếm
            const results = fuse.search(objectSearch.keyword)
            
            // Trả về kết quả tìm kiếm mờ
            objectSearch.fuzzyResults = results.map(result => result.item)
            objectSearch.fuzzyResultsWithScore = results
        }
    }

    return objectSearch
}