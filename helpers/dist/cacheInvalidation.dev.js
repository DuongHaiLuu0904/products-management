"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _cacheService = _interopRequireDefault(require("../services/cache.service.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CacheInvalidation =
/*#__PURE__*/
function () {
  function CacheInvalidation() {
    _classCallCheck(this, CacheInvalidation);
  }

  _createClass(CacheInvalidation, null, [{
    key: "invalidateProductCaches",
    // Invalidate khi product thay đổi
    value: function invalidateProductCaches(productId) {
      var productSlug,
          _args = arguments;
      return regeneratorRuntime.async(function invalidateProductCaches$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              productSlug = _args.length > 1 && _args[1] !== undefined ? _args[1] : null;
              _context.prev = 1;
              _context.next = 4;
              return regeneratorRuntime.awrap(_cacheService["default"].invalidateProductCache(productId));

            case 4:
              if (!productSlug) {
                _context.next = 7;
                break;
              }

              _context.next = 7;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("product_detail:".concat(productSlug)));

            case 7:
              _context.next = 9;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('products_list:*'));

            case 9:
              _context.next = 11;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('category_products:*'));

            case 11:
              _context.next = 13;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('search:*'));

            case 13:
              _context.next = 15;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('homepage_featured_products'));

            case 15:
              _context.next = 17;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('all_active_products'));

            case 17:
              _context.next = 19;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("rating:".concat(productId)));

            case 19:
              _context.next = 21;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("rating_dist:".concat(productId)));

            case 21:
              _context.next = 26;
              break;

            case 23:
              _context.prev = 23;
              _context.t0 = _context["catch"](1);
              console.error('❌ Error invalidating product caches:', _context.t0);

            case 26:
            case "end":
              return _context.stop();
          }
        }
      }, null, null, [[1, 23]]);
    } // Invalidate khi category thay đổi

  }, {
    key: "invalidateCategoryCaches",
    value: function invalidateCategoryCaches(categoryId) {
      var categorySlug,
          _args2 = arguments;
      return regeneratorRuntime.async(function invalidateCategoryCaches$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              categorySlug = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : null;
              _context2.prev = 1;
              _context2.next = 4;
              return regeneratorRuntime.awrap(_cacheService["default"].invalidateCategoryCache(categoryId));

            case 4:
              if (!categorySlug) {
                _context2.next = 7;
                break;
              }

              _context2.next = 7;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("category_slug:".concat(categorySlug)));

            case 7:
              _context2.next = 9;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('category_products:*'));

            case 9:
              _context2.next = 11;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('products_list:*'));

            case 11:
              _context2.next = 13;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("subcategories:".concat(categoryId)));

            case 13:
              _context2.next = 15;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('subcategories:*'));

            case 15:
              _context2.next = 20;
              break;

            case 17:
              _context2.prev = 17;
              _context2.t0 = _context2["catch"](1);
              console.error('❌ Error invalidating category caches:', _context2.t0);

            case 20:
            case "end":
              return _context2.stop();
          }
        }
      }, null, null, [[1, 17]]);
    } // Invalidate khi comment thay đổi

  }, {
    key: "invalidateCommentCaches",
    value: function invalidateCommentCaches(productId) {
      return regeneratorRuntime.async(function invalidateCommentCaches$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return regeneratorRuntime.awrap(_cacheService["default"].invalidateCommentsCache(productId));

            case 3:
              _context3.next = 5;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("rating:".concat(productId)));

            case 5:
              _context3.next = 7;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("rating_dist:".concat(productId)));

            case 7:
              _context3.next = 12;
              break;

            case 9:
              _context3.prev = 9;
              _context3.t0 = _context3["catch"](0);
              console.error('❌ Error invalidating comment caches:', _context3.t0);

            case 12:
            case "end":
              return _context3.stop();
          }
        }
      }, null, null, [[0, 9]]);
    } // Invalidate khi user thay đổi

  }, {
    key: "invalidateUserCaches",
    value: function invalidateUserCaches(userId) {
      return regeneratorRuntime.async(function invalidateUserCaches$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              _context4.next = 3;
              return regeneratorRuntime.awrap(_cacheService["default"].deleteUserSession(userId));

            case 3:
              _context4.next = 5;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("admin_session:".concat(userId)));

            case 5:
              _context4.next = 7;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("activity:".concat(userId)));

            case 7:
              _context4.next = 9;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern("admin_activity:".concat(userId)));

            case 9:
              _context4.next = 14;
              break;

            case 11:
              _context4.prev = 11;
              _context4.t0 = _context4["catch"](0);
              console.error('❌ Error invalidating user caches:', _context4.t0);

            case 14:
            case "end":
              return _context4.stop();
          }
        }
      }, null, null, [[0, 11]]);
    } // Invalidate khi cart thay đổi

  }, {
    key: "invalidateCartCaches",
    value: function invalidateCartCaches(cartId) {
      return regeneratorRuntime.async(function invalidateCartCaches$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              _context5.next = 3;
              return regeneratorRuntime.awrap(_cacheService["default"].invalidateCartCache(cartId));

            case 3:
              _context5.next = 8;
              break;

            case 5:
              _context5.prev = 5;
              _context5.t0 = _context5["catch"](0);
              console.error('❌ Error invalidating cart caches:', _context5.t0);

            case 8:
            case "end":
              return _context5.stop();
          }
        }
      }, null, null, [[0, 5]]);
    } // Invalidate toàn bộ cache (dùng khi cần thiết)

  }, {
    key: "invalidateAllCaches",
    value: function invalidateAllCaches() {
      return regeneratorRuntime.async(function invalidateAllCaches$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.prev = 0;
              _context6.next = 3;
              return regeneratorRuntime.awrap(_cacheService["default"].clearAllCache());

            case 3:
              _context6.next = 8;
              break;

            case 5:
              _context6.prev = 5;
              _context6.t0 = _context6["catch"](0);
              console.error('❌ Error clearing all caches:', _context6.t0);

            case 8:
            case "end":
              return _context6.stop();
          }
        }
      }, null, null, [[0, 5]]);
    } // Invalidate cache theo pattern cụ thể

  }, {
    key: "invalidateByPattern",
    value: function invalidateByPattern(pattern) {
      var count;
      return regeneratorRuntime.async(function invalidateByPattern$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.prev = 0;
              _context7.next = 3;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern(pattern));

            case 3:
              count = _context7.sent;
              return _context7.abrupt("return", count);

            case 7:
              _context7.prev = 7;
              _context7.t0 = _context7["catch"](0);
              console.error('❌ Error invalidating caches by pattern:', _context7.t0);
              return _context7.abrupt("return", 0);

            case 11:
            case "end":
              return _context7.stop();
          }
        }
      }, null, null, [[0, 7]]);
    } // Invalidate khi admin thực hiện thay đổi hàng loạt

  }, {
    key: "invalidateAdminBulkChanges",
    value: function invalidateAdminBulkChanges() {
      return regeneratorRuntime.async(function invalidateAdminBulkChanges$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.prev = 0;
              _context8.next = 3;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('products_list:*'));

            case 3:
              _context8.next = 5;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('category_products:*'));

            case 5:
              _context8.next = 7;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('product_detail:*'));

            case 7:
              _context8.next = 9;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('category_slug:*'));

            case 9:
              _context8.next = 11;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('subcategories:*'));

            case 11:
              _context8.next = 13;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('search:*'));

            case 13:
              _context8.next = 15;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('homepage_featured_products'));

            case 15:
              _context8.next = 17;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('all_active_products'));

            case 17:
              _context8.next = 19;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('dashboard:*'));

            case 19:
              _context8.next = 21;
              return regeneratorRuntime.awrap(_cacheService["default"].clearCacheByPattern('admin:*'));

            case 21:
              _context8.next = 26;
              break;

            case 23:
              _context8.prev = 23;
              _context8.t0 = _context8["catch"](0);
              console.error('❌ Error invalidating admin bulk change caches:', _context8.t0);

            case 26:
            case "end":
              return _context8.stop();
          }
        }
      }, null, null, [[0, 23]]);
    }
  }]);

  return CacheInvalidation;
}();

var _default = CacheInvalidation;
exports["default"] = _default;