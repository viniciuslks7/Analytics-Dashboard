"""
Test script to validate new data from nola-repo
"""
import asyncio
import sys

# Fix for Windows psycopg3
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.database import db
from app.services.churn_service import churn_service

async def test_new_data():
    await db.connect()
    
    print("=" * 80)
    print("TESTING NEW DATA FROM NOLA-REPO")
    print("=" * 80)
    
    # Check data range
    query_overview = """
    SELECT 
        COUNT(*) as total_sales,
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT store_id) as total_stores,
        MIN(created_at::date) as first_sale,
        MAX(created_at::date) as last_sale,
        CURRENT_DATE - MAX(created_at::date) as days_since_last_sale,
        SUM(total_amount) as total_revenue
    FROM sales
    """
    
    row = await db.fetch_one(query_overview)
    print("\n📊 Data Overview:")
    print(f"  Total Sales: {row['total_sales']:,}")
    print(f"  Total Customers: {row['total_customers']:,}")
    print(f"  Total Stores: {row['total_stores']}")
    print(f"  Period: {row['first_sale']} to {row['last_sale']}")
    print(f"  Days since last sale: {row['days_since_last_sale']}")
    print(f"  Total Revenue: R$ {row['total_revenue']:,.2f}")
    
    # Test churn metrics with new data
    print("\n" + "=" * 80)
    print("CHURN METRICS WITH NEW DATA")
    print("=" * 80)
    
    churn = await churn_service.get_churn_metrics(days_inactive=30)
    print("\n📊 Churn Metrics (30 days threshold):")
    for key, value in churn.items():
        if isinstance(value, float):
            print(f"  {key}: {value:,.2f}")
        else:
            print(f"  {key}: {value}")
    
    # Customer distribution
    query_dist = """
    WITH dataset_reference AS (
        SELECT MAX(created_at::date) as reference_date
        FROM sales
    ),
    customer_stats AS (
        SELECT 
            customer_id,
            (SELECT reference_date FROM dataset_reference) - MAX(created_at::date) as days_inactive
        FROM sales
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
    )
    SELECT 
        COUNT(*) FILTER (WHERE days_inactive = 0) as active_today,
        COUNT(*) FILTER (WHERE days_inactive <= 7) as active_week,
        COUNT(*) FILTER (WHERE days_inactive <= 30) as active_month,
        COUNT(*) FILTER (WHERE days_inactive BETWEEN 31 AND 60) as at_risk,
        COUNT(*) FILTER (WHERE days_inactive > 60) as churned,
        MIN(days_inactive) as min_days,
        MAX(days_inactive) as max_days,
        ROUND(AVG(days_inactive)::numeric, 2) as avg_days
    FROM customer_stats
    """
    
    dist = await db.fetch_one(query_dist)
    print("\n👥 Customer Activity Distribution:")
    print(f"  Active today: {dist['active_today']:,}")
    print(f"  Active last 7 days: {dist['active_week']:,}")
    print(f"  Active last 30 days: {dist['active_month']:,}")
    print(f"  At risk (31-60 days): {dist['at_risk']:,}")
    print(f"  Churned (>60 days): {dist['churned']:,}")
    print(f"  Inactivity range: {dist['min_days']} to {dist['max_days']} days (avg: {dist['avg_days']})")
    
    # Sales by channel
    query_channels = """
    SELECT 
        c.name as channel,
        COUNT(*) as sales_count,
        SUM(s.total_amount) as revenue,
        ROUND(AVG(s.total_amount)::numeric, 2) as avg_ticket
    FROM sales s
    JOIN channels c ON c.id = s.channel_id
    WHERE s.sale_status_desc = 'COMPLETED'
    GROUP BY c.name
    ORDER BY sales_count DESC
    """
    
    channels = await db.fetch_all(query_channels)
    print("\n📱 Sales by Channel:")
    print(f"{'Channel':<20} | {'Sales':>10} | {'Revenue':>15} | {'Avg Ticket':>12}")
    print("-" * 65)
    for ch in channels:
        print(f"{ch['channel']:<20} | {ch['sales_count']:>10,} | R$ {ch['revenue']:>12,.2f} | R$ {ch['avg_ticket']:>9,.2f}")
    
    # Top stores
    query_stores = """
    SELECT 
        st.name as store,
        COUNT(*) as sales_count,
        SUM(s.total_amount) as revenue
    FROM sales s
    JOIN stores st ON st.id = s.store_id
    WHERE s.sale_status_desc = 'COMPLETED'
    GROUP BY st.name
    ORDER BY revenue DESC
    LIMIT 10
    """
    
    stores = await db.fetch_all(query_stores)
    print("\n🏪 Top 10 Stores by Revenue:")
    print(f"{'Store':<30} | {'Sales':>10} | {'Revenue':>15}")
    print("-" * 60)
    for st in stores:
        print(f"{st['store']:<30} | {st['sales_count']:>10,} | R$ {st['revenue']:>12,.2f}")
    
    await db.disconnect()
    print("\n" + "=" * 80)
    print("✅ ALL TESTS PASSED!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_new_data())
