/**
 * Page Transitions & Loading States
 * Smooth page transitions and loading indicators
 * Tsharok LMS
 */

const PageTransitions = {
    /**
     * Initialize page transitions
     */
    init() {
        this.setupPageLoad();
        this.setupLinkTransitions();
        this.setupFormSubmissions();
    },

    /**
     * Setup page load animation
     */
    setupPageLoad() {
        // Add fade-in animation to body
        document.body.classList.add('page-fade-in');
        
        // Hide loading overlay if exists
        window.addEventListener('load', () => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                setTimeout(() => {
                    loadingOverlay.classList.add('hidden');
                }, 300);
            }
        });
    },

    /**
     * Setup smooth link transitions
     */
    setupLinkTransitions() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL without triggering navigation
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            });
        });
        
        // Add loading state to external page links
        document.querySelectorAll('a:not([href^="#"]):not([target="_blank"])').forEach(link => {
            if (link.hostname === window.location.hostname) {
                link.addEventListener('click', function(e) {
                    // Don't interfere with modified clicks
                    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                    
                    // Show loading indicator
                    const loadingIndicator = document.createElement('div');
                    loadingIndicator.className = 'fixed top-0 left-0 right-0 h-1 bg-primary progress-bar z-50';
                    document.body.appendChild(loadingIndicator);
                });
            }
        });
    },

    /**
     * Setup form submission loading states
     */
    setupFormSubmissions() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    // Add loading state
                    PageTransitions.setButtonLoading(submitBtn, true);
                    
                    // Auto-remove after timeout (safety measure)
                    setTimeout(() => {
                        PageTransitions.setButtonLoading(submitBtn, false);
                    }, 10000);
                }
            });
        });
    },

    /**
     * Set button loading state
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `
                <span class="spinner mr-2"></span>
                <span>Processing...</span>
            `;
            button.classList.add('opacity-75');
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
            button.classList.remove('opacity-75');
        }
    },

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        if (typeof UIComponents !== 'undefined') {
            UIComponents.showLoading(message);
        } else {
            // Fallback if UIComponents not loaded
            const overlay = document.createElement('div');
            overlay.id = 'tempLoadingOverlay';
            overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            overlay.innerHTML = `
                <div class="bg-white rounded-2xl p-8 shadow-2xl text-center">
                    <div class="spinner-large mb-4 mx-auto"></div>
                    <p class="text-gray-700 font-semibold">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (typeof UIComponents !== 'undefined') {
            UIComponents.hideLoading();
        } else {
            const overlay = document.getElementById('tempLoadingOverlay');
            if (overlay) {
                overlay.remove();
            }
        }
    },

    /**
     * Animate element on scroll
     */
    animateOnScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observe elements with data-animate attribute
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    },

    /**
     * Show page loading bar
     */
    showLoadingBar() {
        const existingBar = document.getElementById('pageLoadingBar');
        if (existingBar) existingBar.remove();
        
        const bar = document.createElement('div');
        bar.id = 'pageLoadingBar';
        bar.className = 'fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 z-50';
        bar.style.animation = 'progressBar 2s ease-in-out infinite';
        document.body.appendChild(bar);
    },

    /**
     * Hide page loading bar
     */
    hideLoadingBar() {
        const bar = document.getElementById('pageLoadingBar');
        if (bar) {
            bar.style.transition = 'opacity 0.3s ease';
            bar.style.opacity = '0';
            setTimeout(() => bar.remove(), 300);
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    PageTransitions.init();
    PageTransitions.animateOnScroll();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageTransitions;
}

// Global helper functions
function showPageLoading(message) {
    return PageTransitions.showLoading(message);
}

function hidePageLoading() {
    return PageTransitions.hideLoading();
}

function setButtonLoading(button, isLoading) {
    return PageTransitions.setButtonLoading(button, isLoading);
}

