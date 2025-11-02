"""
Analytics Service - Core business logic for data analytics
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date
import time

from app.db.database import db
from app.models.schemas import (
    AnalyticsQueryRequest, 
    AnalyticsQueryResponse,
    QueryMetadata,
    KPICard,
    KPIDashboard
)


class AnalyticsService:
    """Service for executing analytics queries"""
    
    # Mapping of metric names to SQL expressions
    METRICS_MAP = {
        "faturamento": "SUM(total_amount)",
        "ticket_medio": "AVG(total_amount)",
        "qtd_vendas": "COUNT(DISTINCT s.id)",
        "qtd_produtos": "SUM(ps.quantity)",
        "tempo_medio_entrega": "AVG(delivery_seconds / 60.0)",
        "p50_entrega": "PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY delivery_seconds / 60.0)",
        "p90_entrega": "PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY delivery_seconds / 60.0)",
        "p95_entrega": "PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY delivery_seconds / 60.0)",
        "tempo_medio_preparo": "AVG(production_seconds / 60.0)",
        "clientes_unicos": "COUNT(DISTINCT customer_id)",
        "valor_total_desconto": "SUM(total_discount)",
        "taxa_cancelamento": "SUM(CASE WHEN sale_status_desc = 'CANCELLED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)",
    }
    
    # Mapping of dimension names to table fields
    DIMENSIONS_MAP = {
        "channel": ("ch.name", "FROM sales s JOIN channels ch ON s.channel_id = ch.id"),
        "canal_venda": ("ch.name", "FROM sales s JOIN channels ch ON s.channel_id = ch.id"),  # Alias PT-BR
        "store": ("st.name", "FROM sales s JOIN stores st ON s.store_id = st.id"),
        "nome_loja": ("st.name", "FROM sales s JOIN stores st ON s.store_id = st.id"),  # Alias PT-BR
        "store_id": ("s.store_id", "FROM sales s"),
        "channel_id": ("s.channel_id", "FROM sales s"),
        "data": ("DATE(s.created_at)", "FROM sales s"),
        "hora": ("EXTRACT(HOUR FROM s.created_at)", "FROM sales s"),
        "dia_semana": ("EXTRACT(DOW FROM s.created_at)", "FROM sales s"),
        "mes": ("TO_CHAR(s.created_at, 'YYYY-MM')", "FROM sales s"),
        "periodo_dia": ("""
            CASE 
                WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 6 AND 11 THEN 'Manhã'
                WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 12 AND 17 THEN 'Tarde'
                WHEN EXTRACT(HOUR FROM s.created_at) BETWEEN 18 AND 23 THEN 'Noite'
                ELSE 'Madrugada'
            END
        """, "FROM sales s"),
        "produto": ("p.name", """
            FROM sales s 
            JOIN product_sales ps ON s.id = ps.sale_id 
            JOIN products p ON ps.product_id = p.id
        """),
        "nome_produto": ("p.name", """
            FROM sales s 
            JOIN product_sales ps ON s.id = ps.sale_id 
            JOIN products p ON ps.product_id = p.id
        """),  # Alias PT-BR
        "categoria": ("cat.name", """
            FROM sales s 
            JOIN product_sales ps ON s.id = ps.sale_id 
            JOIN products p ON ps.product_id = p.id
            JOIN categories cat ON p.category_id = cat.id
        """),
        "bairro": ("da.neighborhood", """
            FROM sales s 
            LEFT JOIN delivery_addresses da ON s.id = da.sale_id
        """),
        "cidade": ("da.city", """
            FROM sales s 
            LEFT JOIN delivery_addresses da ON s.id = da.sale_id
        """),
    }
    
    async def execute_query(self, request: AnalyticsQueryRequest) -> AnalyticsQueryResponse:
        """Execute analytics query based on request"""
        start_time = time.time()
        
        # Extract date filters from filters dict and move to date_range
        if 'data_venda_gte' in request.filters or 'data_venda_lte' in request.filters:
            from datetime import datetime
            from app.models.schemas import DateRangeFilter
            
            start_date = None
            end_date = None
            
            if 'data_venda_gte' in request.filters:
                start_date_str = request.filters.pop('data_venda_gte')
                if isinstance(start_date_str, str):
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                else:
                    start_date = start_date_str
            
            if 'data_venda_lte' in request.filters:
                end_date_str = request.filters.pop('data_venda_lte')
                if isinstance(end_date_str, str):
                    end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                else:
                    end_date = end_date_str
            
            # Set date_range if not already set
            if not request.date_range:
                request.date_range = DateRangeFilter(start_date=start_date, end_date=end_date)
        
        # Build SQL query
        query, params = self._build_query(request)
        
        # Execute query
        rows = await db.fetch_all(query, *params)
        
        # Convert rows to dict
        data = [dict(row) for row in rows]
        
        # Calculate query time
        query_time_ms = (time.time() - start_time) * 1000
        
        # Build metadata
        metadata = QueryMetadata(
            total_rows=len(data),
            query_time_ms=round(query_time_ms, 2),
            cached=False
        )
        
        return AnalyticsQueryResponse(data=data, metadata=metadata)
    
    def _build_query(self, request: AnalyticsQueryRequest) -> tuple[str, list]:
        """Build SQL query from request"""
        params = []
        
        # Build SELECT clause
        select_parts = []
        
        # Add dimensions
        for dim in request.dimensions:
            if dim in self.DIMENSIONS_MAP:
                dim_expr, _ = self.DIMENSIONS_MAP[dim]
                select_parts.append(f"{dim_expr} as {dim}")
        
        # Add metrics
        for metric in request.metrics:
            if metric in self.METRICS_MAP:
                # Predefined metric
                metric_expr = self.METRICS_MAP[metric]
                select_parts.append(f"{metric_expr} as {metric}")
            else:
                # Custom SQL expression (already contains alias)
                select_parts.append(metric)
        
        select_clause = ",\n    ".join(select_parts)
        
        # Build FROM clause (use most complex join needed)
        from_clause = "FROM sales s"
        joins_needed = set()
        
        # Check what joins we need
        for dim in request.dimensions:
            if dim in self.DIMENSIONS_MAP:
                _, join_hint = self.DIMENSIONS_MAP[dim]
                if "JOIN channels" in join_hint:
                    joins_needed.add("channels")
                if "JOIN stores" in join_hint:
                    joins_needed.add("stores")
                if "JOIN product_sales" in join_hint:
                    joins_needed.add("product_sales")
                if "JOIN products" in join_hint:
                    joins_needed.add("products")
                if "JOIN categories" in join_hint:
                    joins_needed.add("categories")
                if "JOIN delivery_addresses" in join_hint:
                    joins_needed.add("delivery_addresses")
        
        # Add joins
        if "channels" in joins_needed:
            from_clause += "\nJOIN channels ch ON s.channel_id = ch.id"
        if "stores" in joins_needed:
            from_clause += "\nJOIN stores st ON s.store_id = st.id"
        if "product_sales" in joins_needed:
            from_clause += "\nJOIN product_sales ps ON s.id = ps.sale_id"
        if "products" in joins_needed:
            from_clause += "\nJOIN products p ON ps.product_id = p.id"
        if "categories" in joins_needed:
            from_clause += "\nJOIN categories cat ON p.category_id = cat.id"
        if "delivery_addresses" in joins_needed:
            from_clause += "\nLEFT JOIN delivery_addresses da ON s.id = da.sale_id"
        
        # Build WHERE clause
        where_conditions = ["s.sale_status_desc = 'COMPLETED'"]
        
        # Add date range filter
        if request.date_range:
            if request.date_range.start_date:
                params.append(request.date_range.start_date)
                where_conditions.append(f"DATE(s.created_at) >= %s")
            if request.date_range.end_date:
                params.append(request.date_range.end_date)
                where_conditions.append(f"DATE(s.created_at) <= %s")
        
        # Add custom filters (excluding date filters handled above)
        for field, filter_value in request.filters.items():
            # Skip date filters - they're handled by date_range
            if field in ('data_venda_gte', 'data_venda_lte'):
                continue
                
            if isinstance(filter_value, dict):
                # Complex filter with operator
                for operator, value in filter_value.items():
                    if operator == "eq":
                        params.append(value)
                        where_conditions.append(f"{field} = %s")
                    elif operator == "in" and isinstance(value, list):
                        placeholders = []
                        for v in value:
                            params.append(v)
                            placeholders.append("%s")
                        where_conditions.append(f"{field} IN ({', '.join(placeholders)})")
                    elif operator in ["gt", "gte", "lt", "lte"]:
                        op_map = {"gt": ">", "gte": ">=", "lt": "<", "lte": "<="}
                        params.append(value)
                        where_conditions.append(f"{field} {op_map[operator]} %s")
            else:
                # Simple equality filter (list = IN clause, single value = equality)
                if isinstance(filter_value, list):
                    placeholders = []
                    for v in filter_value:
                        params.append(v)
                        placeholders.append("%s")
                    where_conditions.append(f"{field} IN ({', '.join(placeholders)})")
                else:
                    params.append(filter_value)
                    where_conditions.append(f"{field} = %s")
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Build GROUP BY clause
        group_by_clause = ""
        if request.dimensions:
            group_by_fields = []
            for i, dim in enumerate(request.dimensions, start=1):
                if dim in self.DIMENSIONS_MAP:
                    group_by_fields.append(str(i))
            if group_by_fields:
                group_by_clause = f"GROUP BY {', '.join(group_by_fields)}"
        
        # Build ORDER BY clause
        order_by_clause = ""
        if request.order_by:
            order_parts = []
            for order_spec in request.order_by:
                field = order_spec.get("field")
                direction = order_spec.get("direction", "desc").upper()
                order_parts.append(f"{field} {direction}")
            order_by_clause = "ORDER BY " + ", ".join(order_parts)
        
        # Build LIMIT clause
        limit_clause = f"LIMIT {request.limit}" if request.limit else ""
        offset_clause = f"OFFSET {request.offset}" if request.offset else ""
        
        # Assemble final query
        query = f"""
