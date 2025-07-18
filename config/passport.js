import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as LocalStrategy } from 'passport-local';
import md5 from 'md5';

import User from '../models/user.model.js';

import profileHelper from '../helpers/profileHelper.js';
const { updateUserProfile, linkOAuthAccount, extractEmailFromProfile } = profileHelper;

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({
            email: email,
            deleted: false
        });

        if (!user) {
            return done(null, false, { message: 'Email không tồn tại' });
        }

        if (md5(password) !== user.password) {
            return done(null, false, { message: 'Mật khẩu không đúng' });
        }

        if (user.status === 'inactive') {
            return done(null, false, { message: 'Tài khoản đã bị khóa' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/user/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this Google ID
            let existingUser = await User.findOne({
                googleId: profile.id,
                deleted: false
            });

            if (existingUser) {
                // Chỉ cập nhật các trường thiếu từ Google profile
                const needsUpdate = updateUserProfile(existingUser, profile, 'Google');
                
                if (needsUpdate) {
                    await existingUser.save();
                }
                
                return done(null, existingUser);
            }

            // Check if user exists with the same email
            if (profile.emails && profile.emails[0]) {
                existingUser = await User.findOne({
                    email: profile.emails[0].value,
                    deleted: false
                });

                if (existingUser) {
                    // Link Google account to existing user và chỉ cập nhật thông tin thiếu
                    const needsUpdate = linkOAuthAccount(existingUser, profile, 'Google', 'googleId');
                    
                    if (needsUpdate) {
                        await existingUser.save();
                    }
                    return done(null, existingUser);
                }
            }

            // Create new user
            const newUser = new User({
                googleId: profile.id,
                fullName: profile.displayName,
                email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
                avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                status: 'active',
                deleted: false
            });

            await newUser.save();
            done(null, newUser);
        } catch (error) {
            done(error, null);
        }
    }));
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/user/auth/github/callback",
        scope: ['user:email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this GitHub ID
            let existingUser = await User.findOne({
                githubId: profile.id,
                deleted: false
            });

            if (existingUser) {
                // Chỉ cập nhật các trường thiếu từ GitHub profile
                const needsUpdate = updateUserProfile(existingUser, profile, 'GitHub');
                
                if (needsUpdate) {
                    await existingUser.save();
                }
                
                return done(null, existingUser);
            }

            // Check if user exists with the same email
            const email = extractEmailFromProfile(profile, 'GitHub');
            
            if (email) {
                existingUser = await User.findOne({
                    email: email,
                    deleted: false
                });

                if (existingUser) {
                    // Link GitHub account to existing user và chỉ cập nhật thông tin thiếu
                    const needsUpdate = linkOAuthAccount(existingUser, profile, 'GitHub', 'githubId');
                    
                    if (needsUpdate) {
                        await existingUser.save();
                    }
                    return done(null, existingUser);
                }
            }

            // Create new user
            const newUser = new User({
                githubId: profile.id,
                fullName: profile.displayName || profile.username,
                email: email, // email đã được extract bằng helper function
                avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                status: 'active',
                deleted: false
            });

            await newUser.save();
            done(null, newUser);
        } catch (error) {
            done(error, null);
        }
    }));
}

export default passport;
