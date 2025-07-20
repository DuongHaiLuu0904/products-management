"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fuzzySearch = fuzzySearch;
exports.searchProducts = searchProducts;
exports.searchCategories = searchCategories;
exports.searchUsers = searchUsers;

var _fuse = _interopRequireDefault(require("fuse.js"));

var _diacritics = require("diacritics");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function fuzzySearch(data, keyword) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!data || !Array.isArray(data) || !keyword) {
    return {
      results: [],
      resultsWithScore: []
    };
  } // Loại bỏ dấu từ keyword trước khi tìm kiếm


  var normalizedKeyword = (0, _diacritics.remove)(keyword.toLowerCase()); // Cấu hình mặc định cho Fuse.js

  var defaultOptions = {
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
  }; // Merge với options tùy chỉnh

  var fuseOptions = _objectSpread({}, defaultOptions, {}, options); // Chuẩn hóa dữ liệu: loại bỏ dấu từ các trường cần tìm kiếm


  var normalizedData = data.map(function (item) {
    var normalizedItem = _objectSpread({}, item); // Lấy danh sách keys từ options hoặc sử dụng keys mặc định


    var searchKeys = fuseOptions.keys || ['title', 'description'];
    searchKeys.forEach(function (key) {
      if (typeof key === 'string' && item[key]) {
        normalizedItem[key] = (0, _diacritics.remove)(item[key].toLowerCase());
      } else if (_typeof(key) === 'object' && key.name && item[key.name]) {
        normalizedItem[key.name] = (0, _diacritics.remove)(item[key.name].toLowerCase());
      }
    });
    return normalizedItem;
  }); // Tạo instance Fuse với dữ liệu đã chuẩn hóa

  var fuse = new _fuse["default"](normalizedData, fuseOptions); // Thực hiện tìm kiếm với keyword đã chuẩn hóa

  var searchResults = fuse.search(normalizedKeyword); // Trả về kết quả với dữ liệu gốc (chưa chuẩn hóa)

  return {
    results: searchResults.map(function (result) {
      var originalIndex = normalizedData.indexOf(result.item);
      return data[originalIndex];
    }),
    resultsWithScore: searchResults.map(function (result) {
      var originalIndex = normalizedData.indexOf(result.item);
      return _objectSpread({}, result, {
        item: data[originalIndex]
      });
    }),
    totalFound: searchResults.length
  };
}

function searchProducts(products, keyword) {
  var options = {
    threshold: 0.3,
    keys: [{
      name: 'title',
      weight: 0.7
    }]
  };
  return fuzzySearch(products, keyword, options);
}

function searchCategories(categories, keyword) {
  var options = {
    threshold: 0.3,
    keys: [{
      name: 'title',
      weight: 0.8
    }]
  };
  return fuzzySearch(categories, keyword, options);
}

function searchUsers(users, keyword) {
  var options = {
    threshold: 0.3,
    keys: [{
      name: 'fullName',
      weight: 0.6
    }]
  };
  return fuzzySearch(users, keyword, options);
}