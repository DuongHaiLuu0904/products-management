const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Secret keys (nên đặt trong .env file)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key';

// Token expiration times
const ACCESS_TOKEN_EXPIRES = '15m'; // 15 phút
const REFRESH_TOKEN_EXPIRES = '7d';  // 7 ngày

// Tạo access token
const generateAccessToken = (payload, userType = 'user') => {
    const tokenPayload = {
        ...payload,
        userType,
        type: 'access'
    };
    
    return jwt.sign(tokenPayload, ACCESS_TOKEN_SECRET, { 
        expiresIn: ACCESS_TOKEN_EXPIRES 
    });
};

// Tạo refresh token
const generateRefreshToken = (payload, userType = 'user') => {
    const tokenPayload = {
        ...payload,
        userType,
        type: 'refresh',
        jti: crypto.randomUUID() // JWT ID để có thể revoke token
    };
    
    return jwt.sign(tokenPayload, REFRESH_TOKEN_SECRET, { 
        expiresIn: REFRESH_TOKEN_EXPIRES 
    });
};

// Xác thực access token
const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        if (decoded.type !== 'access') {
            return null;
        }
        return decoded;
    } catch (error) {
        return null;
    }
};

// Xác thực refresh token
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
        if (decoded.type !== 'refresh') {
            return null;
        }
        return decoded;
    } catch (error) {
        return null;
    }
};

// Tạo cặp access token và refresh token
const generateTokenPair = (user, userType = 'user') => {
    const payload = {
        id: user._id || user.id,
        email: user.email,
        fullName: user.fullName
    };

    const accessToken = generateAccessToken(payload, userType);
    const refreshToken = generateRefreshToken(payload, userType);

    return {
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 phút tính bằng giây
        refreshExpiresIn: 7 * 24 * 60 * 60 // 7 ngày tính bằng giây
    };
};

// Lấy thời gian hết hạn của refresh token
const getRefreshTokenExpiry = (token) => {
    try {
        const decoded = jwt.decode(token);
        return new Date(decoded.exp * 1000);
    } catch (error) {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày từ bây giờ
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokenPair,
    getRefreshTokenExpiry,
    ACCESS_TOKEN_EXPIRES,
    REFRESH_TOKEN_EXPIRES
};
