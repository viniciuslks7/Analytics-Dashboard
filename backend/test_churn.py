"""
Test script for churn metrics calculation
"""
import asyncio
import sys

# Fix for Windows psycopg3
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.database import db
from app.services.churn_service import churn_service

async def test_churn():
    await db.connect()
    
    print("=" * 80)
    print("TESTING CHURN METRICS")
    print("=" * 80)
    
    # Test with 30 days
    result = await churn_service.get_churn_metrics(days_inactive=30)
    print("\n📊 Churn Metrics (30 days inactive):")
    for key, value in result.items():
        print(f"  {key}: {value}")
    
    # Test with 60 days
    result60 = await churn_service.get_churn_metrics(days_inactive=60)
    print("\n📊 Churn Metrics (60 days inactive):")
    for key, value in result60.items():
        print(f"  {key}: {value}")
    
    # Check data range
    query_dates = """
    SELECT 
        MIN(created_at::date) as min_date,
        MAX(created_at::date) as max_date,
        CURRENT_DATE as today,
        CURRENT_DATE - MAX(created_at::date) as days_since_last_sale,
        COUNT(DISTINCT customer_id) as total_customers
    FROM sales
    """
    row = await db.fetch_one(query_dates)
    print("\n📅 Data Range:")
    print(f"  First sale: {row['min_date']}")
    print(f"  Last sale: {row['max_date']}")
    print(f"  Today: {row['today']}")
    print(f"  Days since last sale: {row['days_since_last_sale']}")
    print(f"  Total customers: {row['total_customers']}")
    
    # Check customer distribution
    query_dist = """
    WITH customer_stats AS (
        SELECT 
            customer_id,
            MAX(created_at::date) as last_purchase_date,
            CURRENT_DATE - MAX(created_at::date) as days_since_last_purchase
        FROM sales
        GROUP BY customer_id
    )
    SELECT 
        COUNT(*) FILTER (WHERE days_since_last_purchase <= 30) as active_30,
        COUNT(*) FILTER (WHERE days_since_last_purchase BETWEEN 31 AND 60) as at_risk_30_60,
        COUNT(*) FILTER (WHERE days_since_last_purchase > 60) as churned_60,
        COUNT(*) FILTER (WHERE days_since_last_purchase > 90) as churned_90,
        MIN(days_since_last_purchase) as min_days,
        MAX(days_since_last_purchase) as max_days,
        ROUND(AVG(days_since_last_purchase)::numeric, 2) as avg_days
    FROM customer_stats
    """
    row2 = await db.fetch_one(query_dist)
    print("\n👥 Customer Distribution:")
    print(f"  Active (≤30 days): {row2['active_30']}")
    print(f"  At Risk (31-60 days): {row2['at_risk_30_60']}")
    print(f"  Churned (>60 days): {row2['churned_60']}")
    print(f"  Churned (>90 days): {row2['churned_90']}")
    print(f"  Min days inactive: {row2['min_days']}")
    print(f"  Max days inactive: {row2['max_days']}")
    print(f"  Avg days inactive: {row2['avg_days']}")
    
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(test_churn())
