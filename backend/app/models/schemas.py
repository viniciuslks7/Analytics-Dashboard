"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from enum import Enum


# Enums
class OrderDirection(str, Enum):
    ASC = "asc"
    DESC = "desc"


class AggregationFunction(str, Enum):
    SUM = "sum"
    AVG = "avg"
    COUNT = "count"
    MIN = "min"
    MAX = "max"


# Filter Models
class FilterCondition(BaseModel):
    """Single filter condition"""
    field: str
    operator: str = Field(default="eq", description="eq, ne, gt, gte, lt, lte, in, like")
    value: Any


class DateRangeFilter(BaseModel):
    """Date range filter"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None


# Query Request Models
class AnalyticsQueryRequest(BaseModel):
    """Generic analytics query request"""
    metrics: List[str] = Field(
        default=[],
        description="Metrics to calculate (e.g., 'faturamento', 'ticket_medio', 'qtd_vendas'). Can be empty when only selecting dimensions."
    )
    dimensions: List[str] = Field(
        default=[],
        description="Dimensions to group by (e.g., 'channel', 'store', 'date')"
    )
    filters: Dict[str, Any] = Field(
        default={},
        description="Filters to apply (field: {operator: value})"
    )
    date_range: Optional[DateRangeFilter] = None
    order_by: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Sort specification [{'field': 'faturamento', 'direction': 'desc'}]"
    )
    limit: Optional[int] = Field(default=100, le=1000)
    offset: Optional[int] = Field(default=0, ge=0)


class ComparisonPeriod(BaseModel):
    """Period comparison configuration"""
    base_start: date
    base_end: date
    compare_start: date
    compare_end: date


# Response Models
class QueryMetadata(BaseModel):
    """Metadata about the query execution"""
    total_rows: int
    query_time_ms: float
    cached: bool = False
    timestamp: datetime = Field(default_factory=datetime.now)


class AnalyticsDataPoint(BaseModel):
    """Single data point in analytics response"""
    data: Dict[str, Any]


class MetricComparison(BaseModel):
    """Comparison of a single metric between two periods"""
    metric_name: str
    base_value: float
    compare_value: float
    absolute_change: float
    percentage_change: float
    trend: str  # 'up', 'down', 'neutral'


class PeriodComparisonResponse(BaseModel):
    """Response for period comparison"""
    base_period: Dict[str, date]
    compare_period: Dict[str, date]
    comparisons: List[MetricComparison]
    metadata: QueryMetadata


class AnalyticsQueryResponse(BaseModel):
    """Analytics query response"""
    data: List[Dict[str, Any]]
    metadata: QueryMetadata


class KPICard(BaseModel):
    """KPI card data"""
    label: str
    value: Any
    format: str = "number"  # number, currency, percentage, duration
    change: Optional[float] = None
    change_label: Optional[str] = None


class KPIDashboard(BaseModel):
    """Collection of KPI cards"""
    kpis: List[KPICard]
    period: str
    metadata: QueryMetadata


# Dimension Value Models
class DimensionValue(BaseModel):
    """Available value for a dimension"""
    id: Any
    label: str
    count: Optional[int] = None


class DimensionValuesResponse(BaseModel):
    """Response with available dimension values"""
    dimension: str
    values: List[DimensionValue]
    total: int
