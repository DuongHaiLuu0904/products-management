"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _redis = require("../config/redis.js");

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CacheHelper =
/*#__PURE__*/
function () {
  function CacheHelper() {
    _classCallCheck(this, CacheHelper);

    this.redis = _redis.redisConfig.getInstance();
    this.defaultTTL = 3600; // 1 hour
  } // Cache cho products


  _createClass(CacheHelper, [{
    key: "cacheProduct",
    value: function cacheProduct(productId, productData) {
      var ttl,
          key,
          sanitizedData,
          _args = arguments;
      return regeneratorRuntime.async(function cacheProduct$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              ttl = _args.length > 2 && _args[2] !== undefined ? _args[2] : this.defaultTTL;
              _context.prev = 1;
              key = "product:".concat(productId); // Đảm bảo data có structure đúng trước khi cache

              if (!(productData && _typeof(productData) === 'object')) {
                _context.next = 8;
                break;
              }

              // Kiểm tra và fix các field quan trọng
              sanitizedData = _objectSpread({}, productData, {
                price: productData.price || 0,
                discountPercentage: productData.discountPercentage || 0,
                stock: productData.stock || 0
              });
              _context.next = 7;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, sanitizedData, ttl));

            case 7:
              return _context.abrupt("return", _context.sent);

            case 8:
              _context.next = 10;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, productData, ttl));

            case 10:
              return _context.abrupt("return", _context.sent);

            case 13:
              _context.prev = 13;
              _context.t0 = _context["catch"](1);
              console.error('Cache product error:', _context.t0);
              return _context.abrupt("return", false);

            case 17:
            case "end":
              return _context.stop();
          }
        }
      }, null, this, [[1, 13]]);
    }
  }, {
    key: "getCachedProduct",
    value: function getCachedProduct(productId) {
      var key;
      return regeneratorRuntime.async(function getCachedProduct$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              key = "product:".concat(productId);
              _context2.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 3:
              return _context2.abrupt("return", _context2.sent);

            case 4:
            case "end":
              return _context2.stop();
          }
        }
      });
    }
  }, {
    key: "deleteCachedProduct",
    value: function deleteCachedProduct(productId) {
      var key;
      return regeneratorRuntime.async(function deleteCachedProduct$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              key = "product:".concat(productId);
              _context3.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.del(key));

            case 3:
              return _context3.abrupt("return", _context3.sent);

            case 4:
            case "end":
              return _context3.stop();
          }
        }
      });
    } // Cache cho product categories

  }, {
    key: "cacheProductCategory",
    value: function cacheProductCategory(categoryId, categoryData) {
      var ttl,
          key,
          _args4 = arguments;
      return regeneratorRuntime.async(function cacheProductCategory$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              ttl = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : this.defaultTTL;
              key = "category:".concat(categoryId);
              _context4.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, categoryData, ttl));

            case 4:
              return _context4.abrupt("return", _context4.sent);

            case 5:
            case "end":
              return _context4.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: "getCachedProductCategory",
    value: function getCachedProductCategory(categoryId) {
      var key;
      return regeneratorRuntime.async(function getCachedProductCategory$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              key = "category:".concat(categoryId);
              _context5.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 3:
              return _context5.abrupt("return", _context5.sent);

            case 4:
            case "end":
              return _context5.stop();
          }
        }
      });
    }
  }, {
    key: "deleteCachedProductCategory",
    value: function deleteCachedProductCategory(categoryId) {
      var key;
      return regeneratorRuntime.async(function deleteCachedProductCategory$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              key = "category:".concat(categoryId);
              _context6.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.del(key));

            case 3:
              return _context6.abrupt("return", _context6.sent);

            case 4:
            case "end":
              return _context6.stop();
          }
        }
      });
    } // Cache cho danh sách products

  }, {
    key: "cacheProductList",
    value: function cacheProductList(filters, products) {
      var ttl,
          key,
          sanitizedProducts,
          _args7 = arguments;
      return regeneratorRuntime.async(function cacheProductList$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              ttl = _args7.length > 2 && _args7[2] !== undefined ? _args7[2] : 1800;
              _context7.prev = 1;
              key = "products:".concat(JSON.stringify(filters)); // Sanitize products list

              if (!Array.isArray(products)) {
                _context7.next = 8;
                break;
              }

              sanitizedProducts = products.map(function (product) {
                return _objectSpread({}, product, {
                  price: product.price || 0,
                  discountPercentage: product.discountPercentage || 0,
                  stock: product.stock || 0
                });
              });
              _context7.next = 7;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, sanitizedProducts, ttl));

            case 7:
              return _context7.abrupt("return", _context7.sent);

            case 8:
              _context7.next = 10;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, products, ttl));

            case 10:
              return _context7.abrupt("return", _context7.sent);

            case 13:
              _context7.prev = 13;
              _context7.t0 = _context7["catch"](1);
              console.error('Cache product list error:', _context7.t0);
              return _context7.abrupt("return", false);

            case 17:
            case "end":
              return _context7.stop();
          }
        }
      }, null, null, [[1, 13]]);
    }
  }, {
    key: "getCachedProductList",
    value: function getCachedProductList(filters) {
      var key;
      return regeneratorRuntime.async(function getCachedProductList$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              key = "products:".concat(JSON.stringify(filters));
              _context8.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 3:
              return _context8.abrupt("return", _context8.sent);

            case 4:
            case "end":
              return _context8.stop();
          }
        }
      });
    } // Cache cho user sessions

  }, {
    key: "cacheUserSession",
    value: function cacheUserSession(userId, sessionData) {
      var ttl,
          key,
          _args9 = arguments;
      return regeneratorRuntime.async(function cacheUserSession$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              ttl = _args9.length > 2 && _args9[2] !== undefined ? _args9[2] : 86400;
              // 24 hours
              key = "session:".concat(userId);
              _context9.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, sessionData, ttl));

            case 4:
              return _context9.abrupt("return", _context9.sent);

            case 5:
            case "end":
              return _context9.stop();
          }
        }
      });
    }
  }, {
    key: "getCachedUserSession",
    value: function getCachedUserSession(userId) {
      var key;
      return regeneratorRuntime.async(function getCachedUserSession$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              key = "session:".concat(userId);
              _context10.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 3:
              return _context10.abrupt("return", _context10.sent);

            case 4:
            case "end":
              return _context10.stop();
          }
        }
      });
    }
  }, {
    key: "deleteCachedUserSession",
    value: function deleteCachedUserSession(userId) {
      var key;
      return regeneratorRuntime.async(function deleteCachedUserSession$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              key = "session:".concat(userId);
              _context11.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.del(key));

            case 3:
              return _context11.abrupt("return", _context11.sent);

            case 4:
            case "end":
              return _context11.stop();
          }
        }
      });
    } // Cache cho cart data

  }, {
    key: "cacheCart",
    value: function cacheCart(cartId, cartData) {
      var ttl,
          key,
          _args12 = arguments;
      return regeneratorRuntime.async(function cacheCart$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              ttl = _args12.length > 2 && _args12[2] !== undefined ? _args12[2] : 7200;
              // 2 hours
              key = "cart:".concat(cartId);
              _context12.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, cartData, ttl));

            case 4:
              return _context12.abrupt("return", _context12.sent);

            case 5:
            case "end":
              return _context12.stop();
          }
        }
      });
    }
  }, {
    key: "getCachedCart",
    value: function getCachedCart(cartId) {
      var key;
      return regeneratorRuntime.async(function getCachedCart$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              key = "cart:".concat(cartId);
              _context13.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 3:
              return _context13.abrupt("return", _context13.sent);

            case 4:
            case "end":
              return _context13.stop();
          }
        }
      });
    }
  }, {
    key: "deleteCachedCart",
    value: function deleteCachedCart(cartId) {
      var key;
      return regeneratorRuntime.async(function deleteCachedCart$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              key = "cart:".concat(cartId);
              _context14.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.del(key));

            case 3:
              return _context14.abrupt("return", _context14.sent);

            case 4:
            case "end":
              return _context14.stop();
          }
        }
      });
    } // Cache cho search results

  }, {
    key: "cacheSearchResults",
    value: function cacheSearchResults(searchQuery, results) {
      var ttl,
          key,
          _args15 = arguments;
      return regeneratorRuntime.async(function cacheSearchResults$(_context15) {
        while (1) {
          switch (_context15.prev = _context15.next) {
            case 0:
              ttl = _args15.length > 2 && _args15[2] !== undefined ? _args15[2] : 3600;
              key = "search:".concat(searchQuery);
              _context15.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, results, ttl));

            case 4:
              return _context15.abrupt("return", _context15.sent);

            case 5:
            case "end":
              return _context15.stop();
          }
        }
      });
    }
  }, {
    key: "getCachedSearchResults",
    value: function getCachedSearchResults(searchQuery) {
      var key;
      return regeneratorRuntime.async(function getCachedSearchResults$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              key = "search:".concat(searchQuery);
              _context16.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 3:
              return _context16.abrupt("return", _context16.sent);

            case 4:
            case "end":
              return _context16.stop();
          }
        }
      });
    } // Cache cho comments

  }, {
    key: "cacheComments",
    value: function cacheComments(productId, comments) {
      var ttl,
          key,
          _args17 = arguments;
      return regeneratorRuntime.async(function cacheComments$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              ttl = _args17.length > 2 && _args17[2] !== undefined ? _args17[2] : 1800;
              key = "comments:".concat(productId);
              _context17.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, comments, ttl));

            case 4:
              return _context17.abrupt("return", _context17.sent);

            case 5:
            case "end":
              return _context17.stop();
          }
        }
      });
    }
  }, {
    key: "getCachedComments",
    value: function getCachedComments(productId) {
      var key;
      return regeneratorRuntime.async(function getCachedComments$(_context18) {
        while (1) {
          switch (_context18.prev = _context18.next) {
            case 0:
              key = "comments:".concat(productId);
              _context18.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 3:
              return _context18.abrupt("return", _context18.sent);

            case 4:
            case "end":
              return _context18.stop();
          }
        }
      });
    }
  }, {
    key: "deleteCachedComments",
    value: function deleteCachedComments(productId) {
      var key;
      return regeneratorRuntime.async(function deleteCachedComments$(_context19) {
        while (1) {
          switch (_context19.prev = _context19.next) {
            case 0:
              key = "comments:".concat(productId);
              _context19.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.del(key));

            case 3:
              return _context19.abrupt("return", _context19.sent);

            case 4:
            case "end":
              return _context19.stop();
          }
        }
      });
    } // Rate limiting

  }, {
    key: "setRateLimit",
    value: function setRateLimit(identifier, limit) {
      var windowSeconds,
          key,
          current,
          _args20 = arguments;
      return regeneratorRuntime.async(function setRateLimit$(_context20) {
        while (1) {
          switch (_context20.prev = _context20.next) {
            case 0:
              windowSeconds = _args20.length > 2 && _args20[2] !== undefined ? _args20[2] : 3600;
              key = "ratelimit:".concat(identifier);
              _context20.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 4:
              _context20.t0 = _context20.sent;

              if (_context20.t0) {
                _context20.next = 7;
                break;
              }

              _context20.t0 = 0;

            case 7:
              current = _context20.t0;

              if (!(current >= limit)) {
                _context20.next = 10;
                break;
              }

              return _context20.abrupt("return", false);

            case 10:
              _context20.next = 12;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, current + 1, windowSeconds));

            case 12:
              return _context20.abrupt("return", true);

            case 13:
            case "end":
              return _context20.stop();
          }
        }
      });
    }
  }, {
    key: "getRateLimitCount",
    value: function getRateLimitCount(identifier) {
      var key;
      return regeneratorRuntime.async(function getRateLimitCount$(_context21) {
        while (1) {
          switch (_context21.prev = _context21.next) {
            case 0:
              key = "ratelimit:".concat(identifier);
              _context21.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.get(key));

            case 3:
              _context21.t0 = _context21.sent;

              if (_context21.t0) {
                _context21.next = 6;
                break;
              }

              _context21.t0 = 0;

            case 6:
              return _context21.abrupt("return", _context21.t0);

            case 7:
            case "end":
              return _context21.stop();
          }
        }
      });
    } // Token blacklist (for logout)

  }, {
    key: "blacklistToken",
    value: function blacklistToken(token) {
      var ttl,
          key,
          _args22 = arguments;
      return regeneratorRuntime.async(function blacklistToken$(_context22) {
        while (1) {
          switch (_context22.prev = _context22.next) {
            case 0:
              ttl = _args22.length > 1 && _args22[1] !== undefined ? _args22[1] : 86400;
              key = "blacklist:".concat(token);
              _context22.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.set(key, 'blacklisted', ttl));

            case 4:
              return _context22.abrupt("return", _context22.sent);

            case 5:
            case "end":
              return _context22.stop();
          }
        }
      });
    }
  }, {
    key: "isTokenBlacklisted",
    value: function isTokenBlacklisted(token) {
      var key;
      return regeneratorRuntime.async(function isTokenBlacklisted$(_context23) {
        while (1) {
          switch (_context23.prev = _context23.next) {
            case 0:
              key = "blacklist:".concat(token);
              _context23.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.exists(key));

            case 3:
              return _context23.abrupt("return", _context23.sent);

            case 4:
            case "end":
              return _context23.stop();
          }
        }
      });
    } // Chat room management

  }, {
    key: "addUserToRoom",
    value: function addUserToRoom(roomId, userId) {
      var key;
      return regeneratorRuntime.async(function addUserToRoom$(_context24) {
        while (1) {
          switch (_context24.prev = _context24.next) {
            case 0:
              key = "room:".concat(roomId, ":users");
              _context24.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.sadd(key, userId));

            case 3:
              return _context24.abrupt("return", _context24.sent);

            case 4:
            case "end":
              return _context24.stop();
          }
        }
      });
    }
  }, {
    key: "removeUserFromRoom",
    value: function removeUserFromRoom(roomId, userId) {
      var key;
      return regeneratorRuntime.async(function removeUserFromRoom$(_context25) {
        while (1) {
          switch (_context25.prev = _context25.next) {
            case 0:
              key = "room:".concat(roomId, ":users");
              _context25.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.srem(key, userId));

            case 3:
              return _context25.abrupt("return", _context25.sent);

            case 4:
            case "end":
              return _context25.stop();
          }
        }
      });
    }
  }, {
    key: "getRoomUsers",
    value: function getRoomUsers(roomId) {
      var key;
      return regeneratorRuntime.async(function getRoomUsers$(_context26) {
        while (1) {
          switch (_context26.prev = _context26.next) {
            case 0:
              key = "room:".concat(roomId, ":users");
              _context26.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.smembers(key));

            case 3:
              return _context26.abrupt("return", _context26.sent);

            case 4:
            case "end":
              return _context26.stop();
          }
        }
      });
    } // Recent activity tracking

  }, {
    key: "addRecentActivity",
    value: function addRecentActivity(userId, activity) {
      var maxItems,
          key,
          _args27 = arguments;
      return regeneratorRuntime.async(function addRecentActivity$(_context27) {
        while (1) {
          switch (_context27.prev = _context27.next) {
            case 0:
              maxItems = _args27.length > 2 && _args27[2] !== undefined ? _args27[2] : 10;
              key = "activity:".concat(userId);
              _context27.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.lpush(key, activity));

            case 4:
              _context27.next = 6;
              return regeneratorRuntime.awrap(_redis.redisConfig.ltrim(key, 0, maxItems - 1));

            case 6:
              _context27.next = 8;
              return regeneratorRuntime.awrap(_redis.redisConfig.expire(key, 86400));

            case 8:
              return _context27.abrupt("return", _context27.sent);

            case 9:
            case "end":
              return _context27.stop();
          }
        }
      });
    }
  }, {
    key: "getRecentActivity",
    value: function getRecentActivity(userId) {
      var count,
          key,
          _args28 = arguments;
      return regeneratorRuntime.async(function getRecentActivity$(_context28) {
        while (1) {
          switch (_context28.prev = _context28.next) {
            case 0:
              count = _args28.length > 1 && _args28[1] !== undefined ? _args28[1] : 10;
              key = "activity:".concat(userId);
              _context28.next = 4;
              return regeneratorRuntime.awrap(_redis.redisConfig.lrange(key, 0, count - 1));

            case 4:
              return _context28.abrupt("return", _context28.sent);

            case 5:
            case "end":
              return _context28.stop();
          }
        }
      });
    } // Utility methods

  }, {
    key: "clearAllCache",
    value: function clearAllCache() {
      return regeneratorRuntime.async(function clearAllCache$(_context29) {
        while (1) {
          switch (_context29.prev = _context29.next) {
            case 0:
              _context29.next = 2;
              return regeneratorRuntime.awrap(_redis.redisConfig.flushall());

            case 2:
              return _context29.abrupt("return", _context29.sent);

            case 3:
            case "end":
              return _context29.stop();
          }
        }
      });
    }
  }, {
    key: "clearCacheByPattern",
    value: function clearCacheByPattern(pattern) {
      var keys;
      return regeneratorRuntime.async(function clearCacheByPattern$(_context30) {
        while (1) {
          switch (_context30.prev = _context30.next) {
            case 0:
              _context30.next = 2;
              return regeneratorRuntime.awrap(_redis.redisConfig.keys(pattern));

            case 2:
              keys = _context30.sent;

              if (!(keys.length > 0)) {
                _context30.next = 7;
                break;
              }

              _context30.next = 6;
              return regeneratorRuntime.awrap(_redis.redisConfig.del.apply(_redis.redisConfig, _toConsumableArray(keys)));

            case 6:
              return _context30.abrupt("return", _context30.sent);

            case 7:
              return _context30.abrupt("return", 0);

            case 8:
            case "end":
              return _context30.stop();
          }
        }
      });
    }
  }, {
    key: "getCacheKeys",
    value: function getCacheKeys() {
      var pattern,
          _args31 = arguments;
      return regeneratorRuntime.async(function getCacheKeys$(_context31) {
        while (1) {
          switch (_context31.prev = _context31.next) {
            case 0:
              pattern = _args31.length > 0 && _args31[0] !== undefined ? _args31[0] : '*';
              _context31.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.keys(pattern));

            case 3:
              return _context31.abrupt("return", _context31.sent);

            case 4:
            case "end":
              return _context31.stop();
          }
        }
      });
    } // Health check

  }, {
    key: "healthCheck",
    value: function healthCheck() {
      var ping;
      return regeneratorRuntime.async(function healthCheck$(_context32) {
        while (1) {
          switch (_context32.prev = _context32.next) {
            case 0:
              _context32.prev = 0;
              _context32.next = 3;
              return regeneratorRuntime.awrap(_redis.redisConfig.ping());

            case 3:
              ping = _context32.sent;
              return _context32.abrupt("return", {
                status: 'healthy',
                ping: ping,
                timestamp: new Date().toISOString()
              });

            case 7:
              _context32.prev = 7;
              _context32.t0 = _context32["catch"](0);
              return _context32.abrupt("return", {
                status: 'unhealthy',
                error: _context32.t0.message,
                timestamp: new Date().toISOString()
              });

            case 10:
            case "end":
              return _context32.stop();
          }
        }
      }, null, null, [[0, 7]]);
    }
  }]);

  return CacheHelper;
}(); // Export singleton instance


var cacheHelper = new CacheHelper();
var _default = cacheHelper;
exports["default"] = _default;