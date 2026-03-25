# backend/admin.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from main import chat_history

app = FastAPI()

@app.get("/admin", response_class=HTMLResponse)
async def admin_dashboard():
    """Simple admin dashboard to view all chats"""
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Chat Admin Dashboard</title>
        <style>
            body {
                font-family: 'Inter', sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background: #f5f7fa;
            }
            h1 { color: #1e293b; }
            .session {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .session-header {
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }
            .session-id {
                font-family: monospace;
                color: #667eea;
                font-weight: bold;
            }
            .message-count {
                color: #64748b;
                font-size: 0.9em;
            }
            .message {
                padding: 10px;
                margin: 10px 0;
                border-radius: 8px;
            }
            .user-message {
                background: #eef2ff;
                border-left: 4px solid #667eea;
            }
            .bot-message {
                background: #f1f5f9;
                border-left: 4px solid #10b981;
            }
            .timestamp {
                font-size: 0.8em;
                color: #94a3b8;
                margin-top: 5px;
            }
            .refresh-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                margin-bottom: 20px;
            }
            .refresh-btn:hover {
                background: #5a67d8;
            }
        </style>
    </head>
    <body>
        <h1>💬 Chat Admin Dashboard</h1>
        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        <div id="sessions"></div>
        
        <script>
            async function loadSessions() {
                try {
                    const response = await fetch('/sessions');
                    const data = await response.json();
                    
                    const sessionsDiv = document.getElementById('sessions');
                    
                    if (data.total_sessions === 0) {
                        sessionsDiv.innerHTML = '<p>No active sessions yet. Send some messages to see them here!</p>';
                        return;
                    }
                    
                    let html = '';
                    for (const [sessionId, sessionInfo] of Object.entries(data.sessions)) {
                        html += `
                            <div class="session">
                                <div class="session-header">
                                    <div class="session-id">📱 Session: ${sessionId}</div>
                                    <div class="message-count">📊 ${sessionInfo.message_count} messages</div>
                                    <div>🕒 Last updated: ${new Date(sessionInfo.last_updated).toLocaleString()}</div>
                                </div>
                                <div id="messages-${sessionId}">
                                    <em>Loading messages...</em>
                                </div>
                            </div>
                        `;
                    }
                    sessionsDiv.innerHTML = html;
                    
                    // Load messages for each session
                    for (const [sessionId, sessionInfo] of Object.entries(data.sessions)) {
                        loadMessages(sessionId);
                    }
                } catch (error) {
                    console.error('Error loading sessions:', error);
                    document.getElementById('sessions').innerHTML = '<p>Error loading sessions. Make sure the main app is running.</p>';
                }
            }
            
            async function loadMessages(sessionId) {
                try {
                    const response = await fetch(`/history/${sessionId}`);
                    const data = await response.json();
                    
                    let messagesHtml = '';
                    for (const msg of data.messages) {
                        messagesHtml += `
                            <div class="message ${msg.sender}-message">
                                <strong>${msg.sender === 'user' ? '👤 User' : '🤖 Bot'}:</strong>
                                <div>${msg.content}</div>
                                <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
                            </div>
                        `;
                    }
                    
                    document.getElementById(`messages-${sessionId}`).innerHTML = messagesHtml;
                } catch (error) {
                    console.error('Error loading messages:', error);
                }
            }
            
            loadSessions();
            // Auto-refresh every 10 seconds
            setInterval(loadSessions, 10000);
        </script>
    </body>
    </html>
    """
    return html_content