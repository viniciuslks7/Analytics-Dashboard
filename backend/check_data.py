import asyncio
from app.db.database import db

async def check():
    await db.connect()
    
    print("=" * 60)
    print("CANAIS DISPONÍVEIS:")
    print("=" * 60)
    channels = await db.fetch_all("""
        SELECT DISTINCT ch.name, COUNT(*) as vendas 
        FROM sales s 
        JOIN channels ch ON ch.id = s.channel_id 
        GROUP BY ch.name 
        ORDER BY vendas DESC 
        LIMIT 3
    """)
    for r in channels:
        print(f"  ✅ {r['name']}: {r['vendas']} vendas")
    
    print("\n" + "=" * 60)
    print("LOJAS DISPONÍVEIS:")
    print("=" * 60)
    stores = await db.fetch_all("""
        SELECT DISTINCT st.name, COUNT(*) as vendas 
        FROM sales s 
        JOIN stores st ON st.id = s.store_id 
        GROUP BY st.name 
        ORDER BY vendas DESC 
        LIMIT 3
    """)
    for r in stores:
        print(f"  ✅ {r['name']}: {r['vendas']} vendas")
    
    print("\n" + "=" * 60)
    print("PRODUTOS MAIS VENDIDOS:")
    print("=" * 60)
    products = await db.fetch_all("""
        SELECT p.name, COUNT(*) as vendas 
        FROM product_sales ps 
        JOIN products p ON p.id = ps.product_id 
        GROUP BY p.name 
        ORDER BY vendas DESC 
        LIMIT 5
    """)
    for r in products:
        print(f"  ✅ {r['name']}: {r['vendas']} vendas")
    
    await db.disconnect()

asyncio.run(check())
