// Desktop Chatbot Functions
function handleChatKeyPressDesktop(event) {
    if (event.key === 'Enter') {
        sendMessageDesktop();
    }
}

function sendMessageDesktop() {
    const input = document.getElementById('chatbotInputDesktop');
    const message = input.value.trim();

    if (!message) return;

    addMessageDesktop(message, 'user');
    input.value = '';

    showTypingIndicatorDesktop();

    setTimeout(() => {
        hideTypingIndicatorDesktop();
        const response = getBotResponse(message);
        addMessageDesktop(response, 'bot');
    }, 1000 + Math.random() * 1000);
}

function sendQuickReplyDesktop(message) {
    addMessageDesktop(message, 'user');
    showTypingIndicatorDesktop();

    setTimeout(() => {
        hideTypingIndicatorDesktop();
        const response = getBotResponse(message);
        addMessageDesktop(response, 'bot');
    }, 1000);
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
                    <p class="text-gray-800 text-xs leading-relaxed">${text}</p>
                </div>
            </div>
        `;
    } else {
        messageDiv.className = 'flex gap-2 mb-3 justify-end';
        messageDiv.innerHTML = `
            <div class="flex-1 flex justify-end">
                <div class="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl rounded-tr-sm shadow-sm max-w-[80%]">
                    <p class="text-white text-xs leading-relaxed">${text}</p>
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

function getBotResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('add') && lowerMessage.includes('course')) {
        return "To add a course, click on 'Add Course' button in your courses section, then browse and select the courses you want to enroll in. 📚";
    }

    if (lowerMessage.includes('schedule')) {
        return "You can view your schedule in the 'My Courses' section on this page. The calendar below shows your upcoming classes and deadlines. 📅";
    }

    if (lowerMessage.includes('assignment')) {
        return "To view your assignments, go to the course page and check the 'Assignments' tab. You can also see upcoming deadlines in your calendar. 📝";
    }

    if (lowerMessage.includes('grade') || lowerMessage.includes('score')) {
        return "Your grades are available in each course page under the 'Grades' section. You can track your progress there. 📊";
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
        return "I'm here to help! You can ask me about courses, schedules, assignments, or any other questions about using Tsharok. What would you like to know? 🤝";
    }

    if (lowerMessage.includes('thank')) {
        return "You're welcome! Feel free to ask if you need anything else. Happy learning! 😊";
    }

    return "I understand you're asking about: \"" + message + "\". While I'm still learning, you can browse the help section or contact support for detailed assistance. Is there anything specific I can help you with? 💡";
}

// Mobile Chatbot Functions
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

function sendMessageMobile() {
    const input = document.getElementById('mobileChatbotInput');
    const message = input.value.trim();

    if (!message) return;

    addMessageMobile(message, 'user');
    input.value = '';

    showTypingIndicatorMobile();

    setTimeout(() => {
        hideTypingIndicatorMobile();
        const response = getBotResponse(message);
        addMessageMobile(response, 'bot');
    }, 1000 + Math.random() * 1000);
}

function sendQuickReplyMobile(message) {
    addMessageMobile(message, 'user');
    showTypingIndicatorMobile();

    setTimeout(() => {
        hideTypingIndicatorMobile();
        const response = getBotResponse(message);
        addMessageMobile(response, 'bot');
    }, 1000);
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
                    <p class="text-gray-800 text-sm">${text}</p>
                </div>
            </div>
        `;
    } else {
        messageDiv.className = 'flex gap-2 mb-3 justify-end';
        messageDiv.innerHTML = `
            <div class="flex-1 flex justify-end">
                <div class="bg-gradient-to-br from-blue-600 to-blue-500 p-3 rounded-xl rounded-tr-sm shadow-sm max-w-[80%]">
                    <p class="text-white text-sm">${text}</p>
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
