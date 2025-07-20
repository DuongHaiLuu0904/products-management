"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.revokeAllTokens = exports.revokeUserTokens = exports.cleanupExpiredTokens = void 0;

var _userModel = _interopRequireDefault(require("../models/user.model.js"));

var _accountModel = _interopRequireDefault(require("../models/account.model.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var cleanupExpiredTokens = function cleanupExpiredTokens() {
  var now, userResult, accountResult;
  return regeneratorRuntime.async(function cleanupExpiredTokens$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          now = new Date(); // Clean expired refresh tokens from User collection với timeout

          _context.next = 4;
          return regeneratorRuntime.awrap(_userModel["default"].updateMany({
            refreshTokenExpires: {
              $lt: now
            },
            refreshToken: {
              $ne: null
            }
          }, {
            $unset: {
              refreshToken: 1,
              refreshTokenExpires: 1
            }
          }).maxTimeMS(10000));

        case 4:
          userResult = _context.sent;
          _context.next = 7;
          return regeneratorRuntime.awrap(_accountModel["default"].updateMany({
            refreshTokenExpires: {
              $lt: now
            },
            refreshToken: {
              $ne: null
            }
          }, {
            $unset: {
              refreshToken: 1,
              refreshTokenExpires: 1
            }
          }).maxTimeMS(10000));

        case 7:
          accountResult = _context.sent;
          return _context.abrupt("return", {
            userTokensCleared: userResult.modifiedCount,
            accountTokensCleared: accountResult.modifiedCount
          });

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](0);

          // Chỉ log lỗi nghiêm trọng, bỏ qua network errors
          if (_context.t0.code !== 'ECONNRESET' && _context.t0.errno !== -4077) {
            console.error('Error cleaning up expired tokens:', _context.t0.message);
          }

          throw _context.t0;

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 11]]);
};

exports.cleanupExpiredTokens = cleanupExpiredTokens;

var revokeUserTokens = function revokeUserTokens(userId) {
  var userType,
      Model,
      result,
      _args2 = arguments;
  return regeneratorRuntime.async(function revokeUserTokens$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          userType = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : 'user';
          _context2.prev = 1;
          Model = userType === 'user' ? _userModel["default"] : _accountModel["default"];
          _context2.next = 5;
          return regeneratorRuntime.awrap(Model.updateOne({
            _id: userId
          }, {
            $unset: {
              refreshToken: 1,
              refreshTokenExpires: 1
            }
          }));

        case 5:
          result = _context2.sent;
          return _context2.abrupt("return", result.modifiedCount > 0);

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](1);
          console.error('Error revoking user tokens:', _context2.t0);
          throw _context2.t0;

        case 13:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 9]]);
};

exports.revokeUserTokens = revokeUserTokens;

var revokeAllTokens = function revokeAllTokens() {
  var userResult, accountResult;
  return regeneratorRuntime.async(function revokeAllTokens$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(_userModel["default"].updateMany({
            refreshToken: {
              $ne: null
            }
          }, {
            $unset: {
              refreshToken: 1,
              refreshTokenExpires: 1
            }
          }));

        case 3:
          userResult = _context3.sent;
          _context3.next = 6;
          return regeneratorRuntime.awrap(_accountModel["default"].updateMany({
            refreshToken: {
              $ne: null
            }
          }, {
            $unset: {
              refreshToken: 1,
              refreshTokenExpires: 1
            }
          }));

        case 6:
          accountResult = _context3.sent;
          return _context3.abrupt("return", {
            userTokensRevoked: userResult.modifiedCount,
            accountTokensRevoked: accountResult.modifiedCount
          });

        case 10:
          _context3.prev = 10;
          _context3.t0 = _context3["catch"](0);
          console.error('Error revoking all tokens:', _context3.t0);
          throw _context3.t0;

        case 14:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 10]]);
};

exports.revokeAllTokens = revokeAllTokens;