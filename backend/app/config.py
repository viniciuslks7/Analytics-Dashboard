"""
Configuration settings for the Restaurant Analytics API
"""
from pydantic_settings import BaseSettings
from typing import List


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
    API_PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
