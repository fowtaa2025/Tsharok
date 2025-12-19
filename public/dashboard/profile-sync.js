// Profile Data Sync System
// This file ensures profile data (name, picture) stays synchronized across all pages

// Update profile display on all pages
function updateProfileDisplay(user) {
    if (!user) return;

    // Update all elements with data-user-name attribute
    const nameElements = document.querySelectorAll('[data-user-name]');
    nameElements.forEach(el => {
        el.textContent = user.fullName || user.name || 'Student';
    });

    // Update all elements with data-user-email attribute
    const emailElements = document.querySelectorAll('[data-user-email]');
    emailElements.forEach(el => {
        el.textContent = user.email || '';
    });

    // Update all elements with data-user-role attribute
    const roleElements = document.querySelectorAll('[data-user-role]');
    roleElements.forEach(el => {
        el.textContent = user.role || 'Student';
    });

    // Update profile initials
    const initial = (user.fullName || user.name || 'S').charAt(0).toUpperCase();
    const profileInitials = document.querySelectorAll('#profileInitial, [data-profile-initial]');
    profileInitials.forEach(el => {
        el.textContent = initial;
    });

    // Update profile pictures
    if (user.profilePicture) {
        const profileImages = document.querySelectorAll('#profileImageDisplay, [data-profile-image]');
        profileImages.forEach(el => {
            el.innerHTML = `<img src="${user.profilePicture}" class="w-full h-full object-cover rounded-full">`;
        });
    }
}

// Save profile data to sessionStorage (isolated per tab)
function saveProfileData(userData) {
    const user = getCurrentUser();
    if (user) {
        // Merge new data with existing user data
        const updatedUser = { ...user, ...userData };

        // Ensure firstName and lastName are present for fullName construction
        const firstName = userData.firstName || updatedUser.firstName || '';
        const lastName = userData.lastName || updatedUser.lastName || '';

        updatedUser.firstName = firstName;
        updatedUser.lastName = lastName;
        updatedUser.fullName = `${firstName} ${lastName}`.trim(); // Trim to handle cases where one is empty

        // Update sessionStorage (isolated per tab)
        sessionStorage.setItem('user', JSON.stringify(updatedUser));

        // No cross-tab events - each tab is independent

        return updatedUser;
    }
    return null;
}

// Get current user from sessionStorage (isolated per tab)
function getCurrentUser() {
    try {
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            return JSON.parse(sessionUser);
        }
    } catch (error) {
        console.error('Error getting user data:', error);
    }
    return null;
}

// Storage event listener removed - sessions are now isolated per tab
// Each tab maintains its own session without cross-tab synchronization


// Listen for custom profile update event
window.addEventListener('profileUpdated', function () {
    const user = getCurrentUser();
    if (user) {
        updateProfileDisplay(user);
    }
});

// Initialize profile display on page load
document.addEventListener('DOMContentLoaded', function () {
    const user = getCurrentUser();
    if (user) {
        updateProfileDisplay(user);
    }
});
