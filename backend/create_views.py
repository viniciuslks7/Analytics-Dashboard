"""
Create Materialized Views for Analytics Performance
Run this script after populating the database with data
"""
import asyncio
import psycopg
from datetime import datetime


DATABASE_URL = "postgresql://challenge:challenge_2024@localhost:5432/challenge_db"


async def create_materialized_views():
    """Create all materialized views for analytics"""
    
    conn = await psycopg.AsyncConnection.connect(DATABASE_URL)
    
    try:
        print("=" * 70)
        print("Creating Materialized Views for Analytics")
        print("=" * 70)
        print()
        
        # 1. Vendas Agregadas (Main Analytics View)
        print("📊 Creating vendas_agregadas...")
        async with conn.cursor() as cur:
            await cur.execute("""
                DROP MATERIALIZED VIEW IF EXISTS vendas_agregadas CASCADE;
            
            CREATE MATERIALIZED VIEW vendas_agregadas AS
            SELECT
                s.store_id,
                st.name as store_name,
                s.channel_id,
                ch.name as channel_name,
                DATE(s.created_at) as data_venda,
                EXTRACT(DOW FROM s.created_at) as dia_semana,
                EXTRACT(HOUR FROM s.created_at) as hora,
                CASE 
                    WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 6 AND 11 THEN 'Manhã'
                    WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 12 AND 17 THEN 'Tarde'
                    WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 18 AND 23 THEN 'Noite'
                    ELSE 'Madrugada'
                END as periodo_dia,
                COUNT(DISTINCT s.id) as qtd_vendas,
                SUM(s.total_amount) as faturamento,
                AVG(s.total_amount) as ticket_medio,
                COUNT(DISTINCT s.customer_id) FILTER (WHERE s.customer_id IS NOT NULL) as clientes_unicos,
                SUM(s.total_discount) as total_descontos,
                AVG(s.production_seconds) FILTER (WHERE s.production_seconds IS NOT NULL) as tempo_medio_preparo_seg,
                AVG(s.delivery_seconds) FILTER (WHERE s.delivery_seconds IS NOT NULL) as tempo_medio_entrega_seg
            FROM sales s
            JOIN stores st ON s.store_id = st.id
            JOIN channels ch ON s.channel_id = ch.id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY s.store_id, st.name, s.channel_id, ch.name, 
                     DATE(s.created_at), dia_semana, hora, periodo_dia;
            
            CREATE INDEX idx_vendas_agregadas_data ON vendas_agregadas(data_venda);
            CREATE INDEX idx_vendas_agregadas_store ON vendas_agregadas(store_id);
            CREATE INDEX idx_vendas_agregadas_channel ON vendas_agregadas(channel_id);
            """)
        print("✓ vendas_agregadas created")
        
        # 2. Produtos Analytics
        print("\n📦 Creating produtos_analytics...")
        async with conn.cursor() as cur:
            await cur.execute("""
                DROP MATERIALIZED VIEW IF EXISTS produtos_analytics CASCADE;
            
            CREATE MATERIALIZED VIEW produtos_analytics AS
            SELECT
                p.id as product_id,
                p.name as produto_nome,
                cat.name as categoria,
                s.channel_id,
                ch.name as channel_name,
                DATE(s.created_at) as data_venda,
                EXTRACT(DOW FROM s.created_at) as dia_semana,
                CASE 
                    WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 6 AND 11 THEN 'Manhã'
                    WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 12 AND 17 THEN 'Tarde'
                    WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 18 AND 23 THEN 'Noite'
                    ELSE 'Madrugada'
                END as periodo_dia,
                SUM(ps.quantity) as quantidade_vendida,
                SUM(ps.total_price) as faturamento_produto,
                COUNT(DISTINCT s.id) as num_vendas
            FROM product_sales ps
            JOIN sales s ON ps.sale_id = s.id
            JOIN products p ON ps.product_id = p.id
            JOIN categories cat ON p.category_id = cat.id
            JOIN channels ch ON s.channel_id = ch.id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY p.id, p.name, cat.name, s.channel_id, ch.name, 
                     DATE(s.created_at), dia_semana, periodo_dia;
            
            CREATE INDEX idx_produtos_analytics_product ON produtos_analytics(product_id);
            CREATE INDEX idx_produtos_analytics_data ON produtos_analytics(data_venda);
            CREATE INDEX idx_produtos_analytics_channel ON produtos_analytics(channel_id);
            """)
        print("✓ produtos_analytics created")
        
        # 3. Delivery Metrics
        print("\n🚚 Creating delivery_metrics...")
        async with conn.cursor() as cur:
            await cur.execute("""
                DROP MATERIALIZED VIEW IF EXISTS delivery_metrics CASCADE;
            
            CREATE MATERIALIZED VIEW delivery_metrics AS
            SELECT
                da.neighborhood as bairro,
                da.city as cidade,
                da.state as estado,
                s.channel_id,
                ch.name as channel_name,
                DATE(s.created_at) as data_venda,
                COUNT(s.id) as total_entregas,
                AVG(s.delivery_seconds / 60.0) as tempo_medio_entrega_min,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.delivery_seconds / 60.0) as p50_entrega_min,
                PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY s.delivery_seconds / 60.0) as p90_entrega_min,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY s.delivery_seconds / 60.0) as p95_entrega_min,
                AVG(da.latitude) as avg_latitude,
                AVG(da.longitude) as avg_longitude
            FROM sales s
            JOIN delivery_addresses da ON s.id = da.sale_id
            JOIN channels ch ON s.channel_id = ch.id
            WHERE s.sale_status_desc = 'COMPLETED'
              AND s.delivery_seconds IS NOT NULL
              AND da.neighborhood IS NOT NULL
            GROUP BY da.neighborhood, da.city, da.state, s.channel_id, ch.name, DATE(s.created_at);
            
            CREATE INDEX idx_delivery_metrics_bairro ON delivery_metrics(bairro);
            CREATE INDEX idx_delivery_metrics_data ON delivery_metrics(data_venda);
            """)
        print("✓ delivery_metrics created")
        
        # 4. Customer RFM (Recency, Frequency, Monetary)
        print("\n👥 Creating customer_rfm...")
        async with conn.cursor() as cur:
            await cur.execute("""
                DROP MATERIALIZED VIEW IF EXISTS customer_rfm CASCADE;
            
            CREATE MATERIALIZED VIEW customer_rfm AS
            SELECT
                c.id as customer_id,
                c.customer_name,
                c.email,
                c.phone_number,
                COUNT(DISTINCT s.id) as frequencia,
                MAX(s.created_at) as ultima_compra,
                EXTRACT(DAY FROM CURRENT_TIMESTAMP - MAX(s.created_at)) as recencia_dias,
                SUM(s.total_amount) as valor_total,
                AVG(s.total_amount) as ticket_medio_cliente,
                MIN(s.created_at) as primeira_compra,
                EXTRACT(DAY FROM MAX(s.created_at) - MIN(s.created_at)) as dias_cliente
            FROM customers c
            JOIN sales s ON c.id = s.customer_id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY c.id, c.customer_name, c.email, c.phone_number;
            
            CREATE INDEX idx_customer_rfm_frequencia ON customer_rfm(frequencia);
            CREATE INDEX idx_customer_rfm_recencia ON customer_rfm(recencia_dias);
            CREATE INDEX idx_customer_rfm_valor ON customer_rfm(valor_total);
            """)
        print("✓ customer_rfm created")
        
        print()
        print("=" * 70)
        print("✓ All Materialized Views Created Successfully!")
        print("=" * 70)
        print()
        
        # Get statistics
        print("📈 Statistics:")
        cur = await conn.execute("SELECT COUNT(*) FROM vendas_agregadas")
        row = await cur.fetchone()
        print(f"  vendas_agregadas: {row[0]:,} rows")
        
        cur = await conn.execute("SELECT COUNT(*) FROM produtos_analytics")
        row = await cur.fetchone()
        print(f"  produtos_analytics: {row[0]:,} rows")
        
        cur = await conn.execute("SELECT COUNT(*) FROM delivery_metrics")
        row = await cur.fetchone()
        print(f"  delivery_metrics: {row[0]:,} rows")
        
        cur = await conn.execute("SELECT COUNT(*) FROM customer_rfm")
        row = await cur.fetchone()
        print(f"  customer_rfm: {row[0]:,} rows")
        
        print()
        print("⚡ To refresh views later, run:")
        print("   REFRESH MATERIALIZED VIEW CONCURRENTLY vendas_agregadas;")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(create_materialized_views())
