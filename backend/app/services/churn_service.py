"""
Churn Analysis Service
Handles customer churn metrics and RFM segmentation analysis
"""
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from app.db.database import db
import logging

logger = logging.getLogger(__name__)


class ChurnService:
    """Service for customer churn analysis"""
    
    async def get_churn_metrics(self, days_inactive: int = 30) -> Dict:
        """
        Get overall churn metrics
        
        Args:
            days_inactive: Number of days to consider customer as inactive
            
        Returns:
            Dict with churn rate, at-risk customers, value at risk, etc.
            
        Note:
            Uses the last sale date in dataset as reference point.
            Churn is calculated relative to the dataset's timeframe, not current date.
        """
        query = f"""
        WITH dataset_reference AS (
            SELECT 
                MIN(created_at::date) as start_date,
                MAX(created_at::date) as reference_date,
                MAX(created_at::date) - MIN(created_at::date) as dataset_span_days
            FROM sales
        ),
        customer_stats AS (
            SELECT 
                customer_id,
                MAX(s.created_at) as last_purchase_date,
                COUNT(*) as total_purchases,
                SUM(s.total_amount) as lifetime_value,
                (SELECT reference_date FROM dataset_reference) - MAX(s.created_at::date) as days_since_last_purchase,
                (SELECT dataset_span_days FROM dataset_reference) as dataset_span
            FROM sales s
            GROUP BY customer_id
        ),
        churn_classification AS (
            SELECT 
                customer_id,
                total_purchases,
                lifetime_value,
                days_since_last_purchase,
                dataset_span,
                CASE 
                    -- If dataset span is less than threshold, use adaptive calculation
                    -- Churned: > 50%% of dataset span (or original threshold if smaller)
                    WHEN dataset_span < {days_inactive} THEN
                        CASE 
                            WHEN days_since_last_purchase > (dataset_span * 0.5) THEN 'churned'
                            WHEN days_since_last_purchase > (dataset_span * 0.3) THEN 'at_risk'
                            ELSE 'active'
                        END
                    ELSE
                        CASE 
                            WHEN days_since_last_purchase > {days_inactive} THEN 'churned'
                            WHEN days_since_last_purchase > {days_inactive // 2} THEN 'at_risk'
                            ELSE 'active'
                        END
                END as status
            FROM customer_stats
            WHERE total_purchases >= 1
        )
        SELECT 
            COUNT(*) FILTER (WHERE status = 'churned') as churned_customers,
            COUNT(*) FILTER (WHERE status = 'at_risk') as at_risk_customers,
            COUNT(*) FILTER (WHERE status = 'active') as active_customers,
            COUNT(*) as total_customers,
            COALESCE(SUM(lifetime_value) FILTER (WHERE status = 'churned'), 0) as value_at_risk,
            COALESCE(AVG(lifetime_value) FILTER (WHERE status = 'churned'), 0) as avg_churned_value,
            COALESCE(AVG(days_since_last_purchase) FILTER (WHERE status = 'churned'), 0) as avg_days_churned,
            (SELECT reference_date FROM dataset_reference) as reference_date,
            (SELECT dataset_span_days FROM dataset_reference) as dataset_span_days
        FROM churn_classification
        """
        
        row = await db.fetch_one(query)
        
        total = row['total_customers'] or 1
        churned = row['churned_customers'] or 0
        
        logger.info(f"📊 Churn calculation - Reference: {row['reference_date']}, Dataset span: {row['dataset_span_days']} days")
        logger.info(f"📊 Churn metrics - Total: {total}, Churned: {churned}, At Risk: {row['at_risk_customers']}, Active: {row['active_customers']}")
        
        return {
            'churn_rate': round((churned / total) * 100, 2) if total > 0 else 0,
            'churned_customers': churned,
            'at_risk_customers': row['at_risk_customers'] or 0,
            'active_customers': row['active_customers'] or 0,
            'total_customers': total,
            'value_at_risk': float(row['value_at_risk'] or 0),
            'avg_churned_value': float(row['avg_churned_value'] or 0),
            'avg_days_churned': int(row['avg_days_churned'] or 0),
            'reference_date': row['reference_date'].isoformat() if row.get('reference_date') else None,
            'dataset_span_days': row['dataset_span_days']
        }
    
    async def get_at_risk_customers(
        self, 
        min_purchases: int = 2,
        days_inactive: int = 30,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get list of customers at risk of churning
        
        Args:
            min_purchases: Minimum number of purchases to consider
            days_inactive: Days since last purchase to flag as at-risk
            limit: Maximum number of results
            
        Returns:
            List of at-risk customer records
            
        Note:
            Uses the last sale date in dataset as reference point instead of CURRENT_DATE
        """
        query = f"""
        WITH dataset_reference AS (
            SELECT MAX(created_at::date) as reference_date
            FROM sales
        )
        SELECT 
            s.customer_id,
            COALESCE(c.customer_name, s.customer_name, 'Cliente #' || s.customer_id) as customer_name,
            COUNT(DISTINCT s.id) as total_purchases,
            SUM(s.total_amount) as lifetime_value,
            AVG(s.total_amount) as avg_order_value,
            MAX(s.created_at) as last_purchase_date,
            (SELECT reference_date FROM dataset_reference) - MAX(s.created_at::date) as days_since_last_purchase,
            STRING_AGG(DISTINCT st.name, ', ') as favorite_stores
        FROM sales s
        CROSS JOIN dataset_reference dr
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN stores st ON s.store_id = st.id
        WHERE s.customer_id IS NOT NULL
        GROUP BY s.customer_id, c.customer_name, s.customer_name
        HAVING 
            COUNT(*) >= {min_purchases}
            AND (SELECT reference_date FROM dataset_reference) - MAX(s.created_at::date) BETWEEN {days_inactive // 2} AND {days_inactive}
        ORDER BY (SELECT reference_date FROM dataset_reference) - MAX(s.created_at::date) DESC, 
                 SUM(s.total_amount) DESC
        LIMIT {limit}
        """
        
        rows = await db.fetch_all(query)
        
        return [
            {
                'customer_id': row['customer_id'],
                'customer_name': row['customer_name'],
                'total_purchases': row['total_purchases'],
                'lifetime_value': float(row['lifetime_value']),
                'avg_order_value': float(row['avg_order_value']),
                'last_purchase_date': row['last_purchase_date'].isoformat() if row['last_purchase_date'] else None,
                'days_since_last_purchase': row['days_since_last_purchase'],
                'favorite_stores': row['favorite_stores'],
                'risk_score': self._calculate_risk_score(
                    days_inactive=row['days_since_last_purchase'],
                    total_purchases=row['total_purchases'],
                    lifetime_value=float(row['lifetime_value'])
                )
            }
            for row in rows
        ]
    
    async def get_rfm_segmentation(self) -> List[Dict]:
        """
        Get RFM (Recency, Frequency, Monetary) segmentation data
        
        Returns:
            List of customer segments with RFM scores
            
        Note:
            Uses the last sale date in dataset as reference point instead of CURRENT_DATE
        """
        query = """
        WITH dataset_reference AS (
            SELECT MAX(created_at::date) as reference_date
            FROM sales
        ),
        customer_metrics AS (
            SELECT 
                customer_id,
                (SELECT reference_date FROM dataset_reference) - MAX(s.created_at::date) as recency,
                COUNT(*) as frequency,
                SUM(s.total_amount) as monetary
            FROM sales s
            WHERE customer_id IS NOT NULL
            GROUP BY customer_id
        ),
        rfm_scores AS (
            SELECT 
                customer_id,
                recency,
                frequency,
                monetary,
                -- Calculate RFM scores (1-5, where 5 is best)
                NTILE(5) OVER (ORDER BY recency DESC) as recency_score,
                NTILE(5) OVER (ORDER BY frequency ASC) as frequency_score,
                NTILE(5) OVER (ORDER BY monetary ASC) as monetary_score
            FROM customer_metrics
        )
        SELECT 
            recency_score,
            frequency_score,
            monetary_score,
            COUNT(*) as customer_count,
            ROUND(AVG(recency)::numeric, 2) as avg_recency,
            ROUND(AVG(frequency)::numeric, 2) as avg_frequency,
            ROUND(AVG(monetary)::numeric, 2) as avg_monetary,
            CASE 
                WHEN recency_score >= 4 AND frequency_score >= 4 THEN 'Campeões'
                WHEN recency_score >= 3 AND frequency_score >= 3 THEN 'Clientes Fiéis'
                WHEN recency_score >= 4 AND frequency_score <= 2 THEN 'Promissores'
                WHEN recency_score <= 2 AND frequency_score >= 4 THEN 'Em Risco'
                WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'Hibernando'
                WHEN recency_score <= 1 THEN 'Perdidos'
                ELSE 'Potenciais'
            END as segment_name
        FROM rfm_scores
        GROUP BY recency_score, frequency_score, monetary_score
        ORDER BY recency_score DESC, frequency_score DESC, monetary_score DESC
        """
        
        rows = await db.fetch_all(query)
        
        return [
            {
                'recency_score': row['recency_score'],
                'frequency_score': row['frequency_score'],
                'monetary_score': row['monetary_score'],
                'customer_count': row['customer_count'],
                'avg_recency': float(row['avg_recency']),
                'avg_frequency': float(row['avg_frequency']),
                'avg_monetary': float(row['avg_monetary']),
                'segment_name': row['segment_name']
            }
            for row in rows
        ]
    
    async def get_churn_trend(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        granularity: str = 'week'
    ) -> List[Dict]:
        """
        Get churn trend over time
        
        Args:
            start_date: Start date for analysis
            end_date: End date for analysis (uses last sale date if not provided)
            granularity: 'day', 'week', or 'month'
            
        Returns:
            List of churn metrics by time period
            
        Note:
            If end_date not provided, uses last sale date from dataset
        """
        # Get dataset date range if not provided
        if not end_date or not start_date:
            date_range_query = "SELECT MIN(created_at::date) as min_date, MAX(created_at::date) as max_date FROM sales"
            date_row = await db.fetch_one(date_range_query)
            if not end_date:
                end_date = date_row['max_date']
            if not start_date:
                # Use 90 days before end_date or min_date, whichever is later
                start_date = max(date_row['min_date'], end_date - timedelta(days=90))
        
        # Map granularity to SQL date truncation
        date_trunc_map = {
            'day': 'day',
            'week': 'week',
            'month': 'month'
        }
        trunc = date_trunc_map.get(granularity, 'week')
        
        query = f"""
        WITH period_series AS (
            SELECT generate_series(
                DATE_TRUNC('{trunc}', '{start_date}'::date),
                DATE_TRUNC('{trunc}', '{end_date}'::date),
                '1 {trunc}'::interval
            )::date as period
        ),
        sales_by_period AS (
            SELECT 
                DATE_TRUNC('{trunc}', created_at)::date as period,
                customer_id,
                MAX(created_at) as last_purchase_in_period
            FROM sales
            WHERE created_at::date BETWEEN '{start_date}' AND '{end_date}'
                AND customer_id IS NOT NULL
            GROUP BY DATE_TRUNC('{trunc}', created_at)::date, customer_id
        ),
        customer_status_by_period AS (
            SELECT 
                ps.period,
                COUNT(DISTINCT sbp.customer_id) as active_customers,
                COUNT(DISTINCT CASE 
                    WHEN sbp.last_purchase_in_period < ps.period - INTERVAL '30 days' 
                    THEN sbp.customer_id 
                END) as churned_customers
            FROM period_series ps
            LEFT JOIN sales_by_period sbp ON sbp.period <= ps.period
            GROUP BY ps.period
        )
        SELECT 
            period::date as date,
            active_customers,
            churned_customers,
            CASE 
                WHEN active_customers > 0 
                THEN ROUND((churned_customers::numeric / active_customers) * 100, 2)
                ELSE 0 
            END as churn_rate
        FROM customer_status_by_period
        ORDER BY period
        """
        
        rows = await db.fetch_all(query)
        
        return [
            {
                'date': row['date'].isoformat(),
                'active_customers': row['active_customers'],
                'churned_customers': row['churned_customers'],
                'churn_rate': float(row['churn_rate'])
            }
            for row in rows
        ]
    
    def _calculate_risk_score(
        self,
        days_inactive: int,
        total_purchases: int,
        lifetime_value: float
    ) -> int:
        """
        Calculate risk score (0-100) for customer churn
        Higher score = higher risk
        """
        # Recency risk (0-40 points)
        recency_risk = min(40, (days_inactive / 30) * 40)
        
        # Frequency risk (0-30 points) - fewer purchases = higher risk
        frequency_risk = max(0, 30 - (total_purchases * 3))
        
        # Monetary risk (0-30 points) - lower value = higher risk
        monetary_risk = max(0, 30 - (lifetime_value / 100))
        
        total_risk = int(recency_risk + frequency_risk + monetary_risk)
        return min(100, max(0, total_risk))


# Singleton instance
churn_service = ChurnService()
