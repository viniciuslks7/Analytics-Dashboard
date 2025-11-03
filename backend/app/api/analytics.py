"""
Analytics API Routes
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import date
import logging

from app.models.schemas import (
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    KPIDashboard,
    DimensionValuesResponse,
    DimensionValue,
    PeriodComparisonResponse
)
from app.services.analytics_service import analytics_service
from app.services.churn_service import churn_service
from app.cache.redis_client import redis_cache
from app.db.database import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.post("/query", response_model=AnalyticsQueryResponse)
async def execute_analytics_query(request: AnalyticsQueryRequest):
    """
    Execute custom analytics query with security validation
    
    Security measures:
    - Only allows predefined metrics and dimensions
    - Validates all inputs against whitelists
    - Prevents SQL injection through parameterized queries
    
    Example request:
    ```json
    {
        "metrics": ["faturamento", "ticket_medio", "qtd_vendas"],
        "dimensions": ["channel", "periodo_dia"],
        "filters": {
            "channel_id": {"in": [2, 3]}
        },
        "date_range": {
            "start_date": "2024-01-01",
            "end_date": "2024-01-31"
        },
        "order_by": [{"field": "faturamento", "direction": "desc"}],
        "limit": 100
    }
    ```
    """
    try:
        # Security validation: Check if metrics are in whitelist
        allowed_metrics = set(analytics_service.METRICS_MAP.keys())
        for metric in request.metrics:
            # Allow custom SQL metrics only if they match pattern "FUNCTION(column) as alias"
            if metric not in allowed_metrics and not _is_safe_custom_metric(metric):
                logger.error(f"❌ Invalid metric rejected: '{metric}'")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid metric '{metric}'. Use only predefined metrics or safe aggregations."
                )
        
        # Security validation: Check if dimensions are in whitelist
        allowed_dimensions = set(analytics_service.DIMENSIONS_MAP.keys())
        for dimension in request.dimensions:
            if dimension not in allowed_dimensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid dimension '{dimension}'. Use only predefined dimensions."
                )
        
        logger.debug(f"📥 Query Request: metrics={request.metrics}, dimensions={request.dimensions}, filters={request.filters}, order_by={request.order_by}")
        result = await analytics_service.execute_query(request)
        logger.debug(f"✅ Query Success: {len(result.data)} rows in {result.metadata.query_time_ms}ms")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Query Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query execution error: {str(e)}")


def _is_safe_custom_metric(metric: str) -> bool:
    """
    Validate custom metric follows safe pattern: FUNCTION(table.column) as alias
    Allowed functions: SUM, AVG, COUNT, MIN, MAX
    Also allows COUNT(DISTINCT table.column) and COUNT(DISTINCT column) patterns
    """
    import re
    # Pattern 1: FUNCTION(table.column) as alias
    pattern1 = r'^(SUM|AVG|COUNT|MIN|MAX)\([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\)\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*$'
    # Pattern 2: COUNT(DISTINCT table.column) as alias
    pattern2 = r'^COUNT\(DISTINCT\s+[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\)\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*$'
    # Pattern 3: Simple aggregations without table prefix: SUM(column_name)
    pattern3 = r'^(SUM|AVG|COUNT|MIN|MAX)\([a-zA-Z_][a-zA-Z0-9_]*\)\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*$'
    # Pattern 4: COUNT(DISTINCT column_name) as alias (without table prefix)
    pattern4 = r'^COUNT\(DISTINCT\s+[a-zA-Z_][a-zA-Z0-9_]*\)\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*$'
    
    return bool(
        re.match(pattern1, metric, re.IGNORECASE) or 
        re.match(pattern2, metric, re.IGNORECASE) or
        re.match(pattern3, metric, re.IGNORECASE) or
        re.match(pattern4, metric, re.IGNORECASE)
    )


@router.get("/kpis", response_model=KPIDashboard)
async def get_kpi_dashboard(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    canal_venda: Optional[List[str]] = Query(None, description="Filter by sales channel"),
    nome_loja: Optional[List[str]] = Query(None, description="Filter by store name"),
    nome_produto: Optional[List[str]] = Query(None, description="Filter by product name")
):
    """
    Get main KPI dashboard with key metrics and optional filters
    """
    try:
        logger.debug(f"📊 KPI Dashboard Request:")
        logger.debug(f"  Date: {start_date} to {end_date}")
        logger.debug(f"  Canal: {canal_venda}")
        logger.debug(f"  Loja: {nome_loja}")
        logger.debug(f"  Produto: {nome_produto}")
        
        # Build filters dict
        filters = {}
        if canal_venda:
            filters['canal_venda'] = canal_venda
        if nome_loja:
            filters['nome_loja'] = nome_loja
        if nome_produto:
            filters['nome_produto'] = nome_produto
        
        logger.debug(f"  Filters dict: {filters}")
        
        result = await analytics_service.get_kpi_dashboard(start_date, end_date, filters)
        logger.debug(f"✅ KPI Result: {result.kpis[0].value if result.kpis else 'no data'}")
        return result
    except Exception as e:
        logger.error(f"❌ KPI Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"KPI calculation error: {str(e)}")


@router.get("/compare", response_model=PeriodComparisonResponse)
async def compare_periods(
    base_start: date = Query(..., description="Base period start date"),
    base_end: date = Query(..., description="Base period end date"),
    compare_start: date = Query(..., description="Compare period start date"),
    compare_end: date = Query(..., description="Compare period end date"),
    canal_venda: Optional[List[str]] = Query(None, description="Filter by sales channel"),
    nome_loja: Optional[List[str]] = Query(None, description="Filter by store name"),
    nome_produto: Optional[List[str]] = Query(None, description="Filter by product name")
):
    """
    Compare metrics between two time periods with optional filters
    
    Example: /api/v1/analytics/compare?base_start=2025-05-13&base_end=2025-05-20&compare_start=2025-05-05&compare_end=2025-05-12
    """
    try:
        logger.debug(f"📊 Period Comparison: Base({base_start} to {base_end}) vs Compare({compare_start} to {compare_end})")
        
        # Build filters dict
        filters = {}
        if canal_venda:
            filters['canal_venda'] = canal_venda
        if nome_loja:
            filters['nome_loja'] = nome_loja
        if nome_produto:
            filters['nome_produto'] = nome_produto
        
        logger.debug(f"🔍 Applied filters: {filters}")
        
        result = await analytics_service.compare_periods(
            base_start, base_end, compare_start, compare_end, filters
        )
        logger.debug(f"✅ Comparison Success: {len(result.comparisons)} metrics compared")
        return result
    except Exception as e:
        logger.error(f"❌ Comparison Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Period comparison error: {str(e)}")


@router.get("/dimensions/stores", response_model=DimensionValuesResponse)
async def get_stores():
    """Get list of available stores"""
    try:
        query = """
        SELECT 
            s.id,
            s.name as label,
            COUNT(DISTINCT sa.id) as count
        FROM stores s
        LEFT JOIN sales sa ON s.id = sa.store_id
        WHERE s.is_active = true
        GROUP BY s.id, s.name
        ORDER BY s.name
        """
        rows = await db.fetch_all(query)
        
        values = [
            DimensionValue(
                id=row['id'],
                label=row['label'],
                count=row['count']
            )
            for row in rows
        ]
        
        return DimensionValuesResponse(
            dimension="stores",
            values=values,
            total=len(values)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dimensions/channels", response_model=DimensionValuesResponse)
async def get_channels():
    """Get list of available channels"""
    try:
        query = """
        SELECT 
            c.id,
            c.name as label,
            COUNT(DISTINCT s.id) as count
        FROM channels c
        LEFT JOIN sales s ON c.id = s.channel_id
        GROUP BY c.id, c.name
        ORDER BY c.name
        """
        rows = await db.fetch_all(query)
        
        values = [
            DimensionValue(
                id=row['id'],
                label=row['label'],
                count=row['count']
            )
            for row in rows
        ]
        
        return DimensionValuesResponse(
            dimension="channels",
            values=values,
            total=len(values)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dimensions/products", response_model=DimensionValuesResponse)
async def get_products(limit: int = Query(100, le=500)):
    """Get list of top products by sales volume"""
    try:
        query = f"""
        SELECT 
            p.id,
            p.name as label,
            COUNT(DISTINCT ps.id) as count
        FROM products p
        LEFT JOIN product_sales ps ON p.id = ps.product_id
        GROUP BY p.id, p.name
        ORDER BY count DESC
        LIMIT {limit}
        """
        rows = await db.fetch_all(query)
        
        values = [
            DimensionValue(
                id=row['id'],
                label=row['label'],
                count=row['count']
            )
            for row in rows
        ]
        
        return DimensionValuesResponse(
            dimension="products",
            values=values,
            total=len(values)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dimensions/regions", response_model=DimensionValuesResponse)
async def get_regions():
    """Get list of delivery regions (neighborhoods)"""
    try:
        query = """
        SELECT 
            da.neighborhood as id,
            CONCAT(da.neighborhood, ' - ', da.city) as label,
            COUNT(DISTINCT s.id) as count
        FROM delivery_addresses da
        JOIN sales s ON da.sale_id = s.id
        WHERE da.neighborhood IS NOT NULL
        GROUP BY da.neighborhood, da.city
        ORDER BY count DESC
        LIMIT 100
        """
        rows = await db.fetch_all(query)
        
        values = [
            DimensionValue(
                id=row['id'],
                label=row['label'],
                count=row['count']
            )
            for row in rows
        ]
        
        return DimensionValuesResponse(
            dimension="regions",
            values=values,
            total=len(values)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "analytics-api"}


# ============================================================================
# CHURN ANALYSIS ENDPOINTS
# ============================================================================

@router.get("/churn/metrics")
async def get_churn_metrics(
    days_inactive: int = Query(30, description="Days to consider customer as inactive")
):
    """
    Get overall churn metrics
    
    Returns churn rate, at-risk customers, value at risk, etc.
    """
    try:
        logger.debug(f"📊 Churn Metrics Request: days_inactive={days_inactive}")
        result = await churn_service.get_churn_metrics(days_inactive=days_inactive)
        logger.debug(f"✅ Churn Metrics Success: {result['churn_rate']}% churn rate")
        return result
    except Exception as e:
        logger.error(f"❌ Churn Metrics Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Churn metrics error: {str(e)}")


@router.get("/churn/at-risk")
async def get_at_risk_customers(
    min_purchases: int = Query(2, description="Minimum purchases to consider"),
    days_inactive: int = Query(30, description="Days since last purchase"),
    limit: int = Query(100, description="Maximum results")
):
    """
    Get list of customers at risk of churning
    
    Returns customers who haven't purchased recently but have good purchase history
    """
    try:
        logger.debug(f"📊 At-Risk Customers Request: min_purchases={min_purchases}, days_inactive={days_inactive}")
        result = await churn_service.get_at_risk_customers(
            min_purchases=min_purchases,
            days_inactive=days_inactive,
            limit=limit
        )
        logger.debug(f"✅ At-Risk Customers Success: {len(result)} customers found")
        return {"customers": result, "total": len(result)}
    except Exception as e:
        logger.error(f"❌ At-Risk Customers Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"At-risk customers error: {str(e)}")


@router.get("/churn/rfm-segments")
async def get_rfm_segmentation():
    """
    Get RFM (Recency, Frequency, Monetary) segmentation data
    
    Returns customer segments based on RFM scores
    """
    try:
        logger.debug("📊 RFM Segmentation Request")
        result = await churn_service.get_rfm_segmentation()
        logger.debug(f"✅ RFM Segmentation Success: {len(result)} segments found")
        return {"segments": result, "total": len(result)}
    except Exception as e:
        logger.error(f"❌ RFM Segmentation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"RFM segmentation error: {str(e)}")


@router.get("/churn/trend")
async def get_churn_trend(
    start_date: Optional[date] = Query(None, description="Start date for trend analysis"),
    end_date: Optional[date] = Query(None, description="End date for trend analysis"),
    granularity: str = Query('week', description="Granularity: day, week, or month")
):
    """
    Get churn trend over time
    
    Returns churn metrics by time period
    """
    try:
        logger.debug(f"📊 Churn Trend Request: start={start_date}, end={end_date}, granularity={granularity}")
        result = await churn_service.get_churn_trend(
            start_date=start_date,
            end_date=end_date,
            granularity=granularity
        )
        logger.debug(f"✅ Churn Trend Success: {len(result)} periods analyzed")
        return {"data": result, "total": len(result)}
    except Exception as e:
        logger.error(f"❌ Churn Trend Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Churn trend error: {str(e)}")


# ============================================================================
# CACHE MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/cache/stats")
async def get_cache_stats():
    """
    Get Redis cache statistics
    
    Returns:
    - Memory usage
    - Total keys
    - Hit rate (if available)
    - Connected clients
    - Uptime
    
    Example response:
    ```json
    {
        "memory_used_mb": 2.45,
        "total_keys": 1234,
        "hit_rate": 0.87,
        "connected_clients": 5,
        "uptime_seconds": 86400
    }
    ```
    """
    try:
        stats = await redis_cache.get_stats()
        logger.info(f"📊 Cache Stats: {stats.get('total_keys', 0)} keys, {stats.get('memory_used_mb', 0):.2f} MB")
        return stats
    except Exception as e:
        logger.error(f"❌ Cache Stats Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")


@router.post("/cache/clear")
async def clear_cache(
    pattern: str = Query(default="analytics:*", description="Pattern to match keys (e.g., 'analytics:*', 'analytics:query:*')")
):
    """
    Clear cache keys matching pattern
    
    Parameters:
    - pattern: Redis key pattern (default: "analytics:*")
    
    Common patterns:
    - "analytics:*" - Clear all analytics cache
    - "analytics:query:*" - Clear only query cache
    - "*" - Clear entire cache (use with caution!)
    
    Example response:
    ```json
    {
        "deleted": 42,
        "pattern": "analytics:query:*",
        "message": "Successfully deleted 42 keys"
    }
    ```
    """
    try:
        deleted = await redis_cache.clear_pattern(pattern)
        logger.info(f"🗑️ Cache Cleared: {deleted} keys deleted (pattern: {pattern})")
        return {
            "deleted": deleted,
            "pattern": pattern,
            "message": f"Successfully deleted {deleted} keys"
        }
    except Exception as e:
        logger.error(f"❌ Cache Clear Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@router.delete("/cache/key")
async def delete_cache_key(
    prefix: str = Query(..., description="Cache key prefix (e.g., 'analytics:query')"),
    data: str = Query(..., description="JSON string of data used to generate cache key")
):
    """
    Delete specific cache key
    
    Parameters:
    - prefix: Cache key prefix
    - data: JSON string of data used to generate the cache key
    
    Example:
    ```
    DELETE /api/v1/analytics/cache/key?prefix=analytics:query&data={"metrics":["faturamento"]}
    ```
    """
    try:
        import json
        data_dict = json.loads(data)
        await redis_cache.delete(prefix, data_dict)
        logger.info(f"🗑️ Cache Key Deleted: {prefix} with data {data[:50]}...")
        return {
            "message": "Cache key deleted successfully",
            "prefix": prefix
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in data parameter")
    except Exception as e:
        logger.error(f"❌ Cache Delete Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete cache key: {str(e)}")


