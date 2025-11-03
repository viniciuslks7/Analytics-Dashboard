"""
Detailed analysis of customer purchase patterns
"""
import asyncio
import sys

# Fix for Windows psycopg3
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.database import db

async def analyze():
    await db.connect()
    
    print("=" * 80)
    print("DETAILED CUSTOMER PURCHASE ANALYSIS")
    print("=" * 80)
    
    # Check purchase distribution across the 16-day period
    query = """
    WITH customer_purchase_dates AS (
        SELECT 
            customer_id,
            MIN(created_at::date) as first_purchase,
            MAX(created_at::date) as last_purchase,
            COUNT(*) as total_purchases,
            MAX(created_at::date) - MIN(created_at::date) as customer_lifespan_days
        FROM sales
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
    )
    SELECT 
        customer_lifespan_days,
        COUNT(*) as customer_count,
        ROUND(AVG(total_purchases)::numeric, 2) as avg_purchases,
        MIN(total_purchases) as min_purchases,
        MAX(total_purchases) as max_purchases
    FROM customer_purchase_dates
    GROUP BY customer_lifespan_days
    ORDER BY customer_lifespan_days DESC
    """
    
    rows = await db.fetch_all(query)
    print("\n📊 Customer Lifespan Distribution (days between first and last purchase):")
    print(f"{'Days':>6} | {'Count':>8} | {'Avg Purch':>10} | {'Min':>5} | {'Max':>5}")
    print("-" * 50)
    for row in rows:
        print(f"{row['customer_lifespan_days']:>6} | {row['customer_count']:>8} | {row['avg_purchases']:>10} | {row['min_purchases']:>5} | {row['max_purchases']:>5}")
    
    # Show customers with multiple purchases over different days
    query2 = """
    WITH customer_stats AS (
        SELECT 
            customer_id,
            COUNT(DISTINCT created_at::date) as purchase_days,
            COUNT(*) as total_purchases,
            MIN(created_at::date) as first_purchase,
            MAX(created_at::date) as last_purchase
        FROM sales
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
        HAVING COUNT(DISTINCT created_at::date) > 1
    )
    SELECT 
        customer_id,
        purchase_days,
        total_purchases,
        first_purchase,
        last_purchase,
        last_purchase - first_purchase as days_span
    FROM customer_stats
    ORDER BY purchase_days DESC, total_purchases DESC
    LIMIT 20
    """
    
    rows2 = await db.fetch_all(query2)
    print("\n👥 Top 20 Repeat Customers (multiple purchase days):")
    print(f"{'Customer':>10} | {'Days':>5} | {'Purchases':>10} | {'First':>12} | {'Last':>12} | {'Span':>5}")
    print("-" * 75)
    for row in rows2:
        print(f"{row['customer_id']:>10} | {row['purchase_days']:>5} | {row['total_purchases']:>10} | {row['first_purchase']} | {row['last_purchase']} | {row['days_span']:>5}")
    
    # Check if we can calculate churn within the dataset
    query3 = """
    WITH dataset_info AS (
        SELECT 
            MIN(created_at::date) as start_date,
            MAX(created_at::date) as end_date,
            MAX(created_at::date) - MIN(created_at::date) as total_days
        FROM sales
    ),
    customer_last_purchase AS (
        SELECT 
            customer_id,
            MAX(created_at::date) as last_purchase_date,
            (SELECT end_date FROM dataset_info) - MAX(created_at::date) as days_since_last_in_dataset
        FROM sales
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
    )
    SELECT 
        COUNT(*) FILTER (WHERE days_since_last_in_dataset = 0) as purchased_on_last_day,
        COUNT(*) FILTER (WHERE days_since_last_in_dataset <= 3) as active_last_3_days,
        COUNT(*) FILTER (WHERE days_since_last_in_dataset <= 7) as active_last_week,
        COUNT(*) FILTER (WHERE days_since_last_in_dataset > 7) as inactive_over_week,
        ROUND(AVG(days_since_last_in_dataset)::numeric, 2) as avg_days_since_last,
        MIN(days_since_last_in_dataset) as min_days,
        MAX(days_since_last_in_dataset) as max_days,
        (SELECT total_days FROM dataset_info) as dataset_span_days
    FROM customer_last_purchase
    """
    
    row3 = await db.fetch_one(query3)
    print("\n📅 Customer Activity Within Dataset Period:")
    print(f"  Dataset span: {row3['dataset_span_days']} days")
    print(f"  Purchased on last day: {row3['purchased_on_last_day']}")
    print(f"  Active in last 3 days: {row3['active_last_3_days']}")
    print(f"  Active in last week: {row3['active_last_week']}")
    print(f"  Inactive > 1 week: {row3['inactive_over_week']}")
    print(f"  Avg days since last purchase (within dataset): {row3['avg_days_since_last']}")
    print(f"  Range: {row3['min_days']} to {row3['max_days']} days")
    
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(analyze())
