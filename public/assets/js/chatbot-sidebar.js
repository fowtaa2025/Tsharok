/**
 * Desktop Sidebar Chatbot Component
 * Injects a fixed sidebar chatbot for desktop view (student.html only)
 * Automatically hidden on mobile devices via CSS
 */

(function () {
    'use strict';

    // Only initialize if we're in the browser
    if (typeof window === 'undefined') return;

    // Create and inject the desktop sidebar chatbot
    function createDesktopChatbot() {
        // Find the grid container (should have the left column already)
        const gridContainer = document.querySelector('.grid.lg\\:grid-cols-2');

        if (!gridContainer) {
            console.warn('Grid container not found for desktop chatbot');
            return;
        }

        // Create the chatbot panel HTML (as a grid column)
        const chatbotHTML = `
            <div class="hidden lg:block">
                <div class="bg-white rounded-2xl shadow-lg sticky top-24 flex flex-col" style="height: 932px;">
                    <!-- Header -->
                    <div class="bg-gradient-to-br from-teal-600 to-teal-500 p-4 rounded-t-2xl">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                <i class="fas fa-robot text-2xl text-primary"></i>
                            </div>
                            <div class="text-white">
                                <div class="font-bold text-lg" data-i18n="chatbot.title">Tsharok Assistant</div>
                                <div class="text-sm opacity-90" data-i18n="chatbot.subtitle">Always here to help</div>
                            </div>
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div class="flex-1 overflow-y-auto p-3 bg-gray-50" id="chatbotMessagesDesktop">
                        <div class="flex gap-2 mb-3">
                            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-robot text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm">
                                    <p class="text-gray-800 text-xs leading-relaxed" data-i18n="chatbot.greeting">
                                        👋 Hello! I'm your Tsharok Assistant. How can I help you today?
                                    </p>
                                </div>
                                <div class="flex flex-wrap gap-1.5 mt-2">
                                    <button onclick="sendQuickReplyDesktop('How do I add a course?')"
                                        class="px-3 py-1.5 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition" data-i18n="chatbot.quickReplies.addCourse">
                                        Add Course
                                    </button>
                                    <button onclick="sendQuickReplyDesktop('Show my schedule')"
                                        class="px-3 py-1.5 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition" data-i18n="chatbot.quickReplies.mySchedule">
                                        My Schedule
                                    </button>
                                    <button onclick="sendQuickReplyDesktop('Help with assignments')"
                                        class="px-3 py-1.5 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition" data-i18n="chatbot.quickReplies.assignments">
                                        Assignments
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Input Box -->
                    <div class="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
                        <div class="flex gap-2 items-center">
                            <input type="text"
                                class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full text-sm outline-none focus:border-primary transition"
                                id="chatbotInputDesktop" data-i18n-placeholder="chatbot.inputPlaceholder" placeholder="Type your message..."
                                onkeypress="handleChatKeyPressDesktop(event)">
                            <button onclick="sendMessageDesktop()"
                                class="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full text-white flex items-center justify-center hover:scale-110 transition shadow-lg">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert chatbot as second column in grid
        gridContainer.insertAdjacentHTML('beforeend', chatbotHTML);

        // Apply translations if i18n is available
        if (typeof window.updatePageTranslations === 'function') {
            window.updatePageTranslations();
        }
    }

    // Chat interaction functions
    window.sendMessageDesktop = function () {
        const input = document.getElementById('chatbotInputDesktop');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to chat
        addMessageDesktop(message, 'user');
        input.value = '';

        // Simulate bot response
        setTimeout(() => {
            const response = getBotResponse(message);
            addMessageDesktop(response, 'bot');
        }, 500);
    };

    window.handleChatKeyPressDesktop = function (event) {
        if (event.key === 'Enter') {
            sendMessageDesktop();
        }
    };

    window.sendQuickReplyDesktop = function (message) {
        const input = document.getElementById('chatbotInputDesktop');
        input.value = message;
        sendMessageDesktop();
    };

    function addMessageDesktop(message, sender) {
        const messagesContainer = document.getElementById('chatbotMessagesDesktop');
        const messageHTML = sender === 'user'
            ? `<div class="flex justify-end mb-2">
                   <div class="bg-primary text-white p-2 rounded-xl rounded-tr-sm text-xs max-w-[80%]">${message}</div>
               </div>`
            : `<div class="flex gap-2 mb-2">
                   <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                       <i class="fas fa-robot text-white text-sm"></i>
                   </div>
                   <div class="bg-white p-2 rounded-xl rounded-tl-sm shadow-sm text-xs max-w-[80%]">${message}</div>
               </div>`;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function getBotResponse(message) {
        // Simple response logic
        const msg = message.toLowerCase();
        if (msg.includes('course')) return 'To add a course, go to the "Add Course" page from the navigation menu.';
        if (msg.includes('schedule')) return 'You can view your schedule on the dashboard. It shows all your enrolled courses.';
        if (msg.includes('assignment')) return 'Assignments can be found in each course page under the materials section.';
        return 'Thank you for your message! How else can I help you today?';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDesktopChatbot);
    } else {
        createDesktopChatbot();
    }
})();
