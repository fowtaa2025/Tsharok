// Session Management JavaScript

/**
 * Check if user is authenticated
 */
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth.php', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success && result.data.authenticated) {
            return {
                authenticated: true,
                user: result.data.user
            };
        }

        return { authenticated: false };

    } catch (error) {
        console.error('Auth check error:', error);

        // Fallback to localStorage for client-side testing
        const localUser = localStorage.getItem('user');
        if (localUser) {
            try {
                const user = JSON.parse(localUser);
                if (user && user.id) {
                    console.log('Using localStorage user for testing');
                    // Also store in sessionStorage for this session
                    sessionStorage.setItem('user', localUser);
                    return { authenticated: true, user: user };
                }
            } catch (e) {
                console.error('Error parsing localStorage user:', e);
            }
        }

        return { authenticated: false };
    }
}

/**
 * Logout user
 */
async function logout(redirectUrl = '/index.html') {
    try {
        const response = await fetch('/api/logout.php', {
            method: 'POST',
            credentials: 'include'
        });

        const result = await response.json();

        // Clear session storage
        sessionStorage.clear();
        localStorage.removeItem('user');

        // Redirect to specified URL
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }

        return result.success;

    } catch (error) {
        console.error('Logout error:', error);
        // Clear local data even on error
        sessionStorage.clear();
        localStorage.removeItem('user');

        // Force redirect even on error
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
        return false;
    }
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

    // Fallback to localStorage for client-side testing
    userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
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
 * Update user profile display
 */
function updateProfileDisplay(user) {
    if (!user) return;

    // Update profile name
    const nameElements = document.querySelectorAll('[data-user-name]');
    nameElements.forEach(el => {
        el.textContent = user.fullName || `${user.firstName} ${user.lastName}`;
        el.classList.add('loaded'); // Add loaded class to trigger fade-in
    });

    // Update profile image
    const imageElements = document.querySelectorAll('[data-user-image]');
    imageElements.forEach(el => {
        if (user.profileImage) {
            el.src = user.profileImage;
        } else {
            el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=4F46E5&color=fff`;
        }
        el.classList.add('loaded');
    });

    // Update username
    const usernameElements = document.querySelectorAll('[data-user-username]');
    usernameElements.forEach(el => {
        el.textContent = user.username;
        el.classList.add('loaded');
    });

    // Update role
    const roleElements = document.querySelectorAll('[data-user-role]');
    roleElements.forEach(el => {
        el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        el.classList.add('loaded');
    });
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
