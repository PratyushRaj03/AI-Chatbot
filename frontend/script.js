// script.js — Optimized Chatbot with Smooth UI Experience

(function() {
    // DOM elements
    const chatMessagesContainer = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    // Backend configuration
    const BACKEND_URL = 'http://localhost:8000';
    let sessionId = null;
    let isBackendConnected = false;
    let isSending = false; // Prevent multiple simultaneous sends
    
    // Helper: Get current formatted time
    function getFormattedTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    }
    
    // Helper: Create a message element
    function createMessageElement(text, sender, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = text;
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = timestamp || getFormattedTime();
        metaDiv.appendChild(timeSpan);
        
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(metaDiv);
        
        // Animate message appearance
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
        
        return messageDiv;
    }
    
    // Scroll to bottom smoothly
    function scrollToBottom() {
        if (chatMessagesContainer) {
            chatMessagesContainer.scrollTo({
                top: chatMessagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    
    // Add message to UI with animation
    function addMessage(text, sender, timestamp = null) {
        if (!text || text.trim() === '') return;
        const messageElement = createMessageElement(text.trim(), sender, timestamp);
        chatMessagesContainer.appendChild(messageElement);
        scrollToBottom();
        return messageElement;
    }
    
    // Typing indicator management
    let typingIndicatorElement = null;
    
    function showTypingIndicator() {
        removeTypingIndicator();
        
        typingIndicatorElement = document.createElement('div');
        typingIndicatorElement.className = 'message bot-message typing-indicator-container';
        typingIndicatorElement.style.opacity = '0';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble typing-bubble';
        
        const dotsSpan = document.createElement('span');
        dotsSpan.className = 'typing-dots';
        dotsSpan.innerHTML = '<span></span><span></span><span></span>';
        bubbleDiv.appendChild(dotsSpan);
        
        const metaDiv = document.createElement('div');
        metaDiv.className = 'message-meta';
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = getFormattedTime();
        metaDiv.appendChild(timeSpan);
        
        typingIndicatorElement.appendChild(bubbleDiv);
        typingIndicatorElement.appendChild(metaDiv);
        
        chatMessagesContainer.appendChild(typingIndicatorElement);
        
        // Fade in animation
        setTimeout(() => {
            if (typingIndicatorElement) {
                typingIndicatorElement.style.transition = 'opacity 0.2s ease';
                typingIndicatorElement.style.opacity = '1';
            }
        }, 10);
        
        scrollToBottom();
    }
    
    function removeTypingIndicator() {
        if (typingIndicatorElement && typingIndicatorElement.parentNode) {
            typingIndicatorElement.style.transition = 'opacity 0.2s ease';
            typingIndicatorElement.style.opacity = '0';
            setTimeout(() => {
                if (typingIndicatorElement && typingIndicatorElement.parentNode) {
                    typingIndicatorElement.remove();
                }
                typingIndicatorElement = null;
            }, 200);
        }
    }
    
    // Add system message
    function addSystemMessage(text, type = 'info') {
        const systemDiv = document.createElement('div');
        systemDiv.className = `system-message ${type}`;
        systemDiv.textContent = text;
        systemDiv.style.cssText = `
            text-align: center;
            font-size: 0.75rem;
            color: ${type === 'error' ? '#dc2626' : '#10b981'};
            background: ${type === 'error' ? '#fee2e2' : '#d1fae5'};
            padding: 0.5rem;
            border-radius: 8px;
            margin: 0.5rem 0;
            font-weight: 500;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        chatMessagesContainer.appendChild(systemDiv);
        
        // Animate in
        setTimeout(() => {
            systemDiv.style.opacity = '1';
            systemDiv.style.transform = 'translateY(0)';
        }, 10);
        
        scrollToBottom();
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (systemDiv.parentNode) {
                systemDiv.style.opacity = '0';
                systemDiv.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (systemDiv.parentNode) systemDiv.remove();
                }, 300);
            }
        }, 5000);
    }
    
    // Check backend connection
    async function checkBackendConnection() {
        try {
            const response = await fetch(`${BACKEND_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });
            
            if (response.ok) {
                isBackendConnected = true;
                console.log('✅ Backend connected');
                return true;
            } else {
                throw new Error('Backend not responding');
            }
        } catch (error) {
            isBackendConnected = false;
            console.error('❌ Backend connection failed:', error.message);
            return false;
        }
    }
    
    // Send message to backend API
    async function sendMessageToBackend(userMessage) {
        // Generate session ID if not exists
        if (!sessionId) {
            sessionId = 'session_' + Date.now();
        }
        
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                session_id: sessionId
            }),
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get response');
        }
        
        const data = await response.json();
        return data.reply;
    }
    
    // UPDATED: Main send message function with optimized flow
    async function handleSendMessage() {
        // Prevent multiple simultaneous sends
        if (isSending) return;
        
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;
        
        isSending = true;
        
        // Step 1: Display user message instantly
        addMessage(userMessage, 'user');
        
        // Step 2: Clear input and disable controls immediately
        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;
        
        // Step 3: Show typing indicator
        showTypingIndicator();
        
        try {
            // Step 4: Send request to backend API
            const botReply = await sendMessageToBackend(userMessage);
            
            // Step 5: Remove typing indicator
            removeTypingIndicator();
            
            // Step 6: Display bot response in UI
            addMessage(botReply, 'bot');
            
        } catch (error) {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Show error message
            const errorMessage = error.message || 'Failed to connect to backend. Please check if the server is running.';
            addMessage(`❌ Error: ${errorMessage}`, 'bot');
            
            // Try to reconnect
            await checkBackendConnection();
            
        } finally {
            // Re-enable controls
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
            isSending = false;
        }
    }
    
    // Clear conversation history
    async function clearHistory() {
        if (!sessionId) {
            addSystemMessage('No active session to clear', 'info');
            return;
        }
        
        try {
            const response = await fetch(`${BACKEND_URL}/history/${sessionId}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                addSystemMessage('Conversation history cleared', 'success');
                
                // Clear all messages with animation
                const messages = document.querySelectorAll('.message');
                messages.forEach((msg, index) => {
                    setTimeout(() => {
                        msg.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                        msg.style.opacity = '0';
                        msg.style.transform = 'translateX(-10px)';
                        setTimeout(() => msg.remove(), 200);
                    }, index * 50);
                });
                
                // Add welcome message back after clearing
                setTimeout(() => {
                    addMessage("Hello! I'm your AI assistant. How can I help you today? ✨", 'bot');
                }, messages.length * 50 + 100);
            } else {
                throw new Error('Failed to clear history');
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            addSystemMessage('Failed to clear history', 'error');
        }
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to clear
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            clearHistory();
        }
        
        // Escape to clear input
        if (e.key === 'Escape' && !messageInput.disabled) {
            messageInput.value = '';
        }
    });
    
    // Inject styles
    function injectStyles() {
        if (document.getElementById('chatbotStyles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'chatbotStyles';
        styleSheet.textContent = `
            /* Typing indicator styles */
            .typing-indicator-container .typing-bubble {
                background: #ffffff;
                border: 1px solid #e9eef3;
                padding: 0.65rem 1rem;
                border-radius: 22px;
                border-bottom-left-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 56px;
            }
            
            .typing-dots {
                display: inline-flex;
                gap: 4px;
                align-items: center;
            }
            
            .typing-dots span {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: #94a3b8;
                display: inline-block;
                animation: typingBounce 1.2s infinite ease-in-out both;
            }
            
            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes typingBounce {
                0%, 80%, 100% {
                    transform: scale(0.6);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            /* Disabled input styling */
            .chat-input:disabled, .send-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            /* Connection status indicator */
            .connection-status-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #ef4444;
                margin-left: 8px;
                animation: pulse 2s infinite;
            }
            
            .connection-status-indicator.connected {
                background-color: #10b981;
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(0.95);
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                }
                70% {
                    transform: scale(1);
                    box-shadow: 0 0 0 5px rgba(16, 185, 129, 0);
                }
                100% {
                    transform: scale(0.95);
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                }
            }
            
            /* Clear button hover effect */
            .clear-history-btn:hover {
                background: #f1f5f9 !important;
            }
            
            /* Smooth message animations */
            .message {
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
        `;
        document.head.appendChild(styleSheet);
    }
    
    // Add connection indicator
    function addConnectionIndicator() {
        const headerContent = document.querySelector('.header-content');
        if (headerContent && !document.querySelector('.connection-status-indicator')) {
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'connection-status-indicator';
            statusIndicator.id = 'connectionIndicator';
            headerContent.appendChild(statusIndicator);
        }
    }
    
    function updateConnectionIndicator(connected) {
        const indicator = document.getElementById('connectionIndicator');
        if (indicator) {
            if (connected) {
                indicator.classList.add('connected');
            } else {
                indicator.classList.remove('connected');
            }
        }
    }
    
    // Add clear button
    function addClearButton() {
        const headerContent = document.querySelector('.header-content');
        if (headerContent && !document.querySelector('.clear-history-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.textContent = 'Clear';
            clearBtn.className = 'clear-history-btn';
            clearBtn.style.cssText = `
                background: none;
                border: 1px solid #e2e8f0;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.75rem;
                cursor: pointer;
                color: #64748b;
                transition: all 0.2s;
                margin-left: 12px;
            `;
            clearBtn.onmouseover = () => { clearBtn.style.background = '#f1f5f9'; };
            clearBtn.onmouseout = () => { clearBtn.style.background = 'none'; };
            clearBtn.onclick = clearHistory;
            headerContent.appendChild(clearBtn);
        }
    }
    
    // Monitor connection
    let connectionCheckInterval;
    
    function startConnectionMonitoring() {
        checkBackendConnection().then(connected => {
            updateConnectionIndicator(connected);
        });
        
        connectionCheckInterval = setInterval(async () => {
            const connected = await checkBackendConnection();
            updateConnectionIndicator(connected);
        }, 30000);
    }
    
    // Initialize
    async function initialize() {
        injectStyles();
        addConnectionIndicator();
        addClearButton();
        
        // Update welcome message timestamp
        const existingInitialMessage = document.querySelector('#chatMessages .bot-message');
        if (existingInitialMessage && existingInitialMessage.querySelector('.message-time')) {
            const timeElem = existingInitialMessage.querySelector('.message-time');
            if (timeElem && timeElem.textContent === 'just now') {
                timeElem.textContent = getFormattedTime();
            }
        }
        
        await checkBackendConnection();
        updateConnectionIndicator(isBackendConnected);
        startConnectionMonitoring();
        
        sendButton.addEventListener('click', handleSendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !messageInput.disabled && !isSending) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        messageInput.focus();
        console.log('✨ Chat UI initialized - Ready for messages!');
    }
    
    initialize();
})();
