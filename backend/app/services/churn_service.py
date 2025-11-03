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
        """
        query = f"""
        WITH customer_stats AS (
            SELECT 
                customer_id,
                MAX(created_at) as last_purchase_date,
                COUNT(*) as total_purchases,
                SUM(total_amount) as lifetime_value,
                CURRENT_DATE - MAX(created_at::date) as days_since_last_purchase
            FROM sales
            GROUP BY customer_id
        ),
        churn_classification AS (
            SELECT 
                customer_id,
                total_purchases,
                lifetime_value,
                days_since_last_purchase,
                CASE 
                    WHEN days_since_last_purchase > {days_inactive} THEN 'churned'
                    WHEN days_since_last_purchase > {days_inactive // 2} THEN 'at_risk'
                    ELSE 'active'
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
            COALESCE(AVG(days_since_last_purchase) FILTER (WHERE status = 'churned'), 0) as avg_days_churned
        FROM churn_classification
        """
        
        row = await db.fetch_one(query)
        
        total = row['total_customers'] or 1
        churned = row['churned_customers'] or 0
        
        return {
            'churn_rate': round((churned / total) * 100, 2) if total > 0 else 0,
            'churned_customers': churned,
            'at_risk_customers': row['at_risk_customers'] or 0,
            'active_customers': row['active_customers'] or 0,
            'total_customers': total,
            'value_at_risk': float(row['value_at_risk'] or 0),
            'avg_churned_value': float(row['avg_churned_value'] or 0),
            'avg_days_churned': int(row['avg_days_churned'] or 0)
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
        """
        query = f"""
        SELECT 
            s.customer_id,
            COALESCE(c.customer_name, s.customer_name) as customer_name,
            COUNT(DISTINCT s.id) as total_purchases,
            SUM(s.total_amount) as lifetime_value,
            AVG(s.total_amount) as avg_order_value,
            MAX(s.created_at) as last_purchase_date,
            CURRENT_DATE - MAX(s.created_at::date) as days_since_last_purchase,
            STRING_AGG(DISTINCT st.name, ', ') as favorite_stores
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN stores st ON s.store_id = st.id
        GROUP BY s.customer_id, c.customer_name, s.customer_name
        HAVING 
            COUNT(*) >= {min_purchases}
            AND CURRENT_DATE - MAX(s.created_at::date) BETWEEN {days_inactive // 2} AND {days_inactive}
        ORDER BY lifetime_value DESC
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
        """
        query = """
        WITH customer_metrics AS (
            SELECT 
                customer_id,
                CURRENT_DATE - MAX(created_at::date) as recency,
                COUNT(*) as frequency,
                SUM(total_amount) as monetary
            FROM sales
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
                WHEN recency_score >= 4 AND frequency_score >= 4 THEN 'Champions'
                WHEN recency_score >= 3 AND frequency_score >= 3 THEN 'Loyal Customers'
                WHEN recency_score >= 4 AND frequency_score <= 2 THEN 'Promising'
                WHEN recency_score <= 2 AND frequency_score >= 4 THEN 'At Risk'
                WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'Hibernating'
                WHEN recency_score <= 1 THEN 'Lost'
                ELSE 'Potential'
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
            end_date: End date for analysis
            granularity: 'day', 'week', or 'month'
            
        Returns:
            List of churn metrics by time period
        """
        if not start_date:
            start_date = date.today() - timedelta(days=90)
        if not end_date:
            end_date = date.today()
        
        # Map granularity to SQL date truncation
        date_trunc_map = {
            'day': 'day',
            'week': 'week',
            'month': 'month'
        }
        trunc = date_trunc_map.get(granularity, 'week')
        
        query = f"""
        WITH customer_last_purchase AS (
            SELECT 
                customer_id,
                DATE_TRUNC('{trunc}', MAX(created_at)) as last_period,
                COUNT(*) as total_purchases
            FROM sales
            WHERE created_at::date BETWEEN '{start_date}' AND '{end_date}'
            GROUP BY customer_id
        ),
        period_series AS (
            SELECT generate_series(
                DATE_TRUNC('{trunc}', '{start_date}'::date),
                DATE_TRUNC('{trunc}', '{end_date}'::date),
                '1 {trunc}'::interval
            ) as period
        )
        SELECT 
            ps.period::date as date,
            COUNT(DISTINCT clp.customer_id) as active_customers,
            COUNT(DISTINCT clp.customer_id) FILTER (
                WHERE clp.last_period < ps.period - INTERVAL '30 days'
            ) as churned_customers
        FROM period_series ps
        LEFT JOIN customer_last_purchase clp ON DATE_TRUNC('{trunc}', clp.last_period) = ps.period
        GROUP BY ps.period
        ORDER BY ps.period
        """
        
        rows = await db.fetch_all(query)
        
        return [
            {
                'date': row['date'].isoformat(),
                'active_customers': row['active_customers'],
                'churned_customers': row['churned_customers'],
                'churn_rate': round(
                    (row['churned_customers'] / max(row['active_customers'], 1)) * 100, 
                    2
                )
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
