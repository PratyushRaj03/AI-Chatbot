// script.js — Complete frontend with FastAPI backend connection

(function() {
    // DOM elements
    const chatMessagesContainer = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    // Backend configuration
    const BACKEND_URL = 'http://localhost:8000';  // Change this to your backend URL
    let sessionId = null;  // Will store session ID for conversation history
    let isBackendConnected = false;
    
    // Helper: Get current formatted time (HH:MM AM/PM)
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
        
        return messageDiv;
    }
    
    // Scroll to bottom
    function scrollToBottom() {
        if (chatMessagesContainer) {
            chatMessagesContainer.scrollTo({
                top: chatMessagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
    
    // Add message to UI
    function addMessage(text, sender, timestamp = null) {
        if (!text || text.trim() === '') return;
        const messageElement = createMessageElement(text.trim(), sender, timestamp);
        chatMessagesContainer.appendChild(messageElement);
        scrollToBottom();
        return messageElement;
    }
    
    // Show typing indicator
    let typingIndicatorElement = null;
    
    function showTypingIndicator() {
        removeTypingIndicator();
        
        typingIndicatorElement = document.createElement('div');
        typingIndicatorElement.className = 'message bot-message typing-indicator-container';
        
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
        scrollToBottom();
    }
    
    function removeTypingIndicator() {
        if (typingIndicatorElement && typingIndicatorElement.parentNode) {
            typingIndicatorElement.remove();
            typingIndicatorElement = null;
        }
    }
    
    // Check backend connection status
    async function checkBackendConnection() {
        try {
            const response = await fetch(`${BACKEND_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 5000  // 5 second timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                isBackendConnected = true;
                console.log('✅ Backend connected:', data);
                
                // Add connection status message (only if not already present)
                const statusMessage = document.querySelector('.connection-status');
                if (!statusMessage) {
                    addSystemMessage('✅ Connected to backend server', 'success');
                }
                return true;
            } else {
                throw new Error('Backend not responding');
            }
        } catch (error) {
            isBackendConnected = false;
            console.error('❌ Backend connection failed:', error);
            addSystemMessage('⚠️ Backend server not connected. Please make sure the server is running on ' + BACKEND_URL, 'error');
            return false;
        }
    }
    
    // Add system message (for connection status, errors, etc.)
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
        `;
        chatMessagesContainer.appendChild(systemDiv);
        scrollToBottom();
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (systemDiv.parentNode) {
                systemDiv.remove();
            }
        }, 5000);
    }
    
    // Send message to backend
    async function sendMessageToBackend(userMessage) {
        try {
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
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to get response');
            }
            
            const data = await response.json();
            return data.reply;
            
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error(error.message || 'Network error. Make sure the backend server is running.');
        }
    }
    
    // Main send message handler
    async function handleSendMessage() {
        const userMessage = messageInput.value.trim();
        if (!userMessage) return;
        
        // Disable input while processing
        messageInput.disabled = true;
        sendButton.disabled = true;
        
        // Add user message to chat
        addMessage(userMessage, 'user');
        messageInput.value = '';
        
        // Check backend connection first
        if (!isBackendConnected) {
            await checkBackendConnection();
        }
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Get bot response from backend
            const botReply = await sendMessageToBackend(userMessage);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add bot response to chat
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
            // Re-enable input
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
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
                // Clear messages from UI (keep system messages)
                const messages = document.querySelectorAll('.message, .system-message');
                messages.forEach(msg => msg.remove());
                
                // Add welcome message back
                addMessage("Hello! I'm your AI assistant. How can I help you today? ✨", 'bot');
            } else {
                throw new Error('Failed to clear history');
            }
        } catch (error) {
            console.error('Error clearing history:', error);
            addSystemMessage('Failed to clear history', 'error');
        }
    }
    
    // Add keyboard shortcut (Ctrl/Cmd + K to clear)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            clearHistory();
        }
    });
    
    // Inject typing animation styles (if not already present)
    function injectTypingStyles() {
        if (document.getElementById('typingAnimationStyles')) return;
        const styleSheet = document.createElement('style');
        styleSheet.id = 'typingAnimationStyles';
        styleSheet.textContent = `
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
            .typing-dots span:nth-child(1) {
                animation-delay: -0.32s;
            }
            .typing-dots span:nth-child(2) {
                animation-delay: -0.16s;
            }
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
            
            /* Connection status indicator in header */
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
        `;
        document.head.appendChild(styleSheet);
    }
    
    // Add connection status to header
    function addConnectionIndicator() {
        const headerContent = document.querySelector('.header-content');
        if (headerContent && !document.querySelector('.connection-status-indicator')) {
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'connection-status-indicator';
            statusIndicator.id = 'connectionIndicator';
            headerContent.appendChild(statusIndicator);
        }
    }
    
    // Update connection indicator
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
    
    // Periodically check backend connection
    let connectionCheckInterval;
    
    function startConnectionMonitoring() {
        // Check immediately
        checkBackendConnection().then(connected => {
            updateConnectionIndicator(connected);
        });
        
        // Then check every 30 seconds
        connectionCheckInterval = setInterval(async () => {
            const connected = await checkBackendConnection();
            updateConnectionIndicator(connected);
        }, 30000);
    }
    
    // Initialize the chat
    async function initialize() {
        // Inject styles
        injectTypingStyles();
        
        // Add connection indicator to header
        addConnectionIndicator();
        
        // Update welcome message timestamp
        const existingInitialMessage = document.querySelector('#chatMessages .bot-message');
        if (existingInitialMessage && existingInitialMessage.querySelector('.message-time')) {
            const timeElem = existingInitialMessage.querySelector('.message-time');
            if (timeElem && timeElem.textContent === 'just now') {
                timeElem.textContent = getFormattedTime();
            }
        }
        
        // Check backend connection
        await checkBackendConnection();
        updateConnectionIndicator(isBackendConnected);
        
        // Start monitoring connection
        startConnectionMonitoring();
        
        // Add event listeners
        sendButton.addEventListener('click', handleSendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !messageInput.disabled) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        // Focus input
        messageInput.focus();
        
        console.log('✨ Chat UI initialized with backend connection at', BACKEND_URL);
    }
    
    // Add clear history button to UI (optional)
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
            `;
            clearBtn.onmouseover = () => {
                clearBtn.style.background = '#f1f5f9';
            };
            clearBtn.onmouseout = () => {
                clearBtn.style.background = 'none';
            };
            clearBtn.onclick = clearHistory;
            headerContent.appendChild(clearBtn);
        }
    }
    
    // Add clear button
    addClearButton();
    
    // Start the application
    initialize();
})();