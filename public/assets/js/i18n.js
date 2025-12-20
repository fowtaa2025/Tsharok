/**
 * Internationalization (i18n) Module
 * Supports English and Arabic with RTL layout
 * Loads translations dynamically from JSON files
 * Tsharok LMS
 */

// Fallback hardcoded translations (for backward compatibility)
const fallbackTranslations = {
    en: {
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
            search: 'Search',
            arabic: 'العربية'
        },
        home: {
            hero_title: 'Transform Your Learning Journey with',
            hero_description: 'Access world-class courses, learn from expert instructors, and achieve your academic goals with our comprehensive learning management system.'
        },
        common: {
            loading: 'Loading...',
            search: 'Search',
            cancel: 'Cancel',
            save: 'Save',
            close: 'Close'
        }
    },
    ar: {
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
            search: 'البحث',
            arabic: 'English'
        },
        home: {
            hero_title: 'حوّل رحلة التعلم الخاصة بك مع',
            hero_description: 'احصل على مساقات عالمية المستوى، تعلم من مدرسين خبراء، وحقق أهدافك الأكاديمية من خلال نظام إدارة التعلم الشامل لدينا.'
        },
        common: {
            loading: 'جاري التحميل...',
            search: 'بحث',
            cancel: 'إلغاء',
            save: 'حفظ',
            close: 'إغلاق'
        }
    }
};

// Store for dynamically loaded translations
let translations = { en: {}, ar: {} };
let translationsLoaded = false;
let currentLanguage = localStorage.getItem('language') || 'en';

/**
 * Load translations from JSON files
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {Promise<Object>} - Merged translations object
 */
async function loadTranslations(lang) {
    const files = ['common', 'auth', 'courses', 'admin', 'file', 'addcourse', 'dashboard'];
    const mergedTranslations = {};

    try {
        // Load all translation files in parallel
        const promises = files.map(file =>
            fetch(`/locales/${lang}/${file}.json`)
                .then(response => {
                    if (!response.ok) {
                        console.warn(`Failed to load ${file}.json for ${lang}`);
                        return {};
                    }
                    return response.json();
                })
                .catch(error => {
                    console.warn(`Error loading ${file}.json for ${lang}:`, error);
                    return {};
                })
        );

        const results = await Promise.all(promises);

        // Merge all translation files into one object
        results.forEach((translationData) => {
            Object.assign(mergedTranslations, translationData);
        });

        return mergedTranslations;
    } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
        return {};
    }
}

/**
 * Initialize translations for both languages
 */
async function initializeTranslations() {
    try {
        // Load both English and Arabic translations
        const [enTranslations, arTranslations] = await Promise.all([
            loadTranslations('en'),
            loadTranslations('ar')
        ]);

        // Merge with fallback translations (fallback has lower priority)
        translations.en = { ...fallbackTranslations.en, ...enTranslations };
        translations.ar = { ...fallbackTranslations.ar, ...arTranslations };

        translationsLoaded = true;

        // Update page if already initialized
        if (document.readyState !== 'loading') {
            updatePageTranslations();
        }

        console.log('Translations loaded successfully');
    } catch (error) {
        console.error('Failed to initialize translations:', error);
        // Use fallback translations if loading fails
        translations = fallbackTranslations;
        translationsLoaded = true;
    }
}

/**
 * Get translation for a key with nested object support
 * @param {string} key - Translation key (e.g., 'nav.home' or 'common.actions.submit')
 * @returns {string} Translated text
 */
function t(key) {
    const keys = key.split('.');
    let value = translations[currentLanguage];

    // Traverse nested object
    for (const k of keys) {
        value = value?.[k];
    }

    // Return value or fallback to English if Arabic translation not found
    if (!value && currentLanguage === 'ar') {
        let fallbackValue = translations.en;
        for (const k of keys) {
            fallbackValue = fallbackValue?.[k];
        }
        if (fallbackValue) {
            console.warn(`Missing Arabic translation for: ${key}`);
            return fallbackValue;
        }
    }

    return value || key;
}

/**
 * Set language and update page
 * @param {string} lang - Language code ('en' or 'ar')
 */
function setLanguage(lang) {
    if (!['en', 'ar'].includes(lang)) return;

    currentLanguage = lang;
    localStorage.setItem('language', lang);

    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Add/remove RTL body class for additional styling
    if (lang === 'ar') {
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
    } else {
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
    }

    // Update all elements with data-i18n attribute
    updatePageTranslations();

    // Update language toggle button
    updateLanguageToggle();

    // Trigger custom event for other scripts to handle
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * Update all translations on the page
 */
function updatePageTranslations() {
    // Update elements with data-i18n attribute
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

    // Update elements with data-i18n-placeholder (for placeholder attributes)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    // Update elements with data-i18n-title (for title attributes)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        element.title = t(key);
    });

    // Update elements with data-i18n-aria-label (for aria-label attributes)
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria-label');
        element.setAttribute('aria-label', t(key));
    });
}

/**
 * Get current language
 * @returns {string} Current language code
 */
function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Check if translations are loaded
 * @returns {boolean} True if translations are loaded
 */
function isTranslationsLoaded() {
    return translationsLoaded;
}

/**
 * Initialize i18n on page load
 */
async function initI18n() {
    // Load translations from JSON files
    await initializeTranslations();

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
    const toggleButtons = document.querySelectorAll('#languageToggle, [onclick*="toggleLanguage"]');

    toggleButtons.forEach(toggle => {
        // Update the data-i18n attribute based on current language
        const targetKey = currentLanguage === 'en' ? 'nav.arabic' : 'nav.english';
        toggle.setAttribute('data-i18n', targetKey);

        // Update the text content immediately
        toggle.textContent = t(targetKey);
    });
}

/**
 * Toggle between languages
 */
function toggleLanguage() {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
}

/**
 * Get all available translations for a namespace
 * @param {string} namespace - Namespace (e.g., 'common', 'auth')
 * @returns {Object} All translations in that namespace
 */
function getNamespace(namespace) {
    return translations[currentLanguage]?.[namespace] || {};
}

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    initI18n();
}

// Export functions to window for global access
window.t = t;
window.setLanguage = setLanguage;
window.getCurrentLanguage = getCurrentLanguage;
window.toggleLanguage = toggleLanguage;
window.updatePageTranslations = updatePageTranslations;
window.isTranslationsLoaded = isTranslationsLoaded;
window.getNamespace = getNamespace;
