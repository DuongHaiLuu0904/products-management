// Helper function to safely extract email from OAuth profile
const extractEmailFromProfile = (profile, provider) => {
    let email = null;
    
    if (provider === 'GitHub') {
        // GitHub có thể trả email theo nhiều cách
        if (profile.emails && Array.isArray(profile.emails) && profile.emails.length > 0) {
            // Tìm email primary trước
            const primaryEmail = profile.emails.find(emailObj => emailObj.primary === true);
            if (primaryEmail && primaryEmail.value) {
                email = primaryEmail.value;
            } else {
                // Nếu không có primary, lấy email đầu tiên
                email = profile.emails[0].value;
            }
        }
        
        // Backup: kiểm tra trường email trực tiếp
        if (!email && profile.email) {
            email = profile.email;
        }
        
        // GitHub có thể có _json.email
        if (!email && profile._json && profile._json.email) {
            email = profile._json.email;
        }
    } else if (provider === 'Google') {
        // Google thường trả email trong emails array
        if (profile.emails && Array.isArray(profile.emails) && profile.emails.length > 0) {
            email = profile.emails[0].value;
        }
    }
    
    return email;
};

// Helper function to safely update user profile - chỉ cập nhật các trường trống
const updateUserProfile = (existingUser, profile, provider) => {
    let needsUpdate = false;
    
    // Update fullName - chỉ nếu chưa có hoặc trống
    const displayName = profile.displayName || profile.username;
    if (displayName && (!existingUser.fullName || existingUser.fullName.trim() === '')) {
        existingUser.fullName = displayName;
        needsUpdate = true;
    }
    
    // Update avatar - chỉ nếu chưa có hoặc trống
    if (profile.photos && profile.photos[0]) {
        const newAvatar = profile.photos[0].value;
        if (!existingUser.avatar || existingUser.avatar.trim() === '') {
            existingUser.avatar = newAvatar;
            needsUpdate = true;
        }
    }
    
    // Update email - sử dụng helper function để extract email
    const email = extractEmailFromProfile(profile, provider);
    if (email && (!existingUser.email || existingUser.email.trim() === '')) {
        existingUser.email = email;
        needsUpdate = true;
    }
    
    return needsUpdate;
};

// Helper function để link OAuth account và cập nhật thông tin thiếu
const linkOAuthAccount = (existingUser, profile, provider, oauthIdField) => {
    let needsUpdate = false;
    
    // Set OAuth ID
    if (!existingUser[oauthIdField]) {
        existingUser[oauthIdField] = profile.id;
        needsUpdate = true;
    }
    
    // Cập nhật các trường thiếu từ OAuth profile
    const profileUpdated = updateUserProfile(existingUser, profile, provider);
    
    return needsUpdate || profileUpdated;
};

export default { updateUserProfile, linkOAuthAccount, extractEmailFromProfile };
