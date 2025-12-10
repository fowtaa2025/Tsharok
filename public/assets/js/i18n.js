/**
 * Internationalization (i18n) Module
 * Supports English and Arabic with RTL layout
 * Tsharok LMS
 */

const translations = {
    en: {
        // Navigation
        nav: {
            home: 'Home',
            features: 'Features',
            courses: 'Courses',
            about: 'About',
            login: 'Login',
            signup: 'Sign Up',
            register: 'Register',
            logout: 'Logout',
            dashboard: 'Dashboard',
            search: 'Search'
        },

        // Homepage
        home: {
            hero_title: 'Transform Your Learning Journey with',
            hero_description: 'Access world-class courses, learn from expert instructors, and achieve your academic goals with our comprehensive learning management system.',
            search_placeholder: 'Search for courses, topics, or skills...',
            start_learning: 'Start Learning Now',
            browse_courses: 'Browse All Courses',
            students: 'Students',
            courses: 'Courses',
            instructors: 'Instructors',
            success_rate: 'Success Rate'
        },

        // Search
        search: {
            title: 'Search Results',
            search_for: 'Search results for',
            all_courses: 'All Courses',
            found: 'courses found',
            course: 'course',
            no_results: 'No courses found',
            try_adjusting: 'Try adjusting your search or filters',
            clear_filters: 'Clear Filters',
            filters: 'Filters',
            clear_all: 'Clear All',
            apply_filters: 'Apply Filters',
            sort_by: 'Sort by',
            active_filters: 'Active Filters',
            search_placeholder: 'Search for courses...'
        },

        // Filters
        filters: {
            category: 'Category',
            all_categories: 'All Categories',
            level: 'Level',
            all_levels: 'All Levels',
            beginner: 'Beginner',
            intermediate: 'Intermediate',
            advanced: 'Advanced',
            rating: 'Minimum Rating',
            all_ratings: 'All Ratings',
            semester: 'Semester',
            all_semesters: 'All Semesters'
        },

        // Sorting
        sort: {
            relevance: 'Relevance',
            newest: 'Newest First',
            oldest: 'Oldest First',
            title_asc: 'Title (A-Z)',
            title_desc: 'Title (Z-A)',
            rating_high: 'Highest Rated',
            rating_low: 'Lowest Rated',
            popular: 'Most Popular',
            duration_short: 'Shortest Duration',
            duration_long: 'Longest Duration'
        },

        // Course Card
        course: {
            students: 'students',
            weeks: 'weeks',
            relevance: 'Relevance',
            enroll: 'Enroll Now',
            view_details: 'View Details',
            rating: 'Rating',
            no_ratings: 'No ratings yet'
        },

        // Pagination
        pagination: {
            previous: 'Previous',
            next: 'Next',
            page: 'Page'
        },

        // Auth
        auth: {
            email: 'Email',
            password: 'Password',
            remember_me: 'Remember Me',
            forgot_password: 'Forgot Password?',
            no_account: "Don't have an account?",
            have_account: 'Already have an account?',
            first_name: 'First Name',
            last_name: 'Last Name',
            username: 'Username',
            phone: 'Phone Number',
            major: 'Major',
            confirm_password: 'Confirm Password',
            register: 'Register',
            login_button: 'Login'
        },

        // Dashboard
        dashboard: {
            welcome: 'Welcome',
            my_courses: 'My Courses',
            enrolled_courses: 'Enrolled Courses',
            progress: 'Progress',
            announcements: 'Announcements',
            upcoming: 'Upcoming',
            calendar: 'Calendar'
        },

        // Ratings & Reviews
        reviews: {
            write_review: 'Write Review',
            your_rating: 'Your Rating',
            review_title: 'Review Title',
            review_content: 'Your Review',
            would_recommend: 'I would recommend this course',
            submit: 'Submit Review',
            helpful: 'Helpful',
            reply: 'Reply',
            edit: 'Edit',
            delete: 'Delete',
            based_on: 'Based on',
            reviews: 'reviews'
        },

        // Common
        common: {
            loading: 'Loading...',
            search: 'Search',
            cancel: 'Cancel',
            save: 'Save',
            close: 'Close',
            submit: 'Submit',
            update: 'Update',
            delete: 'Delete',
            confirm: 'Confirm',
            yes: 'Yes',
            no: 'No',
            ok: 'OK',
            error: 'Error',
            success: 'Success',
            warning: 'Warning',
            info: 'Information'
        }
    },

    ar: {
        // Navigation
        nav: {
            home: 'الرئيسية',
            features: 'المميزات',
            courses: 'المساقات',
            about: 'من نحن',
            login: 'تسجيل الدخول',
            signup: 'إنشاء حساب',
            register: 'تسجيل',
            logout: 'تسجيل الخروج',
            dashboard: 'لوحة التحكم',
            search: 'البحث'
        },

        // Homepage
        home: {
            hero_title: 'حوّل رحلة التعلم الخاصة بك مع',
            hero_description: 'احصل على مساقات عالمية المستوى، تعلم من مدرسين خبراء، وحقق أهدافك الأكاديمية من خلال نظام إدارة التعلم الشامل لدينا.',
            search_placeholder: 'ابحث عن مساقات، مواضيع، أو مهارات...',
            start_learning: 'ابدأ التعلم الآن',
            browse_courses: 'تصفح جميع المساقات',
            students: 'طالب',
            courses: 'مساق',
            instructors: 'مدرس',
            success_rate: 'معدل النجاح'
        },

        // Search
        search: {
            title: 'نتائج البحث',
            search_for: 'نتائج البحث عن',
            all_courses: 'جميع المساقات',
            found: 'مساق موجود',
            course: 'مساق',
            no_results: 'لم يتم العثور على مساقات',
            try_adjusting: 'حاول تعديل البحث أو الفلاتر',
            clear_filters: 'مسح الفلاتر',
            filters: 'الفلاتر',
            clear_all: 'مسح الكل',
            apply_filters: 'تطبيق الفلاتر',
            sort_by: 'الترتيب حسب',
            active_filters: 'الفلاتر النشطة',
            search_placeholder: 'ابحث عن المساقات...'
        },

        // Filters
        filters: {
            category: 'التصنيف',
            all_categories: 'جميع التصنيفات',
            level: 'المستوى',
            all_levels: 'جميع المستويات',
            beginner: 'مبتدئ',
            intermediate: 'متوسط',
            advanced: 'متقدم',
            rating: 'الحد الأدنى للتقييم',
            all_ratings: 'جميع التقييمات',
            semester: 'الفصل الدراسي',
            all_semesters: 'جميع الفصول'
        },

        // Sorting
        sort: {
            relevance: 'الأكثر صلة',
            newest: 'الأحدث أولاً',
            oldest: 'الأقدم أولاً',
            title_asc: 'العنوان (أ-ي)',
            title_desc: 'العنوان (ي-أ)',
            rating_high: 'الأعلى تقييماً',
            rating_low: 'الأقل تقييماً',
            popular: 'الأكثر شعبية',
            duration_short: 'الأقصر مدة',
            duration_long: 'الأطول مدة'
        },

        // Course Card
        course: {
            students: 'طالب',
            weeks: 'أسبوع',
            relevance: 'الصلة',
            enroll: 'سجل الآن',
            view_details: 'عرض التفاصيل',
            rating: 'التقييم',
            no_ratings: 'لا يوجد تقييمات بعد'
        },

        // Pagination
        pagination: {
            previous: 'السابق',
            next: 'التالي',
            page: 'صفحة'
        },

        // Auth
        auth: {
            email: 'البريد الإلكتروني',
            password: 'كلمة المرور',
            remember_me: 'تذكرني',
            forgot_password: 'نسيت كلمة المرور؟',
            no_account: 'ليس لديك حساب؟',
            have_account: 'لديك حساب بالفعل؟',
            first_name: 'الاسم الأول',
            last_name: 'اسم العائلة',
            username: 'اسم المستخدم',
            phone: 'رقم الهاتف',
            major: 'التخصص',
            confirm_password: 'تأكيد كلمة المرور',
            register: 'تسجيل',
            login_button: 'دخول'
        },

        // Dashboard
        dashboard: {
            welcome: 'مرحباً',
            my_courses: 'مساقاتي',
            enrolled_courses: 'المساقات المسجلة',
            progress: 'التقدم',
            announcements: 'الإعلانات',
            upcoming: 'القادم',
            calendar: 'التقويم'
        },

        // Ratings & Reviews
        reviews: {
            write_review: 'اكتب تقييم',
            your_rating: 'تقييمك',
            review_title: 'عنوان التقييم',
            review_content: 'تقييمك',
            would_recommend: 'أوصي بهذا المساق',
            submit: 'إرسال التقييم',
            helpful: 'مفيد',
            reply: 'رد',
            edit: 'تعديل',
            delete: 'حذف',
            based_on: 'بناءً على',
            reviews: 'تقييم'
        },

        // Common
        common: {
            loading: 'جاري التحميل...',
            search: 'بحث',
            cancel: 'إلغاء',
            save: 'حفظ',
            close: 'إغلاق',
            submit: 'إرسال',
            update: 'تحديث',
            delete: 'حذف',
            confirm: 'تأكيد',
            yes: 'نعم',
            no: 'لا',
            ok: 'موافق',
            error: 'خطأ',
            success: 'نجاح',
            warning: 'تحذير',
            info: 'معلومات'
        }
    }
};

