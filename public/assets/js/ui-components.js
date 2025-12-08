/**
 * Reusable UI Components
 * Tsharok LMS - Consistent UI elements across all pages
 */

const UIComponents = {
    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay') || this.createLoadingOverlay();
        const messageEl = overlay.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        overlay.classList.remove('hidden');
        overlay.classList.add('fade-in');
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    },

    /**
     * Create loading overlay
     */
    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl p-8 shadow-2xl text-center scale-in">
                <div class="spinner-large mb-4"></div>
                <p class="loading-message text-gray-700 font-semibold">Loading...</p>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        return toast;
    },

    /**
     * Create toast element
     */
    createToast(message, type) {
        const icons = {
            success: '<i class="fas fa-check-circle text-2xl"></i>',
            error: '<i class="fas fa-exclamation-circle text-2xl"></i>',
            warning: '<i class="fas fa-exclamation-triangle text-2xl"></i>',
            info: '<i class="fas fa-info-circle text-2xl"></i>'
        };
        
        const colors = {
            success: 'border-green-500 text-green-700',
            error: 'border-red-500 text-red-700',
            warning: 'border-yellow-500 text-yellow-700',
            info: 'border-blue-500 text-blue-700'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 border-l-4 ${colors[type]} max-w-sm transform translate-x-96 transition-transform duration-300 z-50`;
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">${icons[type]}</div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add show class styles
        const style = document.createElement('style');
        style.textContent = `.toast.show { transform: translateX(0); }`;
        if (!document.querySelector('style[data-toast]')) {
            style.setAttribute('data-toast', 'true');
            document.head.appendChild(style);
        }
        
        return toast;
    },

    /**
     * Show modal
     */
    showModal(title, content, options = {}) {
        const modal = this.createModal(title, content, options);
        document.body.appendChild(modal);
        
        // Trigger animation
        setTimeout(() => modal.classList.remove('hidden'), 10);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
        
        return modal;
    },

    /**
     * Create modal element
     */
    createModal(title, content, options = {}) {
        const {
            size = 'md',
            showClose = true,
            buttons = []
        } = options;
        
        const sizes = {
            sm: 'max-w-md',
            md: 'max-w-2xl',
            lg: 'max-w-4xl',
            xl: 'max-w-6xl',
            full: 'max-w-full mx-4'
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const buttonsHTML = buttons.map(btn => `
            <button 
                onclick="${btn.onclick}" 
                class="btn ${btn.class || 'btn-primary'}"
                ${btn.disabled ? 'disabled' : ''}
            >
                ${btn.text}
            </button>
        `).join('');
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden scale-in">
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-900">${title}</h3>
                    ${showClose ? `
                        <button onclick="this.closest('.modal-backdrop').remove()" class="text-gray-400 hover:text-gray-600 transition">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    ${content}
                </div>
                ${buttonsHTML ? `
                    <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                        ${buttonsHTML}
                    </div>
                ` : ''}
            </div>
        `;
        
        return modal;
    },

    /**
     * Close modal
     */
    closeModal(modal) {
        modal.classList.add('hidden');
        setTimeout(() => modal.remove(), 300);
    },

    /**
     * Show confirmation dialog
     */
    confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.showModal(title, `<p class="text-gray-600">${message}</p>`, {
                buttons: [
                    {
                        text: options.cancelText || 'Cancel',
                        class: 'btn-secondary',
                        onclick: `this.closest('.modal-backdrop').remove(); window.confirmResult = false;`
                    },
                    {
                        text: options.confirmText || 'Confirm',
                        class: options.danger ? 'btn-danger' : 'btn-primary',
                        onclick: `this.closest('.modal-backdrop').remove(); window.confirmResult = true;`
                    }
                ]
            });
            
            // Wait for user action
            const checkResult = setInterval(() => {
                if (!document.body.contains(modal)) {
                    clearInterval(checkResult);
                    resolve(window.confirmResult === true);
                    window.confirmResult = undefined;
                }
            }, 100);
        });
    },

    /**
     * Create skeleton loader
     */
    createSkeleton(type = 'text', count = 1) {
        const skeletons = {
            text: '<div class="skeleton h-4 w-full mb-2"></div>',
            heading: '<div class="skeleton h-8 w-3/4 mb-4"></div>',
            card: `
                <div class="card">
                    <div class="card-body">
                        <div class="skeleton h-8 w-3/4 mb-4"></div>
                        <div class="skeleton h-4 w-full mb-2"></div>
                        <div class="skeleton h-4 w-full mb-2"></div>
                        <div class="skeleton h-4 w-2/3"></div>
                    </div>
                </div>
            `,
            avatar: '<div class="skeleton h-12 w-12 rounded-full"></div>',
            image: '<div class="skeleton h-48 w-full"></div>'
        };
        
        return skeletons[type].repeat(count);
    },

    /**
     * Create pagination
     */
    createPagination(currentPage, totalPages, onChange) {
        const pagination = document.createElement('div');
        pagination.className = 'flex items-center justify-center gap-2 mt-8';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = `btn btn-secondary ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left mr-2"></i>Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => onChange(currentPage - 1);
        pagination.appendChild(prevBtn);
        
        // Page numbers
        const pageNumbers = this.getPageNumbers(currentPage, totalPages);
        pageNumbers.forEach(page => {
            if (page === '...') {
                const span = document.createElement('span');
                span.className = 'px-2 text-gray-500';
                span.textContent = '...';
                pagination.appendChild(span);
            } else {
                const btn = document.createElement('button');
                btn.className = `px-4 py-2 border rounded-lg ${
                    page === currentPage
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 hover:bg-gray-50'
                }`;
                btn.textContent = page;
                btn.onclick = () => onChange(page);
                pagination.appendChild(btn);
            }
        });
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = `btn btn-secondary ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
        nextBtn.innerHTML = 'Next<i class="fas fa-chevron-right ml-2"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => onChange(currentPage + 1);
        pagination.appendChild(nextBtn);
        
        return pagination;
    },

    /**
     * Get page numbers for pagination
     */
    getPageNumbers(current, total) {
        const pages = [];
        const maxVisible = 7;
        
        if (total <= maxVisible) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            if (current <= 3) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(total);
            } else if (current >= total - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = total - 4; i <= total; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = current - 1; i <= current + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(total);
            }
        }
        
        return pages;
    },

    /**
     * Create breadcrumb
     */
    createBreadcrumb(items) {
        const breadcrumb = document.createElement('nav');
        breadcrumb.className = 'flex items-center space-x-2 text-sm text-gray-600 mb-6';
        
        items.forEach((item, index) => {
            if (index > 0) {
                const separator = document.createElement('span');
                separator.innerHTML = '<i class="fas fa-chevron-right text-xs"></i>';
                breadcrumb.appendChild(separator);
            }
            
            if (item.href) {
                const link = document.createElement('a');
                link.href = item.href;
                link.className = 'hover:text-indigo-600 transition';
                link.textContent = item.text;
                breadcrumb.appendChild(link);
            } else {
                const span = document.createElement('span');
                span.className = 'text-gray-900 font-semibold';
                span.textContent = item.text;
                breadcrumb.appendChild(span);
            }
        });
        
        return breadcrumb;
    },

    /**
     * Create empty state
     */
    createEmptyState(icon, title, message, action = null) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center py-12 px-4';
        
        let actionHTML = '';
        if (action) {
            actionHTML = `
                <button onclick="${action.onclick}" class="btn btn-primary mt-6">
                    ${action.icon ? `<i class="${action.icon} mr-2"></i>` : ''}
                    ${action.text}
                </button>
            `;
        }
        
        emptyState.innerHTML = `
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <i class="${icon} text-4xl text-gray-400"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">${title}</h3>
            <p class="text-gray-600 max-w-md mx-auto">${message}</p>
            ${actionHTML}
        `;
        
        return emptyState;
    },

    /**
     * Format relative time
     */
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
        if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
        return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
}

// Global helper functions
function showToast(message, type = 'info') {
    return UIComponents.showToast(message, type);
}

function showLoading(message) {
    return UIComponents.showLoading(message);
}

function hideLoading() {
    return UIComponents.hideLoading();
}

function showModal(title, content, options) {
    return UIComponents.showModal(title, content, options);
}

function confirmAction(title, message, options) {
    return UIComponents.confirm(title, message, options);
}

