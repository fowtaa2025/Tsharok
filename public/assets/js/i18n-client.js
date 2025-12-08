/**
 * Client-side Internationalization (i18n)
 * Handles multilingual support on the frontend
 * Tsharok LMS
 */

// Global i18n state
const i18n = {
    currentLanguage: 'en',
    translations: {},
    loadedNamespaces: new Set(),
    availableLanguages: []
};

/**
 * Initialize i18n system
 */
async function initI18n() {
    try {
        // Get available languages
        const response = await axios.get('/api/get-available-languages.php');
        if (response.data.success) {
            i18n.currentLanguage = response.data.data.currentLanguage;
            i18n.availableLanguages = response.data.data.languages;
            
            // Set document direction
            document.documentElement.dir = getDirection(i18n.currentLanguage);
            document.documentElement.lang = i18n.currentLanguage;
            
            return true;
        }
    } catch (error) {
        console.error('Failed to initialize i18n:', error);
    }
    return false;
}

/**
 * Load translations for a namespace
 */
async function loadTranslations(namespace = 'common', language = null) {
    if (!language) {
        language = i18n.currentLanguage;
    }
    
    const cacheKey = `${language}_${namespace}`;
    
    // Check if already loaded
    if (i18n.loadedNamespaces.has(cacheKey)) {
        return true;
    }
    
    try {
        const response = await axios.get('/api/get-translations.php', {
            params: {
                language: language,
                namespace: namespace
            }
        });
        
        if (response.data.success) {
            // Store translations
            if (!i18n.translations[language]) {
                i18n.translations[language] = {};
            }
            i18n.translations[language][namespace] = response.data.data.translations;
            i18n.loadedNamespaces.add(cacheKey);
            return true;
        }
    } catch (error) {
        console.error('Failed to load translations:', error);
    }
    return false;
}

/**
 * Translate a key
 * @param {string} key - Translation key (supports dot notation)
 * @param {object} params - Parameters for interpolation
 * @param {string} namespace - Translation namespace
 * @returns {string} Translated string
 */
function __(key, params = {}, namespace = 'common') {
    const language = i18n.currentLanguage;
    
    // Check if namespace is loaded
    if (!i18n.translations[language] || !i18n.translations[language][namespace]) {
        console.warn(`Translation namespace '${namespace}' not loaded`);
        return key;
    }
    
    // Navigate through nested keys
    const keys = key.split('.');
    let value = i18n.translations[language][namespace];
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            console.warn(`Translation key '${key}' not found in namespace '${namespace}'`);
            return key;
        }
    }
    
    // Interpolate parameters
    if (typeof value === 'string' && Object.keys(params).length > 0) {
        Object.keys(params).forEach(param => {
            value = value.replace(`{${param}}`, params[param]);
        });
    }
    
    return value;
}

/**
 * Translate and set element content
 * @param {string} selector - CSS selector or element
 * @param {string} key - Translation key
 * @param {object} params - Parameters for interpolation
 * @param {string} namespace - Translation namespace
 */
function translateElement(selector, key, params = {}, namespace = 'common') {
    const elements = typeof selector === 'string' 
        ? document.querySelectorAll(selector) 
        : [selector];
    
    const translation = __(key, params, namespace);
    
    elements.forEach(element => {
        if (element) {
            element.textContent = translation;
        }
    });
}

/**
 * Translate all elements with data-i18n attribute
 * @param {string} namespace - Translation namespace
 */
function translatePage(namespace = 'common') {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const ns = element.getAttribute('data-i18n-namespace') || namespace;
        const params = {};
        
        // Get parameters from data attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-i18n-param-')) {
                const paramName = attr.name.replace('data-i18n-param-', '');
                params[paramName] = attr.value;
            }
        });
        
        const translation = __(key, params, ns);
        
        // Set content based on attribute
        const target = element.getAttribute('data-i18n-target') || 'textContent';
        if (target === 'placeholder') {
            element.placeholder = translation;
        } else if (target === 'title') {
            element.title = translation;
        } else if (target === 'value') {
            element.value = translation;
        } else {
            element.textContent = translation;
        }
    });
}

