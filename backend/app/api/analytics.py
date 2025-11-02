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
    """
    import re
    pattern = r'^(SUM|AVG|COUNT|MIN|MAX)\([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\)\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*$'
    return bool(re.match(pattern, metric, re.IGNORECASE))


@router.get("/kpis", response_model=KPIDashboard)
async def get_kpi_dashboard(
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter")
):
    """
    Get main KPI dashboard with key metrics
    """
    try:
        result = await analytics_service.get_kpi_dashboard(start_date, end_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"KPI calculation error: {str(e)}")


@router.get("/compare", response_model=PeriodComparisonResponse)
async def compare_periods(
    base_start: date = Query(..., description="Base period start date"),
    base_end: date = Query(..., description="Base period end date"),
    compare_start: date = Query(..., description="Compare period start date"),
    compare_end: date = Query(..., description="Compare period end date")
):
    """
    Compare metrics between two time periods
    
    Example: /api/v1/analytics/compare?base_start=2025-05-13&base_end=2025-05-20&compare_start=2025-05-05&compare_end=2025-05-12
    """
    try:
        logger.debug(f"📊 Period Comparison: Base({base_start} to {base_end}) vs Compare({compare_start} to {compare_end})")
        result = await analytics_service.compare_periods(base_start, base_end, compare_start, compare_end)
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
