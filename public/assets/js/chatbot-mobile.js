/**
 * Mobile Floating Chatbot Component
 * Injects a floating button and full-screen modal chatbot for mobile view
 * Available on all dashboard pages
 */

(function () {
    'use strict';

    // Only initialize if we're in the browser
    if (typeof window === 'undefined') return;

    // Create and inject the mobile floating chatbot
    function createMobileChatbot() {
        // Check if we're on student.html - only hide on large screens there
        const isStudentPage = window.location.pathname.includes('student.html');
        const hideClass = isStudentPage ? 'lg:hidden' : ''; // Only hide on student page at lg breakpoint

        const chatbotHTML = `
            <!-- Mobile Floating Chatbot Button -->
            <div id="mobileChatbotButton" class="fixed bottom-6 right-6 z-50 ${hideClass}">
                <button onclick="toggleMobileChatbot()"
                    class="w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform">
                    <i class="fas fa-robot text-2xl"></i>
                </button>
            </div>

            <!-- Mobile Chatbot Window (expandable) -->
            <div id="mobileChatbotWindow" class="hidden fixed inset-0 z-50 bg-black bg-opacity-50"
                onclick="closeMobileChatbot()">
                <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
                    onclick="event.stopPropagation()">
                    <!-- Header -->
                    <div class="bg-primary p-4 rounded-t-3xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <i class="fas fa-robot text-xl text-primary"></i>
                            </div>
                            <div class="text-white">
                                <div class="font-bold" data-i18n="chatbot.title">Tsharok Assistant</div>
                                <div class="text-xs opacity-90" data-i18n="chatbot.subtitle">Always here to help</div>
                            </div>
                        </div>
                        <button onclick="closeMobileChatbot()" class="text-white hover:bg-white/20 rounded-full p-2 transition">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <!-- Messages Area -->
                    <div class="flex-1 overflow-y-auto p-4 bg-gray-50" id="mobileChatbotMessages">
                        <div class="flex gap-2 mb-3">
                            <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-robot text-white text-sm"></i>
                            </div>
                            <div class="flex-1">
                                <div class="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm">
                                    <p class="text-gray-800 text-sm" data-i18n="chatbot.greeting">
                                        👋 Hello! I'm your Tsharok Assistant. How can I help you today?
                                    </p>
                                </div>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <button onclick="sendQuickReplyMobile('How do I add a course?')"
                                        class="px-3 py-2 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition" data-i18n="chatbot.quickReplies.addCourse">
                                        Add Course
                                    </button>
                                    <button onclick="sendQuickReplyMobile('Show my schedule')"
                                        class="px-3 py-2 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition" data-i18n="chatbot.quickReplies.mySchedule">
                                        My Schedule
                                    </button>
                                    <button onclick="sendQuickReplyMobile('Help with assignments')"
                                        class="px-3 py-2 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition" data-i18n="chatbot.quickReplies.assignments">
                                        Assignments
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Input Box -->
                    <div class="p-4 bg-white border-t border-gray-200">
                        <div class="flex gap-2 items-center">
                            <input type="text"
                                class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full text-sm outline-none focus:border-primary transition"
                                id="mobileChatbotInput" data-i18n-placeholder="chatbot.inputPlaceholder" placeholder="Type your message..."
                                onkeypress="handleChatKeyPressMobile(event)">
                            <button onclick="sendMessageMobile()"
                                class="w-12 h-12 bg-primary rounded-full text-white flex items-center justify-center hover:scale-110 transition shadow-lg">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert chatbot into body
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);

        // Apply translations if i18n is available
        if (typeof window.updatePageTranslations === 'function') {
            window.updatePageTranslations();
        }
    }

    // Chat interaction functions
    window.toggleMobileChatbot = function () {
        const chatWindow = document.getElementById('mobileChatbotWindow');
        if (chatWindow) {
            chatWindow.classList.toggle('hidden');
        }
    };

    window.closeMobileChatbot = function () {
        const chatWindow = document.getElementById('mobileChatbotWindow');
        if (chatWindow) {
            chatWindow.classList.add('hidden');
        }
    };

    window.sendMessageMobile = function () {
        const input = document.getElementById('mobileChatbotInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to chat
        addMessageMobile(message, 'user');
        input.value = '';

        // Simulate bot response
        setTimeout(() => {
            const response = getBotResponse(message);
            addMessageMobile(response, 'bot');
        }, 500);
    };

    window.handleChatKeyPressMobile = function (event) {
        if (event.key === 'Enter') {
            sendMessageMobile();
        }
    };

    window.sendQuickReplyMobile = function (message) {
        const input = document.getElementById('mobileChatbotInput');
        input.value = message;
        sendMessageMobile();
    };

    function addMessageMobile(message, sender) {
        const messagesContainer = document.getElementById('mobileChatbotMessages');
        const messageHTML = sender === 'user'
            ? `<div class="flex justify-end mb-2">
                   <div class="bg-primary text-white p-3 rounded-xl rounded-tr-sm text-sm max-w-[80%]">${message}</div>
               </div>`
            : `<div class="flex gap-2 mb-2">
                   <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                       <i class="fas fa-robot text-white text-sm"></i>
                   </div>
                   <div class="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm text-sm max-w-[80%]">${message}</div>
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
        document.addEventListener('DOMContentLoaded', createMobileChatbot);
    } else {
        createMobileChatbot();
    }
})();