SELECT
    {select_clause}
{from_clause}
{where_clause}
{group_by_clause}
{order_by_clause}
{limit_clause}
{offset_clause}
        """.strip()
        
        return query, params
    
    async def get_kpi_dashboard(
        self, 
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> KPIDashboard:
        """Get main KPI dashboard"""
        start_time = time.time()
        
        # Build date filter
        date_filter = ""
        params = []
        if start_date:
            params.append(start_date)
            date_filter += f" AND DATE(s.created_at) >= %s"
        if end_date:
            params.append(end_date)
            date_filter += f" AND DATE(s.created_at) <= %s"
        
        query = f"""
        SELECT
            SUM(total_amount) as faturamento_total,
            AVG(total_amount) as ticket_medio,
            COUNT(DISTINCT s.id) as total_vendas,
            COUNT(DISTINCT customer_id) FILTER (WHERE customer_id IS NOT NULL) as clientes_unicos,
            AVG(delivery_seconds / 60.0) FILTER (WHERE delivery_seconds IS NOT NULL) as tempo_medio_entrega_min,
            AVG(production_seconds / 60.0) FILTER (WHERE production_seconds IS NOT NULL) as tempo_medio_preparo_min
        FROM sales s
        WHERE sale_status_desc = 'COMPLETED' {date_filter}
        """
        
        row = await db.fetch_one(query, *params)
        
        kpis = [
            KPICard(
                label="Faturamento Total",
                value=float(row['faturamento_total'] or 0),
                format="currency"
            ),
            KPICard(
                label="Ticket Médio",
                value=float(row['ticket_medio'] or 0),
                format="currency"
            ),
            KPICard(
                label="Total de Vendas",
                value=int(row['total_vendas'] or 0),
                format="number"
            ),
            KPICard(
                label="Clientes Únicos",
                value=int(row['clientes_unicos'] or 0),
                format="number"
            ),
            KPICard(
                label="Tempo Médio Entrega",
                value=round(float(row['tempo_medio_entrega_min'] or 0), 1),
                format="duration"
            ),
            KPICard(
                label="Tempo Médio Preparo",
                value=round(float(row['tempo_medio_preparo_min'] or 0), 1),
                format="duration"
            ),
        ]
        
        query_time_ms = (time.time() - start_time) * 1000
        
        metadata = QueryMetadata(
            total_rows=len(kpis),
            query_time_ms=round(query_time_ms, 2),
            cached=False
        )
        
        period_label = f"{start_date} a {end_date}" if start_date and end_date else "Todos os períodos"
        
        return KPIDashboard(
            kpis=kpis,
            period=period_label,
            metadata=metadata
        )
    
    async def compare_periods(
        self,
        base_start: date,
        base_end: date,
        compare_start: date,
        compare_end: date
    ) -> Dict[str, Any]:
        """Compare metrics between two periods"""
        from app.models.schemas import MetricComparison, PeriodComparisonResponse
        
        start_time = time.time()
        
        # Query for base period
        base_query = """
        SELECT
            SUM(total_amount) as faturamento_total,
            AVG(total_amount) as ticket_medio,
            COUNT(DISTINCT s.id) as total_vendas,
            COUNT(DISTINCT customer_id) FILTER (WHERE customer_id IS NOT NULL) as clientes_unicos,
            AVG(delivery_seconds / 60.0) FILTER (WHERE delivery_seconds IS NOT NULL) as tempo_medio_entrega
        FROM sales s
        WHERE sale_status_desc = 'COMPLETED'
          AND DATE(s.created_at) >= %s
          AND DATE(s.created_at) <= %s
        """
        
        # Query for compare period  
        compare_query = """
        SELECT
            SUM(total_amount) as faturamento_total,
            AVG(total_amount) as ticket_medio,
            COUNT(DISTINCT s.id) as total_vendas,
            COUNT(DISTINCT customer_id) FILTER (WHERE customer_id IS NOT NULL) as clientes_unicos,
            AVG(delivery_seconds / 60.0) FILTER (WHERE delivery_seconds IS NOT NULL) as tempo_medio_entrega
        FROM sales s
        WHERE sale_status_desc = 'COMPLETED'
          AND DATE(s.created_at) >= %s
          AND DATE(s.created_at) <= %s
        """
        
        base_row = await db.fetch_one(base_query, base_start, base_end)
        compare_row = await db.fetch_one(compare_query, compare_start, compare_end)
        
        # Build comparisons
        comparisons = []
        metrics = [
            ('faturamento_total', 'Faturamento Total'),
            ('ticket_medio', 'Ticket Médio'),
            ('total_vendas', 'Total de Vendas'),
            ('clientes_unicos', 'Clientes Únicos'),
            ('tempo_medio_entrega', 'Tempo Médio de Entrega (min)')
        ]
        
        for metric_key, metric_name in metrics:
            base_val = float(base_row[metric_key] or 0)
            compare_val = float(compare_row[metric_key] or 0)
            
            absolute_change = base_val - compare_val
            percentage_change = ((base_val - compare_val) / compare_val * 100) if compare_val != 0 else 0
            
            # Determine trend
            if abs(percentage_change) < 1:
                trend = 'neutral'
            elif percentage_change > 0:
                trend = 'up'
            else:
                trend = 'down'
            
            comparisons.append(MetricComparison(
                metric_name=metric_name,
                base_value=base_val,
                compare_value=compare_val,
                absolute_change=absolute_change,
                percentage_change=round(percentage_change, 2),
                trend=trend
            ))
        
        query_time_ms = (time.time() - start_time) * 1000
        
        return PeriodComparisonResponse(
            base_period={'start': base_start, 'end': base_end},
            compare_period={'start': compare_start, 'end': compare_end},
            comparisons=comparisons,
            metadata=QueryMetadata(
                total_rows=len(comparisons),
                query_time_ms=round(query_time_ms, 2),
                cached=False
            )
        )


# Global service instance
analytics_service = AnalyticsService()