// Current language state
let currentLanguage = localStorage.getItem('language') || 'en';

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'nav.home')
 * @returns {string} Translated text
 */
function t(key) {
    const keys = key.split('.');
    let value = translations[currentLanguage];

    for (const k of keys) {
        value = value?.[k];
    }

    return value || key;
}

/**
 * Set language and update page
 * @param {string} lang - Language code ('en' or 'ar')
 */
function setLanguage(lang) {
    if (!translations[lang]) return;

    currentLanguage = lang;
    localStorage.setItem('language', lang);

    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update all elements with data-i18n attribute
    updatePageTranslations();

    // Trigger custom event for other scripts to handle
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * Update all translations on the page
 */
function updatePageTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);

        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                element.value = translation;
            }
        } else {
            element.textContent = translation;
        }
    });

    // Update elements with data-i18n-html (for HTML content)
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
        const key = element.getAttribute('data-i18n-html');
        element.innerHTML = t(key);
    });
}

/**
 * Get current language
 */
function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Initialize i18n on page load
 */
function initI18n() {
    // Set initial language
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);

    // Update language toggle button if exists
    updateLanguageToggle();
}

/**
 * Update language toggle button state
 */
function updateLanguageToggle() {
    const toggle = document.getElementById('languageToggle');
    if (toggle) {
        toggle.textContent = currentLanguage === 'en' ? 'العربية' : 'English';
    }
}

/**
 * Toggle between languages
 */
function toggleLanguage() {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    setLanguage(newLang);

    // Reload page if needed for complex layouts
    // location.reload();
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    initI18n();
}

// Export functions
window.t = t;
window.setLanguage = setLanguage;
window.getCurrentLanguage = getCurrentLanguage;
window.toggleLanguage = toggleLanguage;