/**
 * Set language
 * @param {string} language - Language code
 */
async function setLanguage(language) {
    try {
        const response = await axios.post('/api/set-language.php', {
            language: language
        });
        
        if (response.data.success) {
            i18n.currentLanguage = language;
            i18n.loadedNamespaces.clear();
            i18n.translations = {};
            
            // Set document direction
            document.documentElement.dir = getDirection(language);
            document.documentElement.lang = language;
            
            // Reload page to apply new language
            window.location.reload();
            
            return true;
        } else {
            showToast(response.data.message || 'Failed to change language', 'error');
        }
    } catch (error) {
        console.error('Failed to set language:', error);
        showToast('Failed to change language', 'error');
    }
    return false;
}

/**
 * Get current language
 * @returns {string} Current language code
 */
function getCurrentLanguage() {
    return i18n.currentLanguage;
}

/**
 * Get direction for language
 * @param {string} language - Language code
 * @returns {string} 'rtl' or 'ltr'
 */
function getDirection(language) {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
}

/**
 * Check if language is RTL
 * @param {string} language - Language code
 * @returns {boolean} True if RTL
 */
function isRTL(language = null) {
    if (!language) {
        language = i18n.currentLanguage;
    }
    return getDirection(language) === 'rtl';
}

/**
 * Toggle language (for bilingual sites)
 */
async function toggleLanguage() {
    const currentLang = getCurrentLanguage();
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    await setLanguage(newLang);
}

/**
 * Format number according to language
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimals
 * @returns {string} Formatted number
 */
function formatNumber(number, decimals = 0) {
    const language = i18n.currentLanguage;
    
    try {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    } catch (error) {
        return number.toFixed(decimals);
    }
}

/**
 * Format date according to language
 * @param {Date|string|number} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
function formatDate(date, options = {}) {
    const language = i18n.currentLanguage;
    
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options
    };
    
    try {
        return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', defaultOptions).format(date);
    } catch (error) {
        return date.toLocaleDateString();
    }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
function getRelativeTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);
    
    if (diffSec < 60) {
        return __('time.now', {}, 'common');
    } else if (diffMin < 60) {
        return __('time.ago', { time: `${diffMin} ${__('time.minutes', {}, 'common')}` }, 'common');
    } else if (diffHour < 24) {
        return __('time.ago', { time: `${diffHour} ${__('time.hours', {}, 'common')}` }, 'common');
    } else if (diffDay === 1) {
        return __('time.yesterday', {}, 'common');
    } else if (diffDay < 7) {
        return __('time.ago', { time: `${diffDay} ${__('time.days', {}, 'common')}` }, 'common');
    } else if (diffWeek < 4) {
        return __('time.ago', { time: `${diffWeek} ${__('time.weeks', {}, 'common')}` }, 'common');
    } else if (diffMonth < 12) {
        return __('time.ago', { time: `${diffMonth} ${__('time.months', {}, 'common')}` }, 'common');
    } else {
        return __('time.ago', { time: `${diffYear} ${__('time.years', {}, 'common')}` }, 'common');
    }
}

/**
 * Create language switcher UI
 * @param {string} containerId - Container element ID
 */
function createLanguageSwitcher(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const currentLang = getCurrentLanguage();
    const languages = i18n.availableLanguages;
    
    let html = '<div class="language-switcher">';
    html += '<select id="languageSelect" class="form-select" onchange="handleLanguageChange(this.value)">';
    
    languages.forEach(lang => {
        const selected = lang.code === currentLang ? 'selected' : '';
        html += `<option value="${lang.code}" ${selected}>${lang.icon} ${lang.nativeName}</option>`;
    });
    
    html += '</select>';
    html += '</div>';
    
    container.innerHTML = html;
}

/**
 * Handle language change event
 * @param {string} language - New language code
 */
async function handleLanguageChange(language) {
    await setLanguage(language);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initI18n,
        loadTranslations,
        __,
        translateElement,
        translatePage,
        setLanguage,
        getCurrentLanguage,
        getDirection,
        isRTL,
        toggleLanguage,
        formatNumber,
        formatDate,
        getRelativeTime,
        createLanguageSwitcher
    };
}

