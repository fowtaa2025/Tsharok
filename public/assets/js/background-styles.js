/**
 * Background Styles Manager for Tsharok
 * Applies selected education-themed background styles across all pages
 */

const BackgroundStyles = {
    // All 10 education-themed background styles
    styles: {
        1: { // Books & Pages
            name: 'Books & Pages',
            containerClass: 'bg-edu-books',
            css: `
                .bg-edu-books { background: linear-gradient(135deg, #f5f0e6 0%, #e8dcc8 100%); position: relative; overflow: hidden; }
                .bg-edu-books::before { content: '📚'; position: absolute; font-size: 120px; opacity: 0.08; top: -20px; left: -20px; transform: rotate(-15deg); z-index: 0; }
                .bg-edu-books::after { content: '📖'; position: absolute; font-size: 100px; opacity: 0.06; bottom: -10px; right: 10px; transform: rotate(10deg); z-index: 0; }
            `
        },
        2: { // Graduation
            name: 'Graduation',
            containerClass: 'bg-edu-graduation',
            css: `
                .bg-edu-graduation { background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); position: relative; overflow: hidden; }
                .bg-edu-graduation::before { content: '🎓'; position: absolute; font-size: 150px; opacity: 0.1; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 0; }
                .bg-edu-graduation .hero-content h1, .bg-edu-graduation .hero-content p { color: white !important; }
            `
        },
        3: { // Ideas & Innovation
            name: 'Ideas & Innovation',
            containerClass: 'bg-edu-ideas',
            css: `
                .bg-edu-ideas { background: linear-gradient(180deg, #fefce8 0%, #fef9c3 100%); position: relative; overflow: hidden; }
                .bg-edu-ideas::before { content: '💡'; position: absolute; font-size: 80px; opacity: 0.12; top: 10%; left: 5%; z-index: 0; }
                .bg-edu-ideas::after { content: '💡'; position: absolute; font-size: 60px; opacity: 0.08; bottom: 15%; right: 10%; z-index: 0; }
            `
        },
        4: { // Knowledge Network
            name: 'Knowledge Network',
            containerClass: 'bg-edu-network',
            css: `
                .bg-edu-network { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); position: relative; overflow: hidden; }
                .bg-edu-network::before { content: '🤝'; position: absolute; font-size: 100px; opacity: 0.08; bottom: 5%; right: 5%; z-index: 0; }
                .bg-edu-network::after { content: '🔗'; position: absolute; font-size: 70px; opacity: 0.06; top: 10%; left: 10%; z-index: 0; }
            `
        },
        5: { // Writing & Notes
            name: 'Writing & Notes',
            containerClass: 'bg-edu-writing',
            css: `
                .bg-edu-writing { background: linear-gradient(135deg, #fdf4ff 0%, #f5d0fe 100%); position: relative; overflow: hidden; }
                .bg-edu-writing::before { content: '✏️'; position: absolute; font-size: 80px; opacity: 0.12; top: 10%; left: 5%; transform: rotate(-30deg); z-index: 0; }
                .bg-edu-writing::after { content: '📝'; position: absolute; font-size: 90px; opacity: 0.08; bottom: 5%; right: 10%; transform: rotate(15deg); z-index: 0; }
            `
        },
        6: { // Math & Science
            name: 'Math & Science',
            containerClass: 'bg-edu-math',
            css: `
                .bg-edu-math { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); position: relative; overflow: hidden; }
                .bg-edu-math::before { content: '∑∫π'; position: absolute; font-size: 150px; opacity: 0.08; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: serif; color: #38bdf8; z-index: 0; }
                .bg-edu-math .hero-content h1, .bg-edu-math .hero-content p { color: white !important; }
            `
        },
        7: { // Documents
            name: 'Documents',
            containerClass: 'bg-edu-documents',
            css: `
                .bg-edu-documents { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); position: relative; overflow: hidden; }
                .bg-edu-documents::before { content: '📄'; position: absolute; font-size: 100px; opacity: 0.1; top: 10%; left: 10%; transform: rotate(-5deg); z-index: 0; }
                .bg-edu-documents::after { content: '📋'; position: absolute; font-size: 80px; opacity: 0.08; bottom: 10%; right: 15%; transform: rotate(8deg); z-index: 0; }
            `
        },
        8: { // Growth & Learning
            name: 'Growth & Learning',
            containerClass: 'bg-edu-growth',
            css: `
                .bg-edu-growth { background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%); position: relative; overflow: hidden; }
                .bg-edu-growth::before { content: '🌱'; position: absolute; font-size: 60px; opacity: 0.15; bottom: 10%; left: 10%; z-index: 0; }
                .bg-edu-growth::after { content: '🌳'; position: absolute; font-size: 80px; opacity: 0.1; top: 10%; right: 10%; z-index: 0; }
            `
        },
        9: { // Brain & Knowledge
            name: 'Brain & Knowledge',
            containerClass: 'bg-edu-brain',
            css: `
                .bg-edu-brain { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); position: relative; overflow: hidden; }
                .bg-edu-brain::before { content: '🧠'; position: absolute; font-size: 120px; opacity: 0.08; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 0; }
            `
        },
        10: { // Student Community
            name: 'Student Community',
            containerClass: 'bg-edu-community',
            css: `
                .bg-edu-community { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); position: relative; overflow: hidden; }
                .bg-edu-community::before { content: '👨‍🎓'; position: absolute; font-size: 70px; opacity: 0.1; top: 15%; left: 10%; z-index: 0; }
                .bg-edu-community::after { content: '👩‍🎓'; position: absolute; font-size: 70px; opacity: 0.1; bottom: 15%; right: 10%; z-index: 0; }
            `
        }
    },

    // Initialize and apply the selected style
    init: function () {
        const selectedStyle = parseInt(localStorage.getItem('selectedBackgroundStyle')) || 1;
        this.applyStyle(selectedStyle);
    },

    // Apply a specific style
    applyStyle: function (styleNum) {
        const style = this.styles[styleNum];
        if (!style) return;

        // Remove existing style tag if present
        const existingStyle = document.getElementById('dynamic-bg-style');
        if (existingStyle) existingStyle.remove();

        // Create new style tag
        const styleTag = document.createElement('style');
        styleTag.id = 'dynamic-bg-style';
        styleTag.textContent = style.css;
        document.head.appendChild(styleTag);

        // Find and update the hero section / main container
        const heroSection = document.querySelector('.hero-content')?.parentElement ||
            document.querySelector('.bg-shapes-container') ||
            document.querySelector('main');

        if (heroSection) {
            // Remove all existing bg-edu classes
            Object.values(this.styles).forEach(s => {
                heroSection.classList.remove(s.containerClass);
            });
            // Remove old shape classes
            heroSection.classList.remove('bg-shapes-container');

            // Add new class
            heroSection.classList.add(style.containerClass);

            // Completely remove old background shapes (not just hide)
            const oldShapes = heroSection.querySelectorAll('.bg-shape');
            oldShapes.forEach(shape => shape.remove());
        }

        // Save selection
        localStorage.setItem('selectedBackgroundStyle', styleNum);
        localStorage.setItem('selectedBackgroundName', style.name);
    },

    // Get current style info
    getCurrentStyle: function () {
        const styleNum = parseInt(localStorage.getItem('selectedBackgroundStyle')) || 1;
        return {
            number: styleNum,
            ...this.styles[styleNum]
        };
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    BackgroundStyles.init();
});

