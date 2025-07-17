import User from '../models/user.model.js';
import Account from '../models/account.model.js';

export const cleanupExpiredTokens = async () => {
    try {
        const now = new Date();

        const userResult = await User.updateMany(
            {
                refreshTokenExpires: { $lt: now },
                refreshToken: { $ne: null }
            },
            {
                $unset: {
                    refreshToken: 1,
                    refreshTokenExpires: 1
                }
            }
        );
        
        // Clean expired refresh tokens from Account collection
        const accountResult = await Account.updateMany(
            {
                refreshTokenExpires: { $lt: now },
                refreshToken: { $ne: null }
            },
            {
                $unset: {
                    refreshToken: 1,
                    refreshTokenExpires: 1
                }
            }
        );
        
        return {
            userTokensCleared: userResult.modifiedCount,
            accountTokensCleared: accountResult.modifiedCount
        };
    } catch (error) {
        console.error('Error cleaning up expired tokens:', error);
        throw error;
    }
};

export const revokeUserTokens = async (userId, userType = 'user') => {
    try {
        const Model = userType === 'user' ? User : Account;
        
        const result = await Model.updateOne(
            { _id: userId },
            {
                $unset: {
                    refreshToken: 1,
                    refreshTokenExpires: 1
                }
            }
        );
        
        return result.modifiedCount > 0;
    } catch (error) {
        console.error('Error revoking user tokens:', error);
        throw error;
    }
};

export const revokeAllTokens = async () => {
    try {
        const userResult = await User.updateMany(
            { refreshToken: { $ne: null } },
            {
                $unset: {
                    refreshToken: 1,
                    refreshTokenExpires: 1
                }
            }
        );
        
        const accountResult = await Account.updateMany(
            { refreshToken: { $ne: null } },
            {
                $unset: {
                    refreshToken: 1,
                    refreshTokenExpires: 1
                }
            }
        );
        
        return {
            userTokensRevoked: userResult.modifiedCount,
            accountTokensRevoked: accountResult.modifiedCount
        };
    } catch (error) {
        console.error('Error revoking all tokens:', error);
        throw error;
    }
};
