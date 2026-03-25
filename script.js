// script.js — Pure frontend UI interaction (no backend / API calls)
// This handles user messages, bot placeholder replies, timestamps,
// and auto-scrolling. Simulates a realistic chat experience.

(function() {
  // DOM elements
  const chatMessagesContainer = document.getElementById('chatMessages');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  // Helper: get current formatted time (HH:MM AM/PM)
  function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // convert hour '0' to '12'
    return `${hours}:${minutes} ${ampm}`;
  }

  // Helper: create a message element (both user & bot)
  function createMessageElement(text, sender, timestamp = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;

    // bubble content
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = text;

    // meta area with time
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

  // Scroll to the bottom of chat messages (smooth)
  function scrollToBottom() {
    if (chatMessagesContainer) {
      chatMessagesContainer.scrollTo({
        top: chatMessagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  // Add a message to the UI and auto-scroll
  function addMessage(text, sender, timestamp = null) {
    if (!text || text.trim() === '') return;
    const messageElement = createMessageElement(text.trim(), sender, timestamp);
    chatMessagesContainer.appendChild(messageElement);
    scrollToBottom();
    return messageElement;
  }

  // Simple bot reply (mimics assistant without backend logic)
  // Generates contextual echoes or friendly responses based on user input.
  function generateBotReply(userMessage) {
    const msg = userMessage.toLowerCase().trim();
    
    // fun, context-aware replies (still frontend only, but feels interactive)
    if (msg === '') return "I'm here! Feel free to ask anything.";
    if (msg.includes('hello') || msg.includes('hi') || msg === 'hey') {
      return "Hello there! 👋 How can I help you today?";
    }
    if (msg.includes('how are you')) {
      return "I'm just a frontend UI, but I'm running smoothly! How about you?";
    }
    if (msg.includes('weather')) {
      return "I'd love to check the weather, but this demo has no backend. ☁️ Try asking something else!";
    }
    if (msg.includes('thank')) {
      return "You're very welcome! 😊 Happy to chat.";
    }
    if (msg.includes('help')) {
      return "I'm a demonstration assistant. You can type any message and I'll reply with a friendly response!";
    }
    if (msg.includes('time')) {
      return `The current time is ${getFormattedTime()}. ⏰`;
    }
    if (msg.includes('name')) {
      return "I'm your chat demo assistant — you can call me Gemini UI. ✨";
    }
    if (msg.includes('bye') || msg.includes('goodbye')) {
      return "Goodbye! Feel free to come back anytime. 👋";
    }
    
    // default creative fallback
    const fallbacks = [
      `That's interesting! Tell me more.`,
      `Thanks for your message! I'm a demo interface without backend, but I'm listening.`,
      `Got it! How does that make you feel? 😄`,
      `I appreciate your input! This is a pure frontend chat.`,
      `Nice! Feel free to keep the conversation going.`
    ];
    const randomIndex = Math.floor(Math.random() * fallbacks.length);
    return fallbacks[randomIndex];
  }

  // Send user message handler (UI update + bot reply simulation)
  function handleSendMessage() {
    const rawMessage = messageInput.value;
    if (!rawMessage || rawMessage.trim() === '') return;

    const userText = rawMessage.trim();
    
    // 1. Add user message to chat with current timestamp
    addMessage(userText, 'user');
    
    // 2. Clear input field
    messageInput.value = '';
    
    // 3. Disable input briefly? optional, but we prevent rapid double-send via small delay
    // But we keep it user-friendly: add a tiny debounce guard.
    // Also show a "typing" effect to mimic realistic bot behavior (modern touch)
    
    // Show typing indicator (transient element)
    const typingIndicator = createTypingIndicator();
    chatMessagesContainer.appendChild(typingIndicator);
    scrollToBottom();
    
    // Simulate bot "thinking" time (modern UI micro interaction)
    setTimeout(() => {
      // Remove typing indicator
      if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.remove();
      }
      
      // Generate bot reply based on user message
      const botReplyText = generateBotReply(userText);
      addMessage(botReplyText, 'bot');
      
      // Extra: small haptic-like scroll (already inside addMessage)
    }, 400 + Math.random() * 200); // between 400ms and 600ms
  }
  
  // Create a neat "typing" indicator (three-dots animation)
  function createTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator-container';
    typingDiv.setAttribute('aria-label', 'Bot is typing');
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble typing-bubble';
    
    const dotsSpan = document.createElement('span');
    dotsSpan.className = 'typing-dots';
    dotsSpan.innerHTML = '<span></span><span></span><span></span>';
    bubbleDiv.appendChild(dotsSpan);
    
    // meta time (optional minimal)
    const metaDiv = document.createElement('div');
    metaDiv.className = 'message-meta';
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = getFormattedTime();
    metaDiv.appendChild(timeSpan);
    
    typingDiv.appendChild(bubbleDiv);
    typingDiv.appendChild(metaDiv);
    
    return typingDiv;
  }
  
  // Add dynamic CSS for typing animation if not already present
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
    `;
    document.head.appendChild(styleSheet);
  }
  
  // Keyboard event: Enter to send
  function onKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (messageInput.value.trim() !== '') {
        handleSendMessage();
      }
    }
  }
  
  // Optional: auto-resize textarea? input is simple, but we also guard.
  // Also allow focusing on load.
  
  // Add example for 'quick reply' to demonstrate smooth user experience?
  // Additional: Prevents sending empty messages when button spamming
  let isSendingLock = false;
  const originalSendHandler = handleSendMessage;
  
  window.handleSendMessage = function() {
    if (isSendingLock) return;
    if (!messageInput.value.trim()) return;
    isSendingLock = true;
    originalSendHandler();
    setTimeout(() => {
      isSendingLock = false;
    }, 600);
  }.bind(this);
  
  // rebind with lock safety
  function safeSend() {
    if (isSendingLock) return;
    if (!messageInput.value.trim()) return;
    isSendingLock = true;
    handleSendMessage();
    setTimeout(() => {
      isSendingLock = false;
    }, 600);
  }
  
  // Event listeners
  sendButton.addEventListener('click', safeSend);
  messageInput.addEventListener('keypress', onKeyPress);
  
  // Focus input on load
  messageInput.focus();
  
  // Inject typing animation styles
  injectTypingStyles();
  
  // Also allow clicking on container to focus input (optional nice UX)
  chatMessagesContainer.addEventListener('click', () => {
    messageInput.focus();
  });
  
  // Simulate initial greeting maybe? Already present in HTML sample.
  // For dynamic consistency, ensure the initial bot message shows correct time formatting.
  // Update timestamp for the static welcome message (from HTML) to current time.
  const existingInitialMessage = document.querySelector('#chatMessages .bot-message');
  if (existingInitialMessage && existingInitialMessage.querySelector('.message-time')) {
    const timeElem = existingInitialMessage.querySelector('.message-time');
    if (timeElem && timeElem.textContent === 'just now') {
      timeElem.textContent = getFormattedTime();
    }
  }
  
  // small helper: if someone pastes huge text, layout stays fine
  // extra improvement: ensure no XSS - we use textContent everywhere.
  console.log('✨ Modern chat UI initialized (frontend only)');
})();