"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calculateAverageRating = calculateAverageRating;
exports.getRatingDistribution = getRatingDistribution;

var _commentModel = _interopRequireDefault(require("../models/comment.model.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Tính rating trung bình của sản phẩm
function calculateAverageRating(productId) {
  var comments, totalRating, averageRating;
  return regeneratorRuntime.async(function calculateAverageRating$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(_commentModel["default"].find({
            product_id: productId,
            deleted: false,
            status: "active",
            rating: {
              $exists: true,
              $ne: null
            }
          }));

        case 3:
          comments = _context.sent;

          if (!(comments.length === 0)) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", {
            averageRating: 0,
            totalReviews: 0
          });

        case 6:
          totalRating = comments.reduce(function (sum, comment) {
            return sum + comment.rating;
          }, 0);
          averageRating = (totalRating / comments.length).toFixed(1);
          return _context.abrupt("return", {
            averageRating: parseFloat(averageRating),
            totalReviews: comments.length
          });

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](0);
          console.log(_context.t0);
          return _context.abrupt("return", {
            averageRating: 0,
            totalReviews: 0
          });

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 11]]);
} // Lấy phân bố rating (1 sao, 2 sao, ...)


function getRatingDistribution(productId) {
  var comments, distribution;
  return regeneratorRuntime.async(function getRatingDistribution$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(_commentModel["default"].find({
            product_id: productId,
            deleted: false,
            status: "active",
            rating: {
              $exists: true,
              $ne: null
            }
          }));

        case 3:
          comments = _context2.sent;
          distribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          };
          comments.forEach(function (comment) {
            if (comment.rating >= 1 && comment.rating <= 5) {
              distribution[comment.rating]++;
            }
          });
          return _context2.abrupt("return", distribution);

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](0);
          console.log(_context2.t0);
          return _context2.abrupt("return", {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          });

        case 13:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 9]]);
}