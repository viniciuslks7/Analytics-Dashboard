"""
Database connection and session management
"""
from psycopg_pool import AsyncConnectionPool
from typing import Optional
from app.config import settings


class Database:
    """Database connection pool manager"""
    
    def __init__(self):
        self.pool: Optional[AsyncConnectionPool] = None
    
    async def connect(self):
        """Create database connection pool"""
        if not self.pool:
            self.pool = AsyncConnectionPool(
                settings.DATABASE_URL,
                min_size=5,
                max_size=20,
                timeout=60,
                open=False
            )
            await self.pool.open()
            print("✓ Database connection pool created")
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            print("✓ Database connection pool closed")
    
    async def fetch_all(self, query: str, *args):
        """Execute query and fetch all results"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, args if args else None)
                columns = [desc[0] for desc in cur.description]
                rows = await cur.fetchall()
                return [dict(zip(columns, row)) for row in rows]
    
    async def fetch_one(self, query: str, *args):
        """Execute query and fetch one result"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, args if args else None)
                row = await cur.fetchone()
                if row:
                    columns = [desc[0] for desc in cur.description]
                    return dict(zip(columns, row))
                return None
    
    async def execute(self, query: str, *args):
        """Execute query without returning results"""
        async with self.pool.connection() as conn:
            async with conn.cursor() as cur:
                return await cur.execute(query, args if args else None)


# Global database instance
db = Database()
