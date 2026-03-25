from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from typing import List, Dict
import time
from datetime import datetime
import logging

from config import settings
from models import ChatRequest, ChatResponse, HealthResponse, Message

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
chat_history: Dict[str, List[Message]] = {}

def generate_bot_response(user_message: str) -> str:
    """Generate a bot response based on user input"""
    msg_lower = user_message.lower().strip()
    
    responses = {
        "hello": "Hello! How can I assist you today?",
        "hi": "Hi there! What can I do for you?",
        "hey": "Hey! How can I help?",
        "how are you": "I'm doing great! Thanks for asking. How about you?",
        "what is your name": "I'm your AI assistant powered by FastAPI!",
        "weather": "I don't have access to weather data yet. You'd need to integrate a weather API for that!",
        "help": "I can help with general questions. Just ask me anything!",
        "thank you": "You're very welcome! 😊",
        "thanks": "Happy to help! 🙌",
        "bye": "Goodbye! Have a great day! 👋",
        "time": f"The current server time is {datetime.now().strftime('%H:%M:%S')}",
    }
    
    for keyword, response in responses.items():
        if keyword in msg_lower:
            return response
    
    default_responses = [
        "Interesting! Tell me more about that.",
        "I'm still learning. Could you rephrase that?",
        "Thanks for your message! I'll process that.",
        f"You said: '{user_message}'. That's fascinating!",
        "I appreciate your input! How else can I help?"
    ]
    
    import random
    return random.choice(default_responses)

