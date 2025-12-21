/**
 * Desktop Sidebar Chatbot Component with Llama 3 AI
 */

(function () {
    'use strict';

    if (typeof window === 'undefined') return;

    // Conversation history
    let conversationHistory = [];

    // Create and inject the desktop sidebar chatbot
    function createDesktopChatbot() {
        const gridContainer = document.querySelector('.grid.lg\\:grid-cols-2');

        if (!gridContainer) {
            console.warn('Grid container not found for desktop chatbot');
            return;
        }

        const chatbotHTML = `
            <div class="hidden lg:block">
                <div class="bg-white rounded-2xl shadow-lg sticky top-24 flex flex-col" style="height: 932px;">
                    <!-- Header -->
                    <div class="bg-gradient-to-br from-[#8B1538] to-[#6B0F2A] p-4 rounded-t-2xl">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                <i class="fas fa-robot text-2xl text-primary"></i>
                            </div>
                            <div class="text-white">
                                <div class="font-bold text-lg">Tsharok AI Assistant</div>
                                <div class="text-sm opacity-90">Powered by Llama 3</div>
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
                                    <p class="text-gray-800 text-xs leading-relaxed">
                                        👋 Hello! I'm your Tsharok AI Assistant. I can help you with courses, materials, assignments, and more. How can I assist you today?
                                    </p>
                                </div>
                                <div class="flex flex-wrap gap-1.5 mt-2">
                                    <button onclick="sendQuickReplyDesktop('Show my enrolled courses')"
                                        class="px-3 py-1.5 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition">
                                        My Courses
                                    </button>
                                    <button onclick="sendQuickReplyDesktop('Any new notifications?')"
                                        class="px-3 py-1.5 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition">
                                        Notifications
                                    </button>
                                    <button onclick="sendQuickReplyDesktop('Help me find study materials')"
                                        class="px-3 py-1.5 bg-white border-2 border-primary text-primary rounded-full text-xs font-medium hover:bg-primary hover:text-white transition">
                                        Study Materials
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
                                id="chatbotInputDesktop" placeholder="Ask me anything..."
                                onkeypress="handleChatKeyPressDesktop(event)">
                            <button onclick="sendMessageDesktop()"
                                class="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-full text-white flex items-center justify-center hover:scale-110 transition shadow-lg">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        gridContainer.insertAdjacentHTML('beforeend', chatbotHTML);

        if (typeof window.updatePageTranslations === 'function') {
            window.updatePageTranslations();
        }
    }

    // Send message to AI
    window.sendMessageDesktop = async function () {
        const input = document.getElementById('chatbotInputDesktop');
        const message = input.value.trim();

        if (!message) return;

        // Get current user
        let userId = null;
        try {
            const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            userId = user?.userId || user?.id;
        } catch (e) {
            console.log('Could not get user ID');
        }

        // Add user message to UI
        addMessageDesktop(message, 'user');
        input.value = '';

        // Show typing indicator
        const typingId = addTypingIndicator();

        try {
            // Call AI backend
            const response = await fetch('https://tsharok-api.fow-taa-2025.workers.dev/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    userId,
                    conversationHistory
                })
            });

            const data = await response.json();

            // Remove typing indicator
            removeTypingIndicator(typingId);

            if (data.success && data.reply) {
                // Add AI response
                addMessageDesktop(data.reply, 'bot');

                // Update conversation history
                conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.reply }
                );

                // Keep only last 10 messages (5 exchanges)
                if (conversationHistory.length > 20) {
                    conversationHistory = conversationHistory.slice(-20);
                }
            } else {
                addMessageDesktop('Sorry, I encountered an error. Please try again.', 'bot');
            }

        } catch (error) {
            console.error('Chatbot error:', error);
            removeTypingIndicator(typingId);
            addMessageDesktop('Network error. Please check your connection and try again.', 'bot');
        }
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
                   <div class="bg-primary text-white p-2 rounded-xl rounded-tr-sm text-xs max-w-[80%] whitespace-pre-wrap">${escapeHtml(message)}</div>
               </div>`
            : `<div class="flex gap-2 mb-2">
                   <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                       <i class="fas fa-robot text-white text-sm"></i>
                   </div>
                   <div class="bg-white p-2 rounded-xl rounded-tl-sm shadow-sm text-xs max-w-[80%] whitespace-pre-wrap">${escapeHtml(message)}</div>
               </div>`;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const messagesContainer = document.getElementById('chatbotMessagesDesktop');
        messagesContainer.insertAdjacentHTML('beforeend', `
            <div id="${id}" class="flex gap-2 mb-2">
                <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-sm"></i>
                </div>
                <div class="bg-white p-2 rounded-xl shadow-sm">
                    <div class="flex gap-1">
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                    </div>
                </div>
            </div>
        `);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        document.getElementById(id)?.remove();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createDesktopChatbot);
    } else {
        createDesktopChatbot();
    }
})();
