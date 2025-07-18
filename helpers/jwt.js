import pkg from 'jsonwebtoken';
const { sign, verify, decode } = pkg;
import { randomUUID } from 'crypto';

// JWT Secret keys (nên đặt trong .env file)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key';

// Token expiration times
const ACCESS_TOKEN_EXPIRES = '15m'; // 15 phút
const REFRESH_TOKEN_EXPIRES = '7d';  // 7 ngày

export {
    ACCESS_TOKEN_EXPIRES,
    REFRESH_TOKEN_EXPIRES
};

// Tạo access token
export const generateAccessToken = (payload, userType = 'user') => {
    const tokenPayload = {
        ...payload,
        userType,
        type: 'access'
    };
    
    return sign(tokenPayload, ACCESS_TOKEN_SECRET, { 
        expiresIn: ACCESS_TOKEN_EXPIRES 
    });
};

// Tạo refresh token
export const generateRefreshToken = (payload, userType = 'user') => {
    const tokenPayload = {
        ...payload,
        userType,
        type: 'refresh',
        jti: randomUUID() // JWT ID để có thể revoke token
    };
    
    return sign(tokenPayload, REFRESH_TOKEN_SECRET, { 
        expiresIn: REFRESH_TOKEN_EXPIRES 
    });
};

// Xác thực access token với xử lý lỗi chi tiết
export const verifyAccessToken = (token) => {
    try {
        const decoded = verify(token, ACCESS_TOKEN_SECRET);
        if (decoded.type !== 'access') {
            return null;
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('Access token expired');
            return null;
        }
        if (error.name === 'JsonWebTokenError') {
            console.log('Invalid access token');
            return null;
        }
        console.error('Access token verification error:', error);
        return null;
    }
};

// Xác thực refresh token với xử lý lỗi chi tiết
export const verifyRefreshToken = (token) => {
    try {
        const decoded = verify(token, REFRESH_TOKEN_SECRET);
        if (decoded.type !== 'refresh') {
            return null;
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('Refresh token expired');
            return null;
        }
        if (error.name === 'JsonWebTokenError') {
            console.log('Invalid refresh token');
            return null;
        }
        console.error('Refresh token verification error:', error);
        return null;
    }
};

// Kiểm tra token có sắp hết hạn không (trong 5 phút tới)
export const isTokenExpiringSoon = (token) => {
    try {
        const decoded = decode(token);
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        // Nếu token hết hạn trong 5 phút tới
        return timeUntilExpiry < 5 * 60 * 1000;
    } catch (error) {
        return true;
    }
};

// Tạo cặp access token và refresh token
export const generateTokenPair = (user, userType = 'user') => {
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
export const getRefreshTokenExpiry = (token) => {
    try {
        const decoded = decode(token);
        return new Date(decoded.exp * 1000);
    } catch (error) {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày từ bây giờ
    }
};