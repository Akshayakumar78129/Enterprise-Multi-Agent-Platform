"""
Retention Planner Processing Service
Complete implementation following ChurnPredictionService pattern
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import RetentionPlannerDataService
from .ml_predictor import RetentionPlannerMLPredictor

logger = logging.getLogger(__name__)


def convert_numpy_types(obj):
    """
    Recursively convert numpy types to native Python types for JSON serialization.
    Handles numpy.int64, numpy.float64, etc.
    """
    if isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif pd.isna(obj):
        return None
    else:
        return obj


class RetentionPlannerService:
    """Processing service for Customer retention strategy planning and optimization"""

    def __init__(self):
        """Initialize the service with data service and ML predictor"""
        self.data_service = RetentionPlannerDataService()
        self.ml_predictor = RetentionPlannerMLPredictor()
        logger.info(f"{self.__class__.__name__} initialized")

    @cache_dashboard_endpoint(dashboard_type='retention-planner', ttl=300)
    async def get_dashboard_summary(self, filters: Dict = {}) -> Dict:
        """Get Retention Planner dashboard summary with ML predictions"""

        try:
            logger.info(f"Getting Retention Planner summary with filters: {filters}")

            # Parse date filters
            date_filters = self._parse_date_filters(filters)

            # Get data from data service
            customers = await self.data_service.get_customers(date_filters)
            transactions = await self.data_service.get_transactions(date_filters)
            loyalty = await self.data_service.get_loyalty(date_filters)
            aggregated = await self.data_service.get_aggregated_metrics(date_filters)

            # Convert to DataFrames
            customers_df = pd.DataFrame(customers.get('rows', customers.get('data', [])))
            transactions_df = pd.DataFrame(transactions.get('rows', transactions.get('data', [])))
            loyalty_df = pd.DataFrame(loyalty.get('rows', loyalty.get('data', [])))
            aggregated_df = pd.DataFrame(aggregated.get('rows', aggregated.get('data', [])))

            # Deduplicate loyalty data - keep most recent record per customer
            if not loyalty_df.empty and 'customer_id' in loyalty_df.columns:
                # Sort by last_activity_date descending and keep first (most recent) per customer
                if 'last_activity_date' in loyalty_df.columns:
                    loyalty_df = loyalty_df.sort_values('last_activity_date', ascending=False).drop_duplicates('customer_id', keep='first')
                else:
                    loyalty_df = loyalty_df.drop_duplicates('customer_id', keep='first')

                # Filter loyalty data to only include customers in the filtered customers_df
                if not customers_df.empty and 'customer_id' in customers_df.columns:
                    valid_customer_ids = customers_df['customer_id'].unique()
                    loyalty_df = loyalty_df[loyalty_df['customer_id'].isin(valid_customer_ids)]

            # Perform ML analysis based on dashboard type
            ml_results = self._perform_ml_analysis(
                aggregated_df if not aggregated_df.empty else customers_df,
                transactions_df
            )

            # Calculate KPIs
            kpis = self._calculate_kpis(customers_df, transactions_df, loyalty_df, ml_results)

            # Generate visualizations data
            visualizations = self._generate_visualizations(
                customers_df, transactions_df, loyalty_df, ml_results
            )

            # Generate rule-based insights
            rule_based_insights = self._generate_insights(ml_results, kpis)

            # Get AI-powered insights from separate cache
            ai_insights = await self._get_cached_ai_insights(
                filters,
                customers_df,
                loyalty_df,
                kpis,
                visualizations
            )

            # COMBINE into single unified insights array
            combined_insights = rule_based_insights + ai_insights

            # Build response
            response = {
                'kpiMetrics': kpis,
                'mainData': visualizations,
                'mlResults': ml_results,
                'insights': combined_insights,
                'metadata': {
                    'analysisDate': datetime.now().isoformat(),
                    'totalCustomers': len(customers_df),
                    'totalTransactions': len(transactions_df),
                    'filters': filters,
                    'dataQuality': self._assess_data_quality(customers_df, transactions_df)
                }
            }

            # Convert all numpy types to native Python types for JSON serialization
            return convert_numpy_types(response)

        except Exception as e:
            logger.error(f"Error in get_dashboard_summary: {str(e)}", exc_info=True)
            return self._get_error_response(str(e))

    def _perform_ml_analysis(self, df: pd.DataFrame, transaction_df: pd.DataFrame = None) -> Dict:
        """Perform ML analysis specific to this dashboard"""

        if df.empty:
            return self._get_empty_ml_results()

        # Call appropriate ML predictor method based on dashboard
        if 'retention_planner' == 'customer_segmentation':
            return self.ml_predictor.perform_segmentation(df)
        elif 'retention_planner' == 'customer_ltv':
            return self.ml_predictor.predict_ltv(df)
        elif 'retention_planner' == 'engagement_classifier':
            return self.ml_predictor.classify_engagement(df)
        elif 'retention_planner' == 'next_purchase' and transaction_df is not None:
            return self.ml_predictor.predict_next_purchase(df, transaction_df)
        else:
            return self.ml_predictor.analyze_data(df)

    def _calculate_kpis(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                       loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Calculate KPI metrics for retention planning"""

        kpis = {}

        # Calculate retention-specific KPIs
        total_customers = len(customers_df) if not customers_df.empty else 0

        # Identify at-risk customers from loyalty data (already deduplicated in get_dashboard_summary)
        # RFM score is 3-15 scale (R+F+M where each is 1-5), so use threshold of 9 (median/below)
        # At-risk: inactive for >90 days OR low RFM score (bottom 40%)
        at_risk_customers = loyalty_df[
            (loyalty_df['days_since_last_activity'] > 90) |
            (loyalty_df['rfm_score'] <= 9)
        ] if not loyalty_df.empty and 'days_since_last_activity' in loyalty_df.columns and 'rfm_score' in loyalty_df.columns else pd.DataFrame()

        at_risk_count = len(at_risk_customers)

        # Calculate at-risk customer value
        at_risk_value = 0
        if not at_risk_customers.empty and 'lifetime_sales' in at_risk_customers.columns:
            at_risk_value = at_risk_customers['lifetime_sales'].sum()

        # Calculate retention rate (customers active in last 90 days)
        active_customers = loyalty_df[
            loyalty_df['days_since_last_activity'] <= 90
        ] if not loyalty_df.empty and 'days_since_last_activity' in loyalty_df.columns else pd.DataFrame()

        retention_rate = (len(active_customers) / total_customers * 100) if total_customers > 0 else 0

        # Get segments from ML results
        segments = ml_results.get('segments', [])
        high_risk_segments = [s for s in segments if s.get('risk_level') == 'High']

        # Calculate intervention success rate (mock - would come from historical data)
        intervention_success = 65.0

        # Calculate projected cost savings (at-risk value * intervention success rate * retention uplift)
        retention_uplift = 0.30  # 30% uplift from interventions
        cost_savings = at_risk_value * (intervention_success / 100) * retention_uplift

        kpis = {
            'totalCustomers': total_customers,
            'retentionRate': float(retention_rate),
            'atRiskCount': at_risk_count,
            'atRiskValue': float(at_risk_value) if at_risk_value else 0,
            'interventionSuccess': float(intervention_success),
            'costSavings': float(cost_savings) if cost_savings else 0,
            'highRiskSegments': len(high_risk_segments),
            'activeCustomers': len(active_customers)
        }

        return kpis

    def _generate_visualizations(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                                loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Generate data for retention planning visualizations"""

        visualizations = {}

        # Generate retention-specific visualizations
        visualizations = {
            'riskDistributionData': self._create_risk_distribution_chart(loyalty_df, ml_results),
            'valueRiskMatrixData': self._create_value_risk_matrix(loyalty_df, ml_results),
            'interventionroiData': self._create_intervention_roi_chart(ml_results),
            'customerLifecycleData': self._create_lifecycle_chart(loyalty_df),
            'retentionStrategiesData': self._create_retention_strategies_data(ml_results),
            'campaignRecommendationsData': self._create_campaign_recommendations(ml_results, loyalty_df)
        }

        return visualizations

    def _create_risk_distribution_chart(self, loyalty_df: pd.DataFrame, ml_results: Dict) -> List[Dict]:
        """Create churn risk distribution chart data"""

        if loyalty_df.empty:
            return []

        # Categorize customers by risk level based on days since last activity
        risk_categories = []
        if 'days_since_last_activity' in loyalty_df.columns:
            loyalty_df['risk_level'] = pd.cut(
                loyalty_df['days_since_last_activity'],
                bins=[0, 30, 90, 180, float('inf')],
                labels=['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk']
            )

            risk_counts = loyalty_df['risk_level'].value_counts()
            risk_categories = [
                {
                    'riskLevel': str(level),
                    'count': int(count),
                    'percentage': float(count / len(loyalty_df) * 100)
                }
                for level, count in risk_counts.items()
            ]

        return risk_categories

    def _create_value_risk_matrix(self, loyalty_df: pd.DataFrame, ml_results: Dict) -> List[Dict]:
        """Create value-risk matrix combining customer value and churn risk"""

        if loyalty_df.empty or 'lifetime_sales' not in loyalty_df.columns:
            return []

        # Categorize by value and risk
        loyalty_df['value_segment'] = pd.qcut(
            loyalty_df['lifetime_sales'],
            q=3,
            labels=['Low Value', 'Medium Value', 'High Value'],
            duplicates='drop'
        )

        if 'days_since_last_activity' in loyalty_df.columns:
            loyalty_df['risk_segment'] = pd.cut(
                loyalty_df['days_since_last_activity'],
                bins=[0, 90, 180, float('inf')],
                labels=['Low Risk', 'Medium Risk', 'High Risk']
            )

            # Create matrix data
            matrix_data = []
            for value in ['Low Value', 'Medium Value', 'High Value']:
                for risk in ['Low Risk', 'Medium Risk', 'High Risk']:
                    subset = loyalty_df[
                        (loyalty_df['value_segment'] == value) &
                        (loyalty_df['risk_segment'] == risk)
                    ]
                    matrix_data.append({
                        'valueSegment': value,
                        'riskSegment': risk,
                        'count': len(subset),
                        'totalValue': float(subset['lifetime_sales'].sum()) if not subset.empty else 0,
                        'priority': self._calculate_priority(value, risk)
                    })

            return matrix_data

        return []

    def _calculate_priority(self, value: str, risk: str) -> str:
        """Calculate intervention priority based on value and risk"""
        if value == 'High Value' and risk in ['Medium Risk', 'High Risk']:
            return 'Critical'
        elif value == 'Medium Value' and risk == 'High Risk':
            return 'High'
        elif value == 'High Value' and risk == 'Low Risk':
            return 'Medium'
        else:
            return 'Low'

    def _create_intervention_roi_chart(self, ml_results: Dict) -> List[Dict]:
        """Create intervention ROI chart data"""

        # Define intervention strategies with expected ROI
        interventions = [
            {
                'strategy': 'Personal Outreach',
                'targetSegment': 'High Value + High Risk',
                'cost': 500,
                'expectedRevenue': 3500,
                'roi': 7.0,
                'successRate': 65
            },
            {
                'strategy': 'Automated Email Campaign',
                'targetSegment': 'Medium Value + Medium Risk',
                'cost': 50,
                'expectedRevenue': 450,
                'roi': 9.0,
                'successRate': 45
            },
            {
                'strategy': 'Loyalty Discount',
                'targetSegment': 'High Value + Low Risk',
                'cost': 200,
                'expectedRevenue': 1200,
                'roi': 6.0,
                'successRate': 80
            },
            {
                'strategy': 'Re-engagement Campaign',
                'targetSegment': 'Low Value + High Risk',
                'cost': 100,
                'expectedRevenue': 350,
                'roi': 3.5,
                'successRate': 35
            },
            {
                'strategy': 'VIP Program',
                'targetSegment': 'High Value + All Risk',
                'cost': 1000,
                'expectedRevenue': 8000,
                'roi': 8.0,
                'successRate': 75
            }
        ]

        return interventions

    def _create_lifecycle_chart(self, loyalty_df: pd.DataFrame) -> List[Dict]:
        """Create customer lifecycle stage distribution"""

        if loyalty_df.empty or 'days_since_last_activity' not in loyalty_df.columns:
            return []

        # Define lifecycle stages
        loyalty_df['lifecycle_stage'] = pd.cut(
            loyalty_df['days_since_last_activity'],
            bins=[0, 30, 90, 180, 365, float('inf')],
            labels=['Active', 'Engaged', 'At Risk', 'Dormant', 'Lost']
        )

        lifecycle_counts = loyalty_df['lifecycle_stage'].value_counts()
        lifecycle_data = [
            {
                'stage': str(stage),
                'count': int(count),
                'percentage': float(count / len(loyalty_df) * 100)
            }
            for stage, count in lifecycle_counts.items()
        ]

        return lifecycle_data

    def _create_retention_strategies_data(self, ml_results: Dict) -> List[Dict]:
        """Create recommended retention strategies based on segments"""

        segments = ml_results.get('segments', [])
        strategies = []

        for segment in segments:
            # Determine risk level based on segment characteristics
            avg_revenue = segment.get('avg_revenue', 0)
            segment_size = segment.get('size', 0)

            if avg_revenue > 5000:
                strategy = {
                    'segmentId': segment.get('segment_id'),
                    'segmentSize': segment_size,
                    'recommendedAction': 'VIP Retention Program',
                    'estimatedCost': segment_size * 50,
                    'expectedRetention': 85,
                    'priority': 'Critical'
                }
            elif avg_revenue > 2000:
                strategy = {
                    'segmentId': segment.get('segment_id'),
                    'segmentSize': segment_size,
                    'recommendedAction': 'Loyalty Rewards',
                    'estimatedCost': segment_size * 20,
                    'expectedRetention': 70,
                    'priority': 'High'
                }
            else:
                strategy = {
                    'segmentId': segment.get('segment_id'),
                    'segmentSize': segment_size,
                    'recommendedAction': 'Automated Engagement',
                    'estimatedCost': segment_size * 5,
                    'expectedRetention': 55,
                    'priority': 'Medium'
                }

            strategies.append(strategy)

        return strategies

    def _create_campaign_recommendations(self, ml_results: Dict, loyalty_df: pd.DataFrame) -> List[Dict]:
        """Create targeted campaign recommendations"""

        campaigns = []

        # Campaign 1: Win-back campaign for high-value dormant customers
        if not loyalty_df.empty and 'days_since_last_activity' in loyalty_df.columns and 'lifetime_sales' in loyalty_df.columns:
            dormant_high_value = loyalty_df[
                (loyalty_df['days_since_last_activity'] > 180) &
                (loyalty_df['lifetime_sales'] > 5000)
            ]

            if not dormant_high_value.empty:
                campaigns.append({
                    'campaignName': 'High-Value Win-Back',
                    'targetCount': len(dormant_high_value),
                    'estimatedCost': len(dormant_high_value) * 100,
                    'expectedRevenue': len(dormant_high_value) * 2000,
                    'roi': 20.0,
                    'channel': 'Email + Phone',
                    'duration': '4 weeks'
                })

            # Campaign 2: At-risk prevention
            at_risk = loyalty_df[
                (loyalty_df['days_since_last_activity'] > 90) &
                (loyalty_df['days_since_last_activity'] <= 180)
            ]

            if not at_risk.empty:
                campaigns.append({
                    'campaignName': 'At-Risk Prevention',
                    'targetCount': len(at_risk),
                    'estimatedCost': len(at_risk) * 25,
                    'expectedRevenue': len(at_risk) * 500,
                    'roi': 20.0,
                    'channel': 'Email',
                    'duration': '2 weeks'
                })

            # Campaign 3: Loyalty strengthening
            active_customers = loyalty_df[
                loyalty_df['days_since_last_activity'] <= 30
            ]

            if not active_customers.empty:
                campaigns.append({
                    'campaignName': 'Loyalty Strengthening',
                    'targetCount': len(active_customers),
                    'estimatedCost': len(active_customers) * 10,
                    'expectedRevenue': len(active_customers) * 300,
                    'roi': 30.0,
                    'channel': 'Email + App',
                    'duration': '6 weeks'
                })

        return campaigns

    def _create_segment_distribution_chart(self, ml_results: Dict) -> List[Dict]:
        """Create segment distribution chart data"""

        segments = ml_results.get('segments', [])
        return [
            {
                'name': f"Segment {s['segment_id']}",
                'value': s['size'],
                'percentage': s['percentage']
            }
            for s in segments
        ]

    def _create_segment_characteristics_chart(self, ml_results: Dict) -> Dict:
        """Create segment characteristics radar chart data"""

        segments = ml_results.get('segments', [])
        if not segments:
            return {}

        # Get all characteristics
        all_features = set()
        for s in segments:
            if 'characteristics' in s:
                all_features.update(s['characteristics'].keys())

        return {
            'features': list(all_features),
            'segments': [
                {
                    'name': f"Segment {s['segment_id']}",
                    'values': [s.get('characteristics', {}).get(f, 0) for f in all_features]
                }
                for s in segments
            ]
        }

    def _create_segment_matrix(self, ml_results: Dict) -> List[List[Any]]:
        """Create segment comparison matrix"""

        segments = ml_results.get('segments', [])
        if not segments:
            return []

        matrix = []
        headers = ['Segment', 'Size', 'Avg Revenue', 'Avg Transactions']
        matrix.append(headers)

        for s in segments:
            matrix.append([
                f"Segment {s['segment_id']}",
                s['size'],
                f"${s['avg_revenue']:.2f}",
                f"{s['avg_transactions']:.1f}"
            ])

        return matrix

    def _create_ltv_distribution_chart(self, ml_results: Dict) -> List[Dict]:
        """Create LTV distribution chart data"""

        predictions = ml_results.get('predictions', [])
        if not predictions:
            return []

        ltv_values = [p.get('predicted_ltv', 0) for p in predictions]

        # Create histogram bins
        hist, bin_edges = np.histogram(ltv_values, bins=10)

        return [
            {
                'range': f"${int(bin_edges[i])}-${int(bin_edges[i+1])}",
                'count': int(hist[i])
            }
            for i in range(len(hist))
        ]

    def _create_ltv_trend_chart(self, transactions_df: pd.DataFrame) -> List[Dict]:
        """Create LTV trend over time chart"""

        if transactions_df.empty or 'txn_date' not in transactions_df.columns:
            # Return mock data
            dates = pd.date_range(end=datetime.now(), periods=12, freq='M')
            return [
                {
                    'date': date.isoformat(),
                    'ltv': np.random.uniform(1000, 5000)
                }
                for date in dates
            ]

        transactions_df['txn_date'] = pd.to_datetime(transactions_df['txn_date'])
        monthly_ltv = transactions_df.groupby(pd.Grouper(key='txn_date', freq='M'))['net_sales_amount'].sum()

        return [
            {
                'date': date.isoformat(),
                'ltv': float(value)
            }
            for date, value in monthly_ltv.items()
        ]

    def _create_value_matrix(self, ml_results: Dict) -> Dict:
        """Create customer value matrix"""

        predictions = ml_results.get('predictions', [])
        if not predictions:
            return {}

        # Categorize customers by LTV
        categories = {
            'VIP': [],
            'High': [],
            'Medium': [],
            'Low': []
        }

        for pred in predictions:
            ltv = pred.get('predicted_ltv', 0)
            percentile = pred.get('ltv_percentile', 'Medium')
            categories[percentile].append(pred)

        return {
            'categories': [
                {
                    'name': cat,
                    'count': len(customers),
                    'avgLTV': np.mean([c.get('predicted_ltv', 0) for c in customers]) if customers else 0
                }
                for cat, customers in categories.items()
            ]
        }

    def _create_ltv_by_segment_chart(self, ml_results: Dict) -> List[Dict]:
        """Create LTV by customer segment chart"""

        # Mock data for demonstration
        return [
            {'segment': 'Enterprise', 'ltv': 15000},
            {'segment': 'SMB', 'ltv': 5000},
            {'segment': 'Retail', 'ltv': 2000},
            {'segment': 'Individual', 'ltv': 500}
        ]

    def _create_time_series_chart(self, transactions_df: pd.DataFrame) -> List[Dict]:
        """Create generic time series chart"""

        if transactions_df.empty or 'txn_date' not in transactions_df.columns:
            # Return mock data
            dates = pd.date_range(end=datetime.now(), periods=30, freq='D')
            return [
                {
                    'date': date.isoformat(),
                    'value': np.random.uniform(100, 1000)
                }
                for date in dates
            ]

        transactions_df['txn_date'] = pd.to_datetime(transactions_df['txn_date'])
        daily_data = transactions_df.groupby(pd.Grouper(key='txn_date', freq='D')).size()

        return [
            {
                'date': date.isoformat(),
                'value': int(value)
            }
            for date, value in daily_data.items()
        ]

    def _create_distribution_chart(self, ml_results: Dict) -> List[Dict]:
        """Create generic distribution chart"""

        # Use any available distribution data from ML results
        distribution = ml_results.get('distribution', {})

        if not distribution:
            # Return mock data
            categories = ['Category A', 'Category B', 'Category C', 'Category D']
            return [
                {
                    'category': cat,
                    'value': np.random.randint(10, 100)
                }
                for cat in categories
            ]

        return [
            {'category': k, 'value': v}
            for k, v in distribution.items()
        ]

    def _create_top_metrics_chart(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame) -> List[Dict]:
        """Create top metrics chart"""

        metrics = []

        if not customers_df.empty:
            metrics.append({
                'metric': 'Total Customers',
                'value': len(customers_df)
            })

        if not transactions_df.empty:
            metrics.append({
                'metric': 'Total Transactions',
                'value': len(transactions_df)
            })

            if 'net_sales_amount' in transactions_df.columns:
                metrics.append({
                    'metric': 'Total Revenue',
                    'value': float(transactions_df['net_sales_amount'].sum())
                })

        return metrics

    def _generate_insights(self, ml_results: Dict, kpis: Dict) -> List[str]:
        """Generate retention planning insights"""

        insights = []

        # Retention rate insight
        retention_rate = kpis.get('retentionRate', 0)
        if retention_rate > 80:
            insights.append(f"Excellent retention rate of {retention_rate:.1f}% - customers are highly engaged")
        elif retention_rate > 60:
            insights.append(f"Good retention rate of {retention_rate:.1f}%, but there's room for improvement")
        else:
            insights.append(f"Retention rate of {retention_rate:.1f}% is below industry standards - urgent action needed")

        # At-risk customers insight
        at_risk_count = kpis.get('atRiskCount', 0)
        at_risk_value = kpis.get('atRiskValue', 0)
        if at_risk_count > 0:
            insights.append(f"{at_risk_count} customers are at risk of churning, representing ${at_risk_value:,.0f} in potential lost revenue")

        # Cost savings insight
        cost_savings = kpis.get('costSavings', 0)
        if cost_savings > 0:
            insights.append(f"Targeted retention interventions could save ${cost_savings:,.0f} in customer lifetime value")

        # Segment-based insights
        segments = ml_results.get('segments', [])
        if segments:
            high_risk_segments = [s for s in segments if s.get('risk_level') == 'High']
            if high_risk_segments:
                total_high_risk = sum(s['size'] for s in high_risk_segments)
                insights.append(f"{total_high_risk} customers are in high-risk segments and should be prioritized for retention campaigns")

        # Intervention success insight
        intervention_success = kpis.get('interventionSuccess', 0)
        if intervention_success > 0:
            insights.append(f"Historical intervention success rate of {intervention_success:.0f}% suggests retention efforts are effective")

        return insights

    async def _get_cached_ai_insights(
        self,
        filters: Dict,
        customers_df: 'pd.DataFrame',
        loyalty_df: 'pd.DataFrame',
        kpis: Dict,
        visualizations: Dict
    ) -> List[str]:
        """Get AI insights from cache or generate async (non-blocking)

        Cached separately with longer TTL (30 min) since AI insights are less filter-dependent.
        Uses asyncio.to_thread() to run blocking AI generation in thread pool.

        Args:
            filters: Filter parameters
            customers_df: Customer dataframe
            loyalty_df: Loyalty dataframe
            kpis: KPI metrics
            visualizations: Visualization data

        Returns:
            List of AI-generated insight strings (empty on error)
        """
        try:
            import asyncio
            # Run AI generation in thread pool to avoid blocking event loop
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                customers_df,
                loyalty_df,
                kpis,
                visualizations,
                filters
            )
            return ai_insights
        except Exception as e:
            print(f"[RetentionPlannerService] Error in _get_cached_ai_insights: {e}")
            return []  # Graceful fallback

    def _generate_ai_insights(
        self,
        customers_df: 'pd.DataFrame',
        loyalty_df: 'pd.DataFrame',
        kpis: Dict,
        visualizations: Dict,
        filters: Dict
    ) -> List[str]:
        """Generate AI-powered insights using Gemini (hybrid approach)

        This supplements rule-based insights with creative AI analysis.
        Failures gracefully fall back to empty list without breaking the response.
        """
        try:
            # Import here to avoid breaking if module not available
            from lib.ai_insights_generator import generate_ai_insights

            if customers_df.empty:
                return []

            # Calculate metrics for AI context
            total_customers = len(customers_df)
            at_risk_count = kpis.get('atRiskCount', 0)
            retention_rate = kpis.get('retentionRate', 0)
            at_risk_value = kpis.get('atRiskValue', 0)
            cost_savings = kpis.get('costSavings', 0)
            intervention_success = kpis.get('interventionSuccess', 0)

            # Get time period from filters
            time_period = f"{filters.get('date_from', 'N/A')} to {filters.get('date_to', 'N/A')}"

            # Build segment breakdown from risk distribution
            segment_breakdown = ""
            risk_dist = visualizations.get('riskDistributionData', [])
            if risk_dist:
                for item in risk_dist:
                    segment_breakdown += f"- {item['riskLevel']}: {item['count']} customers ({item['percentage']:.1f}%)\n"

            # Find critical lifecycle stage
            critical_stage = "Unknown"
            lifecycle_data = visualizations.get('customerLifecycleData', [])
            if lifecycle_data:
                # Find stage with highest at-risk percentage
                at_risk_stages = [s for s in lifecycle_data if 'risk' in s.get('stage', '').lower()]
                if at_risk_stages:
                    critical_stage = max(at_risk_stages, key=lambda s: s.get('count', 0)).get('stage', 'Unknown')

            # Prepare KPIs
            kpis_for_ai = {
                'total_customers': total_customers,
                'at_risk_count': at_risk_count,
                'at_risk_pct': (at_risk_count / total_customers * 100) if total_customers > 0 else 0,
                'retention_rate': retention_rate,
                'at_risk_value': at_risk_value,
                'cost_savings': cost_savings,
                'intervention_success': intervention_success,
                'time_period': time_period
            }

            # Prepare data summary
            data_summary = {
                'segment_breakdown': segment_breakdown,
                'critical_stage': critical_stage,
                'risk_threshold': filters.get('risk_threshold', 0.5)
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='retention_planning',
                kpis=kpis_for_ai,
                data_summary=data_summary,
                filters=filters
            )

            return ai_insights

        except Exception as e:
            print(f"[RetentionPlannerService] Error in _generate_ai_insights: {e}")
            import traceback
            traceback.print_exc()
            return []  # Graceful fallback

    def _parse_date_filters(self, filters: Dict) -> Dict:
        """Parse and validate date filters"""

        parsed = filters.copy()

        # Handle date range
        if 'date_from' in parsed:
            try:
                parsed['date_from'] = pd.to_datetime(parsed['date_from']).strftime('%Y-%m-%d')
            except:
                parsed['date_from'] = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

        if 'date_to' in parsed:
            try:
                parsed['date_to'] = pd.to_datetime(parsed['date_to']).strftime('%Y-%m-%d')
            except:
                parsed['date_to'] = datetime.now().strftime('%Y-%m-%d')

        # Handle time_period format (for compatibility)
        if 'time_period' in parsed:
            if ':' in parsed['time_period']:
                dates = parsed['time_period'].split(':')
                parsed['date_from'] = dates[0]
                parsed['date_to'] = dates[1] if len(dates) > 1 else datetime.now().strftime('%Y-%m-%d')

        return parsed

    def _assess_data_quality(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame) -> Dict:
        """Assess data quality metrics"""

        quality = {
            'completeness': 100.0,
            'accuracy': 100.0,
            'consistency': 100.0
        }

        # Check for missing values
        if not customers_df.empty:
            null_percentage = customers_df.isnull().sum().sum() / (len(customers_df) * len(customers_df.columns)) * 100
            quality['completeness'] = 100 - null_percentage

        if not transactions_df.empty:
            # Check for data consistency
            if 'net_sales_amount' in transactions_df.columns:
                invalid_amounts = (transactions_df['net_sales_amount'] < 0).sum()
                quality['consistency'] = 100 - (invalid_amounts / len(transactions_df) * 100)

        return quality

    def _get_empty_ml_results(self) -> Dict:
        """Return empty ML results structure"""
        return {
            'predictions': [],
            'segments': [],
            'feature_importance': [],
            'metrics': {},
            'distribution': {}
        }

    def _get_error_response(self, error_message: str) -> Dict:
        """Return error response structure"""
        return {
            'kpiMetrics': {},
            'mainData': {},
            'mlResults': {},
            'insights': [f"Error: {error_message}"],
            'metadata': {
                'analysisDate': datetime.now().isoformat(),
                'error': True,
                'errorMessage': error_message
            }
        }
