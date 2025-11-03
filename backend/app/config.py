"""
Configuration settings for the Restaurant Analytics API
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    DATABASE_URL: str = "postgresql://challenge:challenge@localhost:5432/challenge_db"
    
    # Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 300  # 5 minutos
    
    # API
    API_TITLE: str = "Restaurant Analytics API"
    API_VERSION: str = "1.0.0"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS - Allow multiple origins from environment
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Add ALLOWED_ORIGINS from environment to CORS_ORIGINS
        allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
        if allowed_origins:
            additional_origins = [origin.strip() for origin in allowed_origins.split(",")]
            self.CORS_ORIGINS.extend(additional_origins)
        
        # Set DEBUG based on ENVIRONMENT
        if self.ENVIRONMENT == "production":
            self.DEBUG = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
