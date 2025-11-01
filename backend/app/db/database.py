"""
Database connection and session management
"""
import asyncpg
from typing import Optional
from app.config import settings


class Database:
    """Database connection pool manager"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create database connection pool"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                settings.DATABASE_URL,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            print("✓ Database connection pool created")
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            print("✓ Database connection pool closed")
    
    async def fetch_all(self, query: str, *args):
        """Execute query and fetch all results"""
        async with self.pool.acquire() as connection:
            return await connection.fetch(query, *args)
    
    async def fetch_one(self, query: str, *args):
        """Execute query and fetch one result"""
        async with self.pool.acquire() as connection:
            return await connection.fetchrow(query, *args)
    
    async def execute(self, query: str, *args):
        """Execute query without returning results"""
        async with self.pool.acquire() as connection:
            return await connection.execute(query, *args)


# Global database instance
db = Database()
