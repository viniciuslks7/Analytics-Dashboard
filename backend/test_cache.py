"""
Script de teste para validar Redis Cache
Testa: Cache HIT/MISS, TTL, Stats, Clear
"""
import asyncio
import httpx
import json
import time
from datetime import date, timedelta

BASE_URL = "http://localhost:8000"

async def test_cache_hit_miss():
    """Teste 1: Cache HIT/MISS"""
    print("\n" + "="*80)
    print("🧪 TESTE 1: Cache HIT/MISS")
    print("="*80)
    
    query = {
        "metrics": ["faturamento", "ticket_medio"],
        "dimensions": ["channel"],
        "date_range": {
            "start_date": str(date.today() - timedelta(days=30)),
            "end_date": str(date.today())
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Request 1 - Deve ser MISS (primeira vez)
        print("\n📤 Request 1 (esperando MISS)...")
        start = time.time()
        r1 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=query)
        time1 = (time.time() - start) * 1000
        
        if r1.status_code == 200:
            data1 = r1.json()
            from_cache_1 = data1.get("metadata", {}).get("from_cache", False)
            query_time_1 = data1.get("metadata", {}).get("query_time_ms", 0)
            total_rows = data1.get("metadata", {}).get("total_rows", 0)
            
            print(f"✅ Status: {r1.status_code}")
            print(f"   From Cache: {from_cache_1}")
            print(f"   Query Time: {query_time_1:.2f}ms")
            print(f"   Total Time: {time1:.2f}ms")
            print(f"   Rows: {total_rows}")
            
            if from_cache_1:
                print("   ⚠️ WARNING: Esperava MISS, mas foi HIT (cache já existia)")
            else:
                print("   ✅ Correto: Cache MISS na primeira request")
        else:
            print(f"❌ Erro: {r1.status_code}")
            print(r1.text)
            return
        
        # Request 2 - Deve ser HIT (imediato)
        print("\n📤 Request 2 (esperando HIT)...")
        await asyncio.sleep(0.1)  # Pequeno delay
        start = time.time()
        r2 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=query)
        time2 = (time.time() - start) * 1000
        
        if r2.status_code == 200:
            data2 = r2.json()
            from_cache_2 = data2.get("metadata", {}).get("from_cache", False)
            query_time_2 = data2.get("metadata", {}).get("query_time_ms", 0)
            
            print(f"✅ Status: {r2.status_code}")
            print(f"   From Cache: {from_cache_2}")
            print(f"   Query Time: {query_time_2:.2f}ms")
            print(f"   Total Time: {time2:.2f}ms")
            
            if from_cache_2:
                improvement = ((time1 - time2) / time1) * 100
                print(f"   ✅ Correto: Cache HIT na segunda request")
                print(f"   🚀 Performance: {improvement:.1f}% mais rápido")
            else:
                print("   ❌ ERRO: Esperava HIT, mas foi MISS")
        else:
            print(f"❌ Erro: {r2.status_code}")
            print(r2.text)


async def test_cache_stats():
    """Teste 2: Cache Stats"""
    print("\n" + "="*80)
    print("📊 TESTE 2: Cache Stats")
    print("="*80)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("\n📤 Consultando /api/v1/analytics/cache/stats...")
        r = await client.get(f"{BASE_URL}/api/v1/analytics/cache/stats")
        
        if r.status_code == 200:
            stats = r.json()
            print(f"✅ Status: {r.status_code}")
            print(f"\n📊 Estatísticas do Redis:")
            print(f"   Status: {stats.get('status', 'unknown')}")
            print(f"   Memory Used: {stats.get('memory_used_mb', 0):.2f} MB")
            print(f"   Total Keys: {stats.get('total_keys', 0)}")
            print(f"   Hit Rate: {stats.get('hit_rate', 0):.2%}")
            print(f"   Connected Clients: {stats.get('connected_clients', 0)}")
            print(f"   Uptime: {stats.get('uptime_seconds', 0)}s")
        else:
            print(f"❌ Erro: {r.status_code}")
            print(r.text)


async def test_cache_clear():
    """Teste 3: Cache Clear"""
    print("\n" + "="*80)
    print("🗑️ TESTE 3: Cache Clear")
    print("="*80)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Primeiro, criar uma query em cache
        query = {
            "metrics": ["qtd_vendas"],
            "dimensions": ["periodo_dia"]
        }
        
        print("\n📤 Criando query em cache...")
        r1 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=query)
        if r1.status_code == 200:
            print("✅ Query executada e salva em cache")
        
        # Verificar que está em cache
        print("\n📤 Verificando cache HIT...")
        r2 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=query)
        if r2.status_code == 200:
            from_cache = r2.json().get("metadata", {}).get("from_cache", False)
            if from_cache:
                print("✅ Confirmado: Query está em cache")
            else:
                print("⚠️ WARNING: Query não está em cache")
        
        # Limpar cache
        print("\n📤 Limpando cache (pattern: analytics:*)...")
        r3 = await client.post(
            f"{BASE_URL}/api/v1/analytics/cache/clear",
            params={"pattern": "analytics:*"}
        )
        
        if r3.status_code == 200:
            result = r3.json()
            print(f"✅ Status: {r3.status_code}")
            print(f"   Deleted: {result.get('deleted', 0)} keys")
            print(f"   Pattern: {result.get('pattern', 'unknown')}")
        else:
            print(f"❌ Erro: {r3.status_code}")
            print(r3.text)
            return
        
        # Verificar que foi removido
        print("\n📤 Verificando que cache foi limpo...")
        r4 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=query)
        if r4.status_code == 200:
            from_cache = r4.json().get("metadata", {}).get("from_cache", False)
            if not from_cache:
                print("✅ Correto: Cache foi limpo (MISS novamente)")
            else:
                print("❌ ERRO: Cache ainda está presente (HIT)")


async def test_different_queries():
    """Teste 4: Queries diferentes = Keys diferentes"""
    print("\n" + "="*80)
    print("🔑 TESTE 4: Queries Diferentes")
    print("="*80)
    
    queries = [
        {
            "metrics": ["faturamento"],
            "dimensions": ["channel"],
            "name": "Query A - Faturamento por Canal"
        },
        {
            "metrics": ["ticket_medio"],
            "dimensions": ["channel"],
            "name": "Query B - Ticket Médio por Canal"
        },
        {
            "metrics": ["faturamento"],
            "dimensions": ["periodo_dia"],
            "name": "Query C - Faturamento por Período"
        }
    ]
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for i, q in enumerate(queries, 1):
            name = q.pop("name")
            print(f"\n📤 {name}...")
            
            # Primeira request (MISS)
            r1 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=q)
            miss_time = r1.json().get("metadata", {}).get("query_time_ms", 0)
            
            # Segunda request (HIT)
            r2 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=q)
            data = r2.json()
            from_cache = data.get("metadata", {}).get("from_cache", False)
            hit_time = data.get("metadata", {}).get("query_time_ms", 0)
            
            if from_cache:
                print(f"   ✅ Cache HIT confirmado")
                print(f"   ⚡ MISS: {miss_time:.2f}ms → HIT: {hit_time:.2f}ms")
            else:
                print(f"   ❌ Esperava HIT, obteve MISS")


async def main():
    """Executa todos os testes"""
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "REDIS CACHE TEST SUITE" + " "*35 + "║")
    print("╚" + "="*78 + "╝")
    
    try:
        await test_cache_hit_miss()
        await test_cache_stats()
        await test_different_queries()
        await test_cache_clear()
        
        print("\n" + "="*80)
        print("✅ TODOS OS TESTES CONCLUÍDOS!")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
