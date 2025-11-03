"""
Redis Cache Client
Gerencia cache de queries do analytics para melhorar performance
"""
import json
import hashlib
from typing import Any, Optional
from redis import asyncio as aioredis
from app.config import settings

class RedisCache:
    """Cliente Redis para cache de queries."""
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.default_ttl = 300  # 5 minutos
    
    async def connect(self):
        """Conectar ao Redis."""
        try:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5
            )
            await self.redis.ping()
            print("✅ Redis conectado com sucesso!")
        except Exception as e:
            print(f"⚠️ Redis não disponível: {e}")
            print("   Sistema continuará sem cache")
            self.redis = None
    
    async def disconnect(self):
        """Desconectar do Redis."""
        if self.redis:
            await self.redis.aclose()
            print("✅ Redis desconectado")
    
    def _generate_key(self, prefix: str, data: dict) -> str:
        """
        Gerar chave única baseada nos dados.
        
        Args:
            prefix: Prefixo da chave (ex: 'analytics:query')
            data: Dados para gerar hash
        
        Returns:
            Chave única
        """
        # Serializar e gerar hash
        data_str = json.dumps(data, sort_keys=True)
        data_hash = hashlib.md5(data_str.encode()).hexdigest()
        return f"{prefix}:{data_hash}"
    
    async def get(self, prefix: str, data: dict) -> Optional[Any]:
        """
        Buscar valor do cache.
        
        Args:
            prefix: Prefixo da chave
            data: Dados para gerar chave
        
        Returns:
            Valor cacheado ou None
        """
        if not self.redis:
            return None
        
        try:
            key = self._generate_key(prefix, data)
            value = await self.redis.get(key)
            
            if value:
                print(f"🎯 Cache HIT: {key[:50]}...")
                return json.loads(value)
            
            print(f"❌ Cache MISS: {key[:50]}...")
            return None
        
        except Exception as e:
            print(f"⚠️ Erro ao buscar do cache: {e}")
            return None
    
    async def set(
        self, 
        prefix: str, 
        data: dict, 
        value: Any, 
        ttl: Optional[int] = None
    ) -> bool:
        """
        Salvar valor no cache.
        
        Args:
            prefix: Prefixo da chave
            data: Dados para gerar chave
            value: Valor a ser cacheado
            ttl: Time to live em segundos (padrão: 300s)
        
        Returns:
            True se salvou com sucesso
        """
        if not self.redis:
            return False
        
        try:
            key = self._generate_key(prefix, data)
            value_str = json.dumps(value, default=str)
            ttl = ttl or self.default_ttl
            
            await self.redis.setex(key, ttl, value_str)
            print(f"💾 Cache SET: {key[:50]}... (TTL: {ttl}s)")
            return True
        
        except Exception as e:
            print(f"⚠️ Erro ao salvar no cache: {e}")
            return False
    
    async def delete(self, prefix: str, data: dict) -> bool:
        """
        Deletar valor do cache.
        
        Args:
            prefix: Prefixo da chave
            data: Dados para gerar chave
        
        Returns:
            True se deletou com sucesso
        """
        if not self.redis:
            return False
        
        try:
            key = self._generate_key(prefix, data)
            await self.redis.delete(key)
            print(f"🗑️ Cache DELETE: {key[:50]}...")
            return True
        
        except Exception as e:
            print(f"⚠️ Erro ao deletar do cache: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """
        Deletar todas as chaves que correspondem ao padrão.
        
        Args:
            pattern: Padrão (ex: 'analytics:*')
        
        Returns:
            Número de chaves deletadas
        """
        if not self.redis:
            return 0
        
        try:
            keys = []
            async for key in self.redis.scan_iter(match=pattern):
                keys.append(key)
            
            if keys:
                deleted = await self.redis.delete(*keys)
                print(f"🗑️ Cache CLEAR: {deleted} chaves deletadas ({pattern})")
                return deleted
            
            return 0
        
        except Exception as e:
            print(f"⚠️ Erro ao limpar cache: {e}")
            return 0
    
    async def get_stats(self) -> dict:
        """
        Obter estatísticas do Redis.
        
        Returns:
            Dict com estatísticas
        """
        if not self.redis:
            return {"connected": False}
        
        try:
            info = await self.redis.info()
            return {
                "connected": True,
                "used_memory_human": info.get("used_memory_human"),
                "total_keys": await self.redis.dbsize(),
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "hit_rate": (
                    info.get("keyspace_hits", 0) / 
                    (info.get("keyspace_hits", 0) + info.get("keyspace_misses", 1))
                ) * 100
            }
        
        except Exception as e:
            print(f"⚠️ Erro ao obter stats: {e}")
            return {"connected": False, "error": str(e)}


# Instância global
redis_cache = RedisCache()
