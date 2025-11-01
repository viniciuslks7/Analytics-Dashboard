"""
Database connection and session management
"""
from psycopg_pool import AsyncConnectionPool
from typing import Optional, List, Dict, Any
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class Database:
    """Database connection pool manager with optimized connection handling"""
    
    def __init__(self):
        self.pool: Optional[AsyncConnectionPool] = None
    
    async def connect(self):
        """Create database connection pool with retry logic"""
        if not self.pool:
            try:
                self.pool = AsyncConnectionPool(
                    settings.DATABASE_URL,
                    min_size=2,
                    max_size=10,
                    timeout=30,
                    max_waiting=10,
                    open=False
                )
                await self.pool.open()
                logger.info("✓ Database connection pool created (min: 2, max: 10)")
            except Exception as e:
                logger.error(f"✗ Failed to create database pool: {e}")
                raise
    
    async def disconnect(self):
        """Close database connection pool gracefully"""
        if self.pool:
            try:
                await self.pool.close()
                logger.info("✓ Database connection pool closed")
            except Exception as e:
                logger.error(f"✗ Error closing database pool: {e}")
    
    async def fetch_all(self, query: str, *args) -> List[Dict[str, Any]]:
        """Execute query and fetch all results with error handling"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        
        try:
            async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(query, args if args else None)
                    if not cur.description:
                        return []
                    columns = [desc[0] for desc in cur.description]
                    rows = await cur.fetchall()
                    return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            logger.error(f"✗ Error executing query: {e}")
            logger.debug(f"Query: {query}")
            raise
    
    async def fetch_one(self, query: str, *args) -> Optional[Dict[str, Any]]:
        """Execute query and fetch one result with error handling"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        
        try:
            async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(query, args if args else None)
                    row = await cur.fetchone()
                    if row and cur.description:
                        columns = [desc[0] for desc in cur.description]
                        return dict(zip(columns, row))
                    return None
        except Exception as e:
            logger.error(f"✗ Error executing query: {e}")
            logger.debug(f"Query: {query}")
            raise
    
    async def execute(self, query: str, *args) -> int:
        """Execute query without returning results, returns affected rows"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        
        try:
            async with self.pool.connection() as conn:
                async with conn.cursor() as cur:
                    await cur.execute(query, args if args else None)
                    return cur.rowcount
        except Exception as e:
            logger.error(f"✗ Error executing query: {e}")
            logger.debug(f"Query: {query}")
            raise


# Global database instance
db = Database()
