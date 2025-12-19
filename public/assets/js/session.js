// Session Management JavaScript

/**
 * Check if user is authenticated by verifying token with backend
 */
async function checkAuth() {
    try {
        // Only check sessionStorage (isolated per tab)
        const token = sessionStorage.getItem('token');
        const userStr = sessionStorage.getItem('user');

        if (!token || !userStr) {
            return { authenticated: false };
        }

        // Validate token with backend
        const response = await fetch('https://tsharok-api.fow-taa-2025.workers.dev/api/validate-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Token is invalid, clear storage
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            return { authenticated: false };
        }

        const result = await response.json();

        if (result.success && result.user) {
            // Store user data in sessionStorage (isolated per tab)
            sessionStorage.setItem('user', JSON.stringify(result.user));

            return {
                authenticated: true,
                user: result.user
            };
        }

        return { authenticated: false };


    } catch (error) {
        console.error('Auth check error:', error);

        // Fallback to sessionStorage for offline mode
        const userStr = sessionStorage.getItem('user');
        const token = sessionStorage.getItem('token');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && (user.userId || user.id)) {
                    console.log('Using sessionStorage (offline mode)');
                    return { authenticated: true, user: user };
                }
            } catch (e) {
                console.error('Error parsing sessionStorage user:', e);
            }
        }

        return { authenticated: false };
    }
}

/**
 * Logout user
 */
async function logout(redirectUrl = '/index.html') {
    // Clear session data (sessionStorage only - isolated per tab)
    sessionStorage.clear();


    // Redirect to specified URL
    if (redirectUrl) {
        window.location.href = redirectUrl;
    }

    return true;
}

/**
 * Get current user from session
 */
function getCurrentUser() {
    // Check sessionStorage first
    let userStr = sessionStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            // Continue to localStorage check
        }
    }

    // No fallback to localStorage - sessions are per-tab only
    return null;
}

/**
 * Require authentication for page
 */
async function requireAuth(allowedRoles = []) {
    const auth = await checkAuth();

    if (!auth.authenticated) {
        // Redirect to home page (with login modal)
        window.location.href = '/index.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }

    // Check role if specified
    if (allowedRoles.length > 0 && auth.user && auth.user.role) {
        if (!allowedRoles.includes(auth.user.role)) {
            const userRole = auth.user.role;
            const roleNames = {
                'student': 'Student',
                'admin': 'Administrator'
            };

            alert(`Access Denied!\n\nYou are logged in as: ${roleNames[userRole] || userRole}\nThis page requires: ${allowedRoles.map(r => roleNames[r] || r).join(' or ')}\n\nYou will be redirected to the homepage.`);

            // Redirect to appropriate dashboard based on role
            let redirectUrl = '/index.html';
            if (userRole === 'student') {
                redirectUrl = '/dashboard/student.html';
            } else if (userRole === 'admin') {
                redirectUrl = '/dashboard/admin.html';
            }

            window.location.href = redirectUrl;
            return false;
        }
    }

    // Store user data
    sessionStorage.setItem('user', JSON.stringify(auth.user));

    return true;
}

/**
 * Get user's full name with fallback
 */
function getUserFullName(user) {
    if (!user) return 'Student';
    return user.fullName || user.name || user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || 'Student';
}

/**
 * Get user's initial for avatar
 */
function getUserInitial(userName) {
    if (!userName) return 'S';
    return userName.charAt(0).toUpperCase();
}

/**
 * Create avatar HTML with user initial
 */
function createAvatarElement(userName, isCircular = true, sizeClass = 'w-10 h-10') {
    const initial = getUserInitial(userName);
    const shapeClass = isCircular ? 'rounded-full' : 'rounded-lg';
    const colors = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
    const userColor = colors[Math.abs(userName.charCodeAt(0) || 0) % colors.length];

    return `<div class="${sizeClass} ${shapeClass} ${userColor} flex items-center justify-center text-white font-bold">${initial}</div>`;
}

/**
 * Update user profile display
 */
function updateProfileDisplay(user) {
    if (!user) return;

    const fullName = getUserFullName(user);
    const initial = getUserInitial(fullName);

    // Update profile name
    const nameElements = document.querySelectorAll('[data-user-name]');
    nameElements.forEach(el => {
        el.textContent = fullName;
        el.classList.add('loaded'); // Add loaded class to trigger fade-in
    });

    // Update profile image
    const imageElements = document.querySelectorAll('[data-user-image]');
    imageElements.forEach(el => {
        if (user.profileImage) {
            el.src = user.profileImage;
        } else {
            el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff`;
        }
        el.classList.add('loaded');
    });

    // Update username
    const usernameElements = document.querySelectorAll('[data-user-username]');
    usernameElements.forEach(el => {
        el.textContent = user.username || fullName;
        el.classList.add('loaded');
    });

    // Update email
    const emailElements = document.querySelectorAll('[data-user-email]');
    emailElements.forEach(el => {
        el.textContent = user.email || '';
        el.classList.add('loaded');
    });

    // Update role
    const roleElements = document.querySelectorAll('[data-user-role]');
    roleElements.forEach(el => {
        el.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student';
        el.classList.add('loaded');
    });

    // Update avatar initials in navigation
    const profileInitial = document.getElementById('profileInitial');
    if (profileInitial) {
        profileInitial.textContent = initial;
    }

    // Update avatar button color
    const profileButton = document.getElementById('profileButton');
    if (profileButton) {
        const colors = ['bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
        const userColor = colors[Math.abs(fullName.charCodeAt(0) || 0) % colors.length];
        profileButton.className = `w-10 h-10 rounded-full ${userColor} flex items-center justify-center text-white font-bold hover:opacity-90 transition`;
    }
}


/**
 * Handle logout button clicks
 */
function setupLogoutButtons() {
    const logoutButtons = document.querySelectorAll('[data-logout], a[href*="logout"]');

    logoutButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    });
}

/**
 * Auto-logout on session expiry
 */
function setupSessionExpiry() {
    // Check session every 5 minutes
    setInterval(async () => {
        const auth = await checkAuth();

        if (!auth.authenticated) {
            alert('Your session has expired. Please login again.');
            window.location.href = '/index.html';
        }
    }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Initialize session management
 */
function initSession() {
    // Setup logout buttons
    setupLogoutButtons();

    // Setup session expiry check
    setupSessionExpiry();

    // Get and display user info
    const user = getCurrentUser();
    if (user) {
        updateProfileDisplay(user);
    }
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSession);
} else {
    initSession();
}

// Export functions for global use
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.updateProfileDisplay = updateProfileDisplay;
window.getUserFullName = getUserFullName;
window.getUserInitial = getUserInitial;
window.createAvatarElement = createAvatarElement;