@app.get("/")
async def root():
    """Root endpoint - returns API information"""
    logger.info("Root endpoint accessed")
    return {
        "message": "ChatBot API is running!",
        "status": "healthy",
        "version": settings.APP_VERSION,
        "endpoints": {
            "GET /": "API information",
            "GET /health": "Health check",
            "GET /admin": "Admin dashboard",
            "POST /chat": "Send a message to the chatbot",
            "GET /sessions": "List all active sessions",
            "GET /history/{session_id}": "Get conversation history",
            "DELETE /history/{session_id}": "Clear conversation history"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring"""
    logger.debug("Health check accessed")
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION
    )

@app.get("/sessions")
async def list_sessions():
    """List all active sessions"""
    logger.info("📋 Listing all active sessions")
    
    sessions_info = {}
    for session_id, messages in chat_history.items():
        sessions_info[session_id] = {
            "message_count": len(messages),
            "first_message": messages[0].content if messages else None,
            "last_message": messages[-1].content if messages else None,
            "last_updated": messages[-1].timestamp.isoformat() if messages else None
        }
    
    logger.info(f"✅ Found {len(sessions_info)} active sessions")
    return {"total_sessions": len(sessions_info), "sessions": sessions_info}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    POST endpoint for chat messages
    Accepts JSON with "message" field and returns a reply
    """
    try:
        user_message = request.message
        session_id = request.session_id or f"session_{int(time.time())}"
        
        # Log incoming message
        logger.info(f"📥 Received message from {session_id}: '{user_message}'")
        
        # Generate bot response
        bot_reply = generate_bot_response(user_message)
        
        # Log outgoing response
        logger.info(f"📤 Sending response to {session_id}: '{bot_reply}'")
        
        # Store in history
        if session_id not in chat_history:
            chat_history[session_id] = []
            logger.info(f"🆕 Created new session: {session_id}")
        
        # Add user message to history
        user_message_obj = Message(
            content=user_message,
            sender="user",
            timestamp=datetime.now()
        )
        chat_history[session_id].append(user_message_obj)
        
        # Add bot message to history
        bot_message_obj = Message(
            content=bot_reply,
            sender="bot",
            timestamp=datetime.now()
        )
        chat_history[session_id].append(bot_message_obj)
        
        # Log session statistics
        message_count = len(chat_history[session_id])
        logger.info(f"📊 Session {session_id} now has {message_count} messages")
        
        return ChatResponse(
            reply=bot_reply,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"❌ Error processing message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@app.get("/history/{session_id}")
async def get_history(session_id: str):
    """Retrieve chat history for a specific session"""
    logger.info(f"📖 Fetching history for session: {session_id}")
    
    if session_id not in chat_history:
        logger.warning(f"⚠️ Session not found: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    message_count = len(chat_history[session_id])
    logger.info(f"✅ Retrieved {message_count} messages for session {session_id}")
    
    return {"session_id": session_id, "messages": chat_history[session_id]}

@app.delete("/history/{session_id}")
async def clear_history(session_id: str):
    """Clear chat history for a specific session"""
    logger.info(f"🗑️ Clearing history for session: {session_id}")
    
    if session_id in chat_history:
        message_count = len(chat_history[session_id])
        del chat_history[session_id]
        logger.info(f"✅ Cleared {message_count} messages for session {session_id}")
        return {"message": f"History cleared for session {session_id}"}
    
    logger.warning(f"⚠️ Attempted to clear non-existent session: {session_id}")
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Session not found"
    )

@app.get("/admin", response_class=HTMLResponse)
async def admin_dashboard():
    """Admin dashboard to view all chats"""
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Chat Admin Dashboard</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .header {
                background: white;
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            h1 {
                color: #1e293b;
                font-size: 28px;
                margin-bottom: 8px;
            }
            
            .subtitle {
                color: #64748b;
                margin-bottom: 16px;
            }
            
            .refresh-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            
            .refresh-btn:hover {
                background: #5a67d8;
                transform: translateY(-1px);
            }
            
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .stat-number {
                font-size: 32px;
                font-weight: bold;
                color: #667eea;
            }
            
            .stat-label {
                color: #64748b;
                margin-top: 8px;
            }
            
            .session {
                background: white;
                border-radius: 12px;
                margin-bottom: 20px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: all 0.2s;
            }
            
            .session:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .session-header {
                background: #f8fafc;
                padding: 16px 20px;
                cursor: pointer;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .session-header:hover {
                background: #f1f5f9;
            }
            
            .session-id {
                font-family: monospace;
                color: #667eea;
                font-weight: 600;
                font-size: 14px;
            }
            
            .session-info {
                display: flex;
                gap: 20px;
                color: #64748b;
                font-size: 13px;
                margin-top: 5px;
            }
            
            .message-count {
                background: #e2e8f0;
                padding: 4px 8px;
                border-radius: 20px;
            }
            
            .toggle-icon {
                font-size: 20px;
                transition: transform 0.2s;
            }
            
            .session.expanded .toggle-icon {
                transform: rotate(180deg);
            }
            
            .session-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-out;
            }
            
            .session.expanded .session-content {
                max-height: 2000px;
            }
            
            .messages-container {
                padding: 20px;
            }
            
            .message {
                padding: 12px 16px;
                margin: 12px 0;
                border-radius: 12px;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .user-message {
                background: #eef2ff;
                border-left: 4px solid #667eea;
            }
            
            .bot-message {
                background: #f1f5f9;
                border-left: 4px solid #10b981;
            }
            
            .message-sender {
                font-weight: 600;
                margin-bottom: 6px;
                font-size: 13px;
            }
            
            .user-message .message-sender {
                color: #667eea;
            }
            
            .bot-message .message-sender {
                color: #10b981;
            }
            
            .message-content {
                color: #1e293b;
                line-height: 1.5;
                word-wrap: break-word;
            }
            
            .timestamp {
                font-size: 11px;
                color: #94a3b8;
                margin-top: 6px;
            }
            
            .delete-btn {
                background: #ef4444;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }
            
            .delete-btn:hover {
                background: #dc2626;
            }
            
            .loading {
                text-align: center;
                padding: 40px;
                color: #64748b;
            }
            
            .empty-state {
                text-align: center;
                padding: 60px;
                color: #64748b;
                background: white;
                border-radius: 12px;
            }
            
            @media (max-width: 640px) {
                .session-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .session-info {
                    flex-wrap: wrap;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💬 Chat Admin Dashboard</h1>
                <div class="subtitle">Monitor and manage all chat conversations in real-time</div>
                <button class="refresh-btn" onclick="refreshAll()">🔄 Refresh Data</button>
            </div>
            
            <div id="stats" class="stats"></div>
            <div id="sessions"></div>
        </div>
        
        <script>
            let sessionsData = {};
            
            async function fetchSessions() {
                try {
                    const response = await fetch('/sessions');
                    if (!response.ok) throw new Error('Failed to fetch sessions');
                    const data = await response.json();
                    sessionsData = data.sessions || {};
                    return data;
                } catch (error) {
                    console.error('Error fetching sessions:', error);
                    return { total_sessions: 0, sessions: {} };
                }
            }
            
            async function fetchHistory(sessionId) {
                try {
                    const response = await fetch(`/history/${sessionId}`);
                    if (!response.ok) throw new Error('Failed to fetch history');
                    const data = await response.json();
                    return data.messages || [];
                } catch (error) {
                    console.error('Error fetching history:', error);
                    return [];
                }
            }
            
            async function deleteSession(sessionId) {
                if (!confirm(`Are you sure you want to delete this session?`)) return;
                
                try {
                    const response = await fetch(`/history/${sessionId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        refreshAll();
                    } else {
                        alert('Failed to delete session');
                    }
                } catch (error) {
                    console.error('Error deleting session:', error);
                    alert('Error deleting session');
                }
            }
            
            function formatTimestamp(timestamp) {
                if (!timestamp) return 'Unknown';
                const date = new Date(timestamp);
                return date.toLocaleString();
            }
            
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
            
            function toggleSession(sessionId) {
                const session = document.getElementById(`session-${sessionId}`);
                if (session) {
                    session.classList.toggle('expanded');
                }
            }
            
            async function renderDashboard() {
                const sessionsDiv = document.getElementById('sessions');
                const statsDiv = document.getElementById('stats');
                
                sessionsDiv.innerHTML = '<div class="loading">Loading sessions...</div>';
                
                const data = await fetchSessions();
                const totalSessions = data.total_sessions || 0;
                
                // Calculate total messages
                let totalMessages = 0;
                for (const session of Object.values(sessionsData)) {
                    totalMessages += session.message_count || 0;
                }
                
                // Render stats
                statsDiv.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-number">${totalSessions}</div>
                        <div class="stat-label">Active Sessions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${totalMessages}</div>
                        <div class="stat-label">Total Messages</div>
                    </div>
                `;
                
                if (totalSessions === 0) {
                    sessionsDiv.innerHTML = `
                        <div class="empty-state">
                            <h3>No active sessions yet</h3>
                            <p>Send some messages to the chatbot to see them here!</p>
                        </div>
                    `;
                    return;
                }
                
                let sessionsHtml = '';
                for (const [sessionId, sessionInfo] of Object.entries(sessionsData)) {
                    const messages = await fetchHistory(sessionId);
                    const lastUpdated = sessionInfo.last_updated || new Date().toISOString();
                    const safeId = sessionId.replace(/[^a-zA-Z0-9]/g, '_');
                    
                    sessionsHtml += `
                        <div class="session" id="session-${safeId}">
                            <div class="session-header" onclick="toggleSession('${safeId}')">
                                <div>
                                    <div class="session-id">📱 ${escapeHtml(sessionId)}</div>
                                    <div class="session-info">
                                        <span class="message-count">${messages.length} messages</span>
                                        <span>🕒 Last updated: ${formatTimestamp(lastUpdated)}</span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <button class="delete-btn" onclick="event.stopPropagation(); deleteSession('${escapeHtml(sessionId)}')">🗑️ Delete</button>
                                    <span class="toggle-icon">▼</span>
                                </div>
                            </div>
                            <div class="session-content">
                                <div class="messages-container">
                                    ${messages.map(msg => `
                                        <div class="message ${msg.sender}-message">
                                            <div class="message-sender">
                                                ${msg.sender === 'user' ? '👤 User' : '🤖 Bot'}
                                            </div>
                                            <div class="message-content">${escapeHtml(msg.content)}</div>
                                            <div class="timestamp">${formatTimestamp(msg.timestamp)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                sessionsDiv.innerHTML = sessionsHtml;
            }
            
            async function refreshAll() {
                await renderDashboard();
            }
            
            // Auto-refresh every 10 seconds
            renderDashboard();
            setInterval(renderDashboard, 10000);
        </script>
    </body>
    </html>
    """
    return html_content