"""
Analytics API Routes
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import date

from app.models.schemas import (
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    KPIDashboard,
    DimensionValuesResponse,
    DimensionValue
)
from app.services.analytics_service import analytics_service
from app.db.database import db

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.post("/query", response_model=AnalyticsQueryResponse)
async def execute_analytics_query(request: AnalyticsQueryRequest):
    """
    Execute custom analytics query
    
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
        result = await analytics_service.execute_query(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query execution error: {str(e)}")


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
