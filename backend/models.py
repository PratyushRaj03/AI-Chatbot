from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Message(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    sender: str
    timestamp: Optional[datetime] = None
    
    class Config:
        arbitrary_types_allowed = True

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., min_length=1, max_length=1000, description="The user's message")
    session_id: Optional[str] = Field(None, description="Optional session ID for conversation tracking")

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    reply: str = Field(..., description="The bot's reply")
    sender: str = Field("bot", description="Message sender (always 'bot')")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    app_name: str
    version: str