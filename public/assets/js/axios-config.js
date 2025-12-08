/**
 * Axios Configuration & Interceptors
 * Tsharok LMS
 */

// Create axios instance with custom config
const axiosInstance = axios.create({
    baseURL: '/api',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true // Include cookies for session management
});

// Request Interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Add timestamp to prevent caching
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            };
        }

        // Log request in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🚀 Request:', {
                method: config.method.toUpperCase(),
                url: config.url,
                params: config.params,
                data: config.data
            });
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // Log response in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('✅ Response:', {
                url: response.config.url,
                status: response.status,
                data: response.data
            });
        }

        // Return the data directly if it's a success response
        if (response.data && response.data.success) {
            return response.data;
        }

        return response.data;
    },
    (error) => {
        // Handle different error types
        let errorMessage = 'An unexpected error occurred';
        let errorDetails = {};

        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const data = error.response.data;

            errorDetails = {
                status,
                statusText: error.response.statusText,
                data
            };

            switch (status) {
                case 400:
                    errorMessage = data.message || 'Bad request. Please check your input.';
                    break;
                case 401:
                    errorMessage = 'Unauthorized. Please login to continue.';
                    // Redirect to login if needed
                    if (window.location.pathname !== '/login.html' && 
                        window.location.pathname !== '/register.html') {
                        setTimeout(() => {
                            window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
                        }, 2000);
                    }
                    break;
                case 403:
                    errorMessage = 'Access denied. You don\'t have permission.';
                    break;
                case 404:
                    errorMessage = 'Resource not found.';
                    break;
                case 422:
                    errorMessage = data.message || 'Validation failed.';
                    if (data.errors) {
                        errorDetails.validationErrors = data.errors;
                    }
                    break;
                case 429:
                    errorMessage = 'Too many requests. Please try again later.';
                    break;
                case 500:
                    errorMessage = 'Server error. Please try again later.';
                    break;
                case 503:
                    errorMessage = 'Service unavailable. Please try again later.';
                    break;
                default:
                    errorMessage = data.message || `Error: ${status}`;
            }

            console.error('❌ Response Error:', {
                message: errorMessage,
                ...errorDetails
            });

        } else if (error.request) {
            // Request was made but no response received
            errorMessage = 'No response from server. Please check your connection.';
            console.error('❌ Network Error:', error.request);
            
        } else {
            // Error in request configuration
            errorMessage = error.message || 'Failed to make request';
            console.error('❌ Request Setup Error:', error.message);
        }

        // Create custom error object
        const customError = new Error(errorMessage);
        customError.details = errorDetails;
        customError.originalError = error;

        return Promise.reject(customError);
    }
);

// Export the configured instance
window.axiosInstance = axiosInstance;

// Helper function for showing loading states
window.setLoading = function(elementId, isLoading, loadingText = 'Loading...') {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (isLoading) {
        element.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-4"></i>
                <p class="text-gray-600">${loadingText}</p>
            </div>
        `;
    }
};

// Helper function for showing error messages
window.showError = function(elementId, message, retryCallback = null) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Error element not found:', elementId);
        alert(message);
        return;
    }

    const retryButton = retryCallback ? `
        <button 
            onclick="(${retryCallback.toString()})()"
            class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
            <i class="fas fa-redo mr-2"></i>Try Again
        </button>
    ` : '';

    element.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-3"></i>
            <h3 class="text-lg font-semibold text-red-900 mb-2">Error</h3>
            <p class="text-red-700">${message}</p>
            ${retryButton}
        </div>
    `;
};

// Helper function for showing success messages
window.showMessage = function(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    notification.className = `fixed top-4 right-4 ${colors[type] || colors.info} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 animate-slide-in`;
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info} text-xl"></i>
        <span class="font-medium">${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-4 hover:bg-white hover:bg-opacity-20 rounded p-1">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
};

// Add animation styles
if (!document.getElementById('axios-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'axios-notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .animate-slide-in {
            animation: slideIn 0.3s ease-out;
            transition: all 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
}

console.log('✨ Axios configuration loaded successfully');

