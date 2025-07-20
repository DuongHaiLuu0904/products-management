"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRefreshTokenExpiry = exports.generateTokenPair = exports.isTokenExpiringSoon = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = exports.REFRESH_TOKEN_EXPIRES = exports.ACCESS_TOKEN_EXPIRES = void 0;

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));

var _crypto = require("crypto");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var sign = _jsonwebtoken["default"].sign,
    verify = _jsonwebtoken["default"].verify,
    decode = _jsonwebtoken["default"].decode;
// JWT Secret keys (nên đặt trong .env file)
var ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key';
var REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key'; // Token expiration times

var ACCESS_TOKEN_EXPIRES = '15m'; // 15 phút

exports.ACCESS_TOKEN_EXPIRES = ACCESS_TOKEN_EXPIRES;
var REFRESH_TOKEN_EXPIRES = '7d'; // 7 ngày

exports.REFRESH_TOKEN_EXPIRES = REFRESH_TOKEN_EXPIRES;

// Tạo access token
var generateAccessToken = function generateAccessToken(payload) {
  var userType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'user';

  var tokenPayload = _objectSpread({}, payload, {
    userType: userType,
    type: 'access'
  });

  return sign(tokenPayload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES
  });
}; // Tạo refresh token


exports.generateAccessToken = generateAccessToken;

var generateRefreshToken = function generateRefreshToken(payload) {
  var userType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'user';

  var tokenPayload = _objectSpread({}, payload, {
    userType: userType,
    type: 'refresh',
    jti: (0, _crypto.randomUUID)() // JWT ID để có thể revoke token

  });

  return sign(tokenPayload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES
  });
}; // Xác thực access token với xử lý lỗi chi tiết


exports.generateRefreshToken = generateRefreshToken;

var verifyAccessToken = function verifyAccessToken(token) {
  try {
    var decoded = verify(token, ACCESS_TOKEN_SECRET);

    if (decoded.type !== 'access') {
      return null;
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Không log token expired vì đây là flow bình thường
      return null;
    }

    if (error.name === 'JsonWebTokenError') {
      // Không log invalid token vì có thể do user chưa đăng nhập
      return null;
    }

    console.error('Access token verification error:', error);
    return null;
  }
}; // Xác thực refresh token với xử lý lỗi chi tiết


exports.verifyAccessToken = verifyAccessToken;

var verifyRefreshToken = function verifyRefreshToken(token) {
  try {
    var decoded = verify(token, REFRESH_TOKEN_SECRET);

    if (decoded.type !== 'refresh') {
      return null;
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Không log token expired vì đây là flow bình thường
      return null;
    }

    if (error.name === 'JsonWebTokenError') {
      // Không log invalid token vì có thể do user chưa đăng nhập  
      return null;
    }

    console.error('Refresh token verification error:', error);
    return null;
  }
}; // Kiểm tra token có sắp hết hạn không (trong 5 phút tới)


exports.verifyRefreshToken = verifyRefreshToken;

var isTokenExpiringSoon = function isTokenExpiringSoon(token) {
  try {
    var decoded = decode(token);
    var expirationTime = decoded.exp * 1000;
    var currentTime = Date.now();
    var timeUntilExpiry = expirationTime - currentTime; // Nếu token hết hạn trong 5 phút tới

    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (error) {
    return true;
  }
}; // Tạo cặp access token và refresh token


exports.isTokenExpiringSoon = isTokenExpiringSoon;

var generateTokenPair = function generateTokenPair(user) {
  var userType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'user';
  var payload = {
    id: user._id || user.id,
    email: user.email,
    fullName: user.fullName
  };
  var accessToken = generateAccessToken(payload, userType);
  var refreshToken = generateRefreshToken(payload, userType);
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    expiresIn: 15 * 60,
    // 15 phút tính bằng giây
    refreshExpiresIn: 7 * 24 * 60 * 60 // 7 ngày tính bằng giây

  };
}; // Lấy thời gian hết hạn của refresh token


exports.generateTokenPair = generateTokenPair;

var getRefreshTokenExpiry = function getRefreshTokenExpiry(token) {
  try {
    var decoded = decode(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày từ bây giờ
  }
};

exports.getRefreshTokenExpiry = getRefreshTokenExpiry;