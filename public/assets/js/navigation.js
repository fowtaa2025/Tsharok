/**
 * Global Navigation Component
 * Consistent navigation across all pages
 * Tsharok LMS
 */

const Navigation = {
    /**
     * Initialize navigation
     */
    init() {
        this.setupMobileMenu();
        this.setupUserMenu();
        this.setupScrollBehavior();
        this.highlightCurrentPage();
    },

    /**
     * Setup mobile menu toggle
     */
    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
                
                // Animate icon
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-bars');
                    icon.classList.toggle('fa-times');
                }
            });
            
            // Close on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    const icon = mobileMenuBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            });
            
            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    if (!mobileMenu.classList.contains('hidden')) {
                        mobileMenu.classList.add('hidden');
                        const icon = mobileMenuBtn.querySelector('i');
                        if (icon) {
                            icon.classList.remove('fa-times');
                            icon.classList.add('fa-bars');
                        }
                    }
                }
            });
        }
    },

    /**
     * Setup user menu dropdown
     */
    setupUserMenu() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userMenu = document.getElementById('userMenu');
        
        if (userMenuBtn && userMenu) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('hidden');
            });
            
            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target) && !userMenuBtn.contains(e.target)) {
                    userMenu.classList.add('hidden');
                }
            });
        }
    },

    /**
     * Setup scroll behavior
     */
    setupScrollBehavior() {
        const nav = document.querySelector('nav');
        if (!nav) return;
        
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Add shadow on scroll
            if (currentScroll > 10) {
                nav.classList.add('shadow-lg');
            } else {
                nav.classList.remove('shadow-lg');
            }
            
            // Hide/show nav on scroll (optional)
            // if (currentScroll > lastScroll && currentScroll > 100) {
            //     nav.style.transform = 'translateY(-100%)';
            // } else {
            //     nav.style.transform = 'translateY(0)';
            // }
            
            lastScroll = currentScroll;
        });
    },

    /**
     * Highlight current page in navigation
     */
    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a[href]');
        
        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (currentPath === linkPath || 
                (currentPath.endsWith('/') && linkPath === currentPath.slice(0, -1))) {
                link.classList.add('text-primary', 'font-semibold');
            }
        });
    },

    /**
     * Create navigation HTML (reusable)
     */
    createNav(options = {}) {
        const {
            fixed = true,
            showAuth = true,
            showLanguage = true,
            transparent = false
        } = options;
        
        const fixedClass = fixed ? 'fixed' : 'sticky';
        const bgClass = transparent ? 'bg-transparent' : 'bg-white';
        
        return `
            <nav class="${bgClass} shadow-md ${fixedClass} w-full top-0 z-50 transition-all duration-300">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <!-- Logo -->
                        <div class="flex items-center">
                            <a href="/index.html" class="flex items-center group">
                                <i class="fas fa-graduation-cap text-3xl text-primary mr-2 group-hover:scale-110 transition-transform"></i>
                                <span class="text-2xl font-bold text-gray-900">Tsharok</span>
                            </a>
                        </div>
                        
                        <!-- Desktop Navigation -->
                        <div class="hidden md:flex items-center space-x-6">
                            <a href="/catalog.html" class="text-gray-700 hover:text-primary transition">
                                <i class="fas fa-book mr-1"></i> Courses
                            </a>
                            <a href="/dashboard/student.html" class="text-gray-700 hover:text-primary transition">
                                <i class="fas fa-tachometer-alt mr-1"></i> Dashboard
                            </a>
                            ${showLanguage ? `
                                <button onclick="toggleLanguage()" class="text-gray-700 hover:text-primary transition">
                                    <i class="fas fa-globe mr-1"></i> العربية
                                </button>
                            ` : ''}
                            ${showAuth ? `
                                <a href="/login.html" class="text-gray-700 hover:text-primary transition">
                                    Login
                                </a>
                                <a href="/register.html" class="btn btn-primary">
                                    Get Started
                                </a>
                            ` : ''}
                        </div>
                        
                        <!-- Mobile Menu Button -->
                        <div class="md:hidden flex items-center">
                            <button id="mobileMenuBtn" class="text-gray-700 hover:text-primary transition">
                                <i class="fas fa-bars text-2xl"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile Menu -->
                <div id="mobileMenu" class="hidden md:hidden bg-white border-t border-gray-200">
                    <div class="px-4 py-3 space-y-3">
                        <a href="/catalog.html" class="block text-gray-700 hover:text-primary transition">
                            <i class="fas fa-book mr-2"></i> Courses
                        </a>
                        <a href="/dashboard/student.html" class="block text-gray-700 hover:text-primary transition">
                            <i class="fas fa-tachometer-alt mr-2"></i> Dashboard
                        </a>
                        ${showAuth ? `
                            <a href="/login.html" class="block text-gray-700 hover:text-primary transition">
                                <i class="fas fa-sign-in-alt mr-2"></i> Login
                            </a>
                            <a href="/register.html" class="block btn btn-primary w-full">
                                Get Started
                            </a>
                        ` : ''}
                    </div>
                </div>
            </nav>
        `;
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
}

