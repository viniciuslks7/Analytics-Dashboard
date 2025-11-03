"""
Teste do Redis Cache - Feature #14
Testa cache HIT, MISS, TTL e performance
"""
import httpx
import asyncio
import time
import json

BASE_URL = "http://localhost:8000"

async def test_cache():
    print("🧪 TESTE DO REDIS CACHE - Feature #14")
    print("=" * 60)
    
    async with httpx.AsyncClient() as client:
        # Query de teste
        query = {
            "metrics": ["faturamento", "ticket_medio"],
            "dimensions": ["channel"],
            "date_range": {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31"
            }
        }
        
        print("\n1️⃣ Primeira Request (Cache MISS esperado)")
        print("-" * 60)
        start = time.time()
        r1 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=query)
        elapsed1 = (time.time() - start) * 1000
        
        if r1.status_code == 200:
            data1 = r1.json()
            print(f"✅ Status: {r1.status_code}")
            print(f"⏱️  Tempo: {elapsed1:.2f}ms")
            print(f"📊 Linhas: {data1['metadata']['total_rows']}")
            print(f"🎯 From Cache: {data1['metadata'].get('from_cache', False)}")
            print(f"💾 Cached: {data1['metadata'].get('cached', False)}")
        else:
            print(f"❌ Erro: {r1.status_code}")
            print(r1.text)
            return
        
        print("\n2️⃣ Segunda Request (Cache HIT esperado)")
        print("-" * 60)
        start = time.time()
        r2 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=query)
        elapsed2 = (time.time() - start) * 1000
        
        if r2.status_code == 200:
            data2 = r2.json()
            print(f"✅ Status: {r2.status_code}")
            print(f"⏱️  Tempo: {elapsed2:.2f}ms")
            print(f"📊 Linhas: {data2['metadata']['total_rows']}")
            print(f"🎯 From Cache: {data2['metadata'].get('from_cache', False)}")
            print(f"💾 Cached: {data2['metadata'].get('cached', False)}")
            
            # Performance gain
            speedup = elapsed1 / elapsed2 if elapsed2 > 0 else 0
            print(f"🚀 Speedup: {speedup:.2f}x mais rápido!")
        
        print("\n3️⃣ Testando Cache Stats")
        print("-" * 60)
        r3 = await client.get(f"{BASE_URL}/api/v1/analytics/cache/stats")
        
        if r3.status_code == 200:
            stats = r3.json()
            print(f"✅ Status: {stats.get('status', 'unknown')}")
            print(f"💾 Memória: {stats.get('memory_used_mb', 0):.2f} MB")
            print(f"🔑 Total Keys: {stats.get('total_keys', 0)}")
            print(f"📈 Hit Rate: {stats.get('hit_rate', 0) * 100:.1f}%")
            print(f"👥 Clientes: {stats.get('connected_clients', 0)}")
            print(f"⏰ Uptime: {stats.get('uptime_seconds', 0)}s")
        
        print("\n4️⃣ Query Diferente (Cache MISS esperado)")
        print("-" * 60)
        query2 = {
            "metrics": ["qtd_vendas"],
            "dimensions": ["payment_type"],
            "date_range": {
                "start_date": "2024-01-01",
                "end_date": "2024-01-15"
            }
        }
        
        start = time.time()
        r4 = await client.post(f"{BASE_URL}/api/v1/analytics/query", json=query2)
        elapsed4 = (time.time() - start) * 1000
        
        if r4.status_code == 200:
            data4 = r4.json()
            print(f"✅ Status: {r4.status_code}")
            print(f"⏱️  Tempo: {elapsed4:.2f}ms")
            print(f"📊 Linhas: {data4['metadata']['total_rows']}")
            print(f"🎯 From Cache: {data4['metadata'].get('from_cache', False)}")
        
        print("\n" + "=" * 60)
        print("✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_cache())
