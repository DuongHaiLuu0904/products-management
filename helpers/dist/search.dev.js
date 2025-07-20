"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _fuse = _interopRequireDefault(require("fuse.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _default = function _default(query) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var objectSearch = {
    keyword: "",
    useFuzzy: false
  };

  if (query.keyword) {
    objectSearch.keyword = query.keyword; // Tạo regex cho tìm kiếm truyền thống

    var regex = new RegExp(objectSearch.keyword, "i");
    objectSearch.regex = regex; // Nếu có data được truyền vào, sử dụng Fuse.js cho tìm kiếm mờ

    if (data && Array.isArray(data)) {
      objectSearch.useFuzzy = true; // Cấu hình mặc định cho Fuse.js

      var defaultOptions = {
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
      }; // Merge với options tùy chỉnh

      var fuseOptions = _objectSpread({}, defaultOptions, {}, options); // Tạo instance Fuse


      var fuse = new _fuse["default"](data, fuseOptions); // Thực hiện tìm kiếm

      var results = fuse.search(objectSearch.keyword); // Trả về kết quả tìm kiếm mờ

      objectSearch.fuzzyResults = results.map(function (result) {
        return result.item;
      });
      objectSearch.fuzzyResultsWithScore = results;
    }
  }

  return objectSearch;
};

exports["default"] = _default;