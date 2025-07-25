import Fuse from 'fuse.js';
import { remove } from 'diacritics';

export function fuzzySearch(data, keyword, options = {}) {
    if (!data || !Array.isArray(data) || !keyword) {
        return {
            results: [],
            resultsWithScore: []
        };
    }

    // Loại bỏ dấu từ keyword trước khi tìm kiếm
    const normalizedKeyword = remove(keyword.toLowerCase());

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

    // Chuẩn hóa dữ liệu: loại bỏ dấu từ các trường cần tìm kiếm
    const normalizedData = data.map(item => {
        const normalizedItem = { ...item };
        
        // Lấy danh sách keys từ options hoặc sử dụng keys mặc định
        const searchKeys = fuseOptions.keys || ['title', 'description'];
        
        searchKeys.forEach(key => {
            if (typeof key === 'string' && item[key]) {
                normalizedItem[key] = remove(item[key].toLowerCase());
            } else if (typeof key === 'object' && key.name && item[key.name]) {
                normalizedItem[key.name] = remove(item[key.name].toLowerCase());
            }
        });
        
        return normalizedItem;
    });

    // Tạo instance Fuse với dữ liệu đã chuẩn hóa
    const fuse = new Fuse(normalizedData, fuseOptions);

    // Thực hiện tìm kiếm với keyword đã chuẩn hóa
    const searchResults = fuse.search(normalizedKeyword);

    // Trả về kết quả với dữ liệu gốc (chưa chuẩn hóa)
    return {
        results: searchResults.map(result => {
            const originalIndex = normalizedData.indexOf(result.item);
            return data[originalIndex];
        }),
        resultsWithScore: searchResults.map(result => {
            const originalIndex = normalizedData.indexOf(result.item);
            return {
                ...result,
                item: data[originalIndex]
            };
        }),
        totalFound: searchResults.length
    };
}


export function searchProducts(products, keyword) {
    const options = {
        threshold: 0.3,
        keys: [
            {
                name: 'title',
                weight: 0.7
            }
        ]
    };

    return fuzzySearch(products, keyword, options);
}


export function searchCategories(categories, keyword) {
    const options = {
        threshold: 0.3,
        keys: [
            {
                name: 'title',
                weight: 0.8
            }
        ]
    };

    return fuzzySearch(categories, keyword, options);
}


export function searchUsers(users, keyword) {
    const options = {
        threshold: 0.3,
        keys: [
            {
                name: 'fullName',
                weight: 0.6
            }
        ]
    };

    return fuzzySearch(users, keyword, options);
}
