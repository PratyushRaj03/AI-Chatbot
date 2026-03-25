import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    """Application settings loaded from environment variables"""
    
    # API Settings
    APP_NAME: str = os.getenv("APP_NAME", "ChatBot API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS Settings - Development
    # For development, allow all origins
    ALLOW_ORIGINS: list = ["*"]
    ALLOW_METHODS: list = ["*"]
    ALLOW_HEADERS: list = ["*"]
    
    # CORS Settings - Production (commented)
    # Use this for production with specific origins
    # ALLOW_ORIGINS: list = [
    #     "https://yourdomain.com",
    #     "https://app.yourdomain.com",
    #     "http://localhost:3000",
    #     "http://localhost:5500",
    # ]
    # ALLOW_METHODS: list = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    # ALLOW_HEADERS: list = ["Content-Type", "Authorization", "Accept"]
    
    # Optional: Add your API keys here if integrating with real AI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()