/**
 * Student Dashboard Chatbot with Gemma AI
 * Handles both desktop and mobile chatbot interactions
 */

// Conversation history
let conversationHistory = [];

// ========== DESKTOP CHATBOT FUNCTIONS ==========

function handleChatKeyPressDesktop(event) {
    if (event.key === 'Enter') {
        sendMessageDesktop();
    }
}

async function sendMessageDesktop() {
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

    addMessageDesktop(message, 'user');
    input.value = '';

    showTypingIndicatorDesktop();

    try {
        // Call Gemma AI backend
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
        hideTypingIndicatorDesktop();

        if (data.success && data.reply) {
            addMessageDesktop(data.reply, 'bot');

            // Update conversation history
            conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.reply }
            );

            // Keep only last 20 messages
            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(-20);
            }
        } else {
            addMessageDesktop('Sorry, I encountered an error. Please try again.', 'bot');
        }

    } catch (error) {
        console.error('Chatbot error:', error);
        hideTypingIndicatorDesktop();
        addMessageDesktop('Network error. Please check your connection.', 'bot');
    }
}

async function sendQuickReplyDesktop(message) {
    const input = document.getElementById('chatbotInputDesktop');
    input.value = message;
    await sendMessageDesktop();
}

function addMessageDesktop(text, sender) {
    const messagesContainer = document.getElementById('chatbotMessagesDesktop');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-2 mb-3';

    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-sm"></i>
            </div>
            <div class="flex-1">
                <div class="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm">
                    <p class="text-gray-800 text-xs leading-relaxed">${escapeHtml(text)}</p>
                </div>
            </div>
        `;
    } else {
        messageDiv.className = 'flex gap-2 mb-3 justify-end';
        messageDiv.innerHTML = `
            <div class="flex-1 flex justify-end">
                <div class="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl rounded-tr-sm shadow-sm max-w-[80%]">
                    <p class="text-white text-xs leading-relaxed">${escapeHtml(text)}</p>
                </div>
            </div>
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-gray-600 text-sm"></i>
            </div>
        `;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicatorDesktop() {
    const messagesContainer = document.getElementById('chatbotMessagesDesktop');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicatorDesktop';
    typingDiv.className = 'flex gap-2 mb-3';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-robot text-white text-sm"></i>
        </div>
        <div class="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm">
            <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicatorDesktop() {
    const indicator = document.getElementById('typingIndicatorDesktop');
    if (indicator) {
        indicator.remove();
    }
}

// ========== MOBILE CHATBOT FUNCTIONS ==========

function toggleMobileChatbot() {
    const window = document.getElementById('mobileChatbotWindow');
    const button = document.getElementById('mobileChatbotButton');
    window.classList.remove('hidden');
    button.classList.add('hidden');
}

function closeMobileChatbot() {
    const window = document.getElementById('mobileChatbotWindow');
    const button = document.getElementById('mobileChatbotButton');
    window.classList.add('hidden');
    button.classList.remove('hidden');
}

function handleChatKeyPressMobile(event) {
    if (event.key === 'Enter') {
        sendMessageMobile();
    }
}

async function sendMessageMobile() {
    const input = document.getElementById('mobileChatbotInput');
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

    addMessageMobile(message, 'user');
    input.value = '';

    showTypingIndicatorMobile();

    try {
        // Call Gemma AI backend
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
        hideTypingIndicatorMobile();

        if (data.success && data.reply) {
            addMessageMobile(data.reply, 'bot');

            // Update conversation history
            conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.reply }
            );

            // Keep only last 20 messages
            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(-20);
            }
        } else {
            addMessageMobile('Sorry, I encountered an error. Please try again.', 'bot');
        }

    } catch (error) {
        console.error('Chatbot error:', error);
        hideTypingIndicatorMobile();
        addMessageMobile('Network error. Please check your connection.', 'bot');
    }
}

async function sendQuickReplyMobile(message) {
    const input = document.getElementById('mobileChatbotInput');
    input.value = message;
    await sendMessageMobile();
}

function addMessageMobile(text, sender) {
    const messagesContainer = document.getElementById('mobileChatbotMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex gap-2 mb-3';

    if (sender === 'bot') {
        messageDiv.innerHTML = `
            <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-sm"></i>
            </div>
            <div class="flex-1">
                <div class="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm">
                    <p class="text-gray-800 text-sm">${escapeHtml(text)}</p>
                </div>
            </div>
        `;
    } else {
        messageDiv.className = 'flex gap-2 mb-3 justify-end';
        messageDiv.innerHTML = `
            <div class="flex-1 flex justify-end">
                <div class="bg-gradient-to-br from-blue-600 to-blue-500 p-3 rounded-xl rounded-tr-sm shadow-sm max-w-[80%]">
                    <p class="text-white text-sm">${escapeHtml(text)}</p>
                </div>
            </div>
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-gray-600 text-sm"></i>
            </div>
        `;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicatorMobile() {
    const messagesContainer = document.getElementById('mobileChatbotMessages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicatorMobile';
    typingDiv.className = 'flex gap-2 mb-3';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-robot text-white text-sm"></i>
        </div>
        <div class="bg-white p-3 rounded-xl rounded-tl-sm shadow-sm">
            <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicatorMobile() {
    const indicator = document.getElementById('typingIndicatorMobile');
    if (indicator) {
        indicator.remove();
    }
}

// ========== UTILITY FUNCTIONS ==========

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
