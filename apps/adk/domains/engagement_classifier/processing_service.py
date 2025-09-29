"""
Engagement Classifier Processing Service
Complete implementation with all endpoints and caching
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import EngagementClassifierDataService
from .ml_predictor import EngagementClassifierMLPredictor

logger = logging.getLogger(__name__)


class EngagementClassifierService:
    """Processing service for Customer engagement classification using activity metrics"""

    def __init__(self):
        """Initialize the service with data service and ML predictor"""
        self.data_service = EngagementClassifierDataService()
        self.ml_predictor = EngagementClassifierMLPredictor()
        logger.info(f"{self.__class__.__name__} initialized")

    @cache_dashboard_endpoint(dashboard_type='engagement-classifier', ttl=300)
    async def get_dashboard_summary(self, filters: Dict = {}) -> Dict:
        """Get complete engagement classifier dashboard summary with all data"""

        try:
            logger.info(f"Getting Engagement Classifier summary with filters: {filters}")

            # Get all data in parallel
            customers_data = await self.data_service.get_engagement_data(filters)
            kpi_data = await self.data_service.get_kpi_metrics(filters)
            distribution_data = await self.data_service.get_engagement_distribution(filters)
            rfm_data = await self.data_service.get_rfm_analysis(filters)
            opportunities_data = await self.data_service.get_reengagement_opportunities(filters)
            timeline_data = await self.data_service.get_engagement_timeline(filters)

            # Process customers for ML predictions if needed
            customers_df = pd.DataFrame(customers_data.get('data', []))

            # Prepare ML results
            ml_results = {}
            if len(customers_df) > 0:
                try:
                    # Calculate engagement scores using ML
                    if hasattr(self.ml_predictor, 'prepare_features'):
                        features = self.ml_predictor.prepare_features(customers_df)
                        if features is not None and hasattr(self.ml_predictor, 'predict_engagement_scores'):
                            scores = self.ml_predictor.predict_engagement_scores(features)
                            customers_df['ml_engagement_score'] = scores

                    # Get top at-risk customers (fallback logic)
                    if 'engagement_level' in customers_df.columns:
                        at_risk = customers_df[customers_df['engagement_level'] == 'Low'].nlargest(10, 'LTD Sales Amount')
                        ml_results['at_risk_customers'] = at_risk[['Customer Name', 'Days Since Last Activity', 'LTD Sales Amount']].to_dict('records')
                except Exception as e:
                    logger.warning(f"ML predictor error: {e}, continuing without ML features")
                    ml_results['at_risk_customers'] = []

            # Structure response matching old API
            response = {
                "success": True,
                "data": {
                    # Raw customer data
                    "customers": customers_data.get('data', []),

                    # KPI data for tiles
                    "kpis": {
                        "total_customers": kpi_data.get('total_customers', 0),
                        "avg_engagement_score": kpi_data.get('avg_engagement_score', 0),
                        "avg_days_since_activity": kpi_data.get('avg_days_since_activity', 0),
                        "engagement_trend": kpi_data.get('engagement_trend', 'Stable'),
                        "reengagement_opportunities": kpi_data.get('reengagement_opportunities', 0),
                        "engagement_distribution": kpi_data.get('engagement_distribution', {})
                    },

                    # Engagement distribution for pyramid
                    "distribution": distribution_data.get('data', []),

                    # RFM analysis
                    "rfm_analysis": rfm_data.get('data', []),

                    # Re-engagement opportunities
                    "opportunities": opportunities_data.get('data', []),

                    # Timeline data
                    "timeline": timeline_data.get('data', []),

                    # Summary metrics
                    "summary": {
                        "total_customers": kpi_data.get('total_customers', 0),
                        "high_engagement": kpi_data.get('engagement_distribution', {}).get('high', 0),
                        "medium_engagement": kpi_data.get('engagement_distribution', {}).get('medium', 0),
                        "low_engagement": kpi_data.get('engagement_distribution', {}).get('low', 0),
                        "avg_purchase_value": kpi_data.get('avg_purchase_value', 0),
                        "avg_transaction_frequency": kpi_data.get('avg_transaction_frequency', 0)
                    }
                },
                "mlResults": ml_results,
                "timestamp": datetime.now().isoformat(),
                "filters_applied": filters
            }

            # Also return compact format for compatibility
            response.update({
                "kpiMetrics": {
                    "totalCustomers": kpi_data.get('total_customers', 0),
                    "highlyEngaged": kpi_data.get('engagement_distribution', {}).get('high', 0),
                    "atRiskCount": kpi_data.get('engagement_distribution', {}).get('low', 0),
                    "avgEngagementScore": kpi_data.get('avg_engagement_score', 0),
                    "engagementTrend": kpi_data.get('engagement_trend_value', 0)  # Use actual trend value from data
                },
                "engagementDistribution": distribution_data.get('data', []),
                "customerClassification": rfm_data.get('data', []),
                "engagementScore": {
                    "current": kpi_data.get('avg_engagement_score', 0),
                    "previous": kpi_data.get('prev_engagement_score', kpi_data.get('avg_engagement_score', 0)),  # Use actual previous value or current as fallback
                    "trend": "up" if kpi_data.get('engagement_trend') == 'Improving' else "down"
                },
                "actionableInsights": self._generate_insights(kpi_data, distribution_data.get('data', []))
            })

            return response

        except Exception as e:
            logger.error(f"Error in dashboard summary: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "data": {
                    "customers": [],
                    "kpis": {},
                    "distribution": [],
                    "rfm_analysis": [],
                    "opportunities": [],
                    "timeline": [],
                    "summary": {}
                }
            }

    async def get_engagement_distribution(self, filters: Dict = {}) -> Dict:
        """Get engagement level distribution for pyramid visualization"""
        try:
            result = await self.data_service.get_engagement_distribution(filters)
            return {
                "success": True,
                "data": result.get('data', []),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in engagement distribution: {str(e)}")
            return {"success": False, "error": str(e), "data": []}

    async def get_rfm_analysis(self, filters: Dict = {}) -> Dict:
        """Get RFM analysis data"""
        try:
            result = await self.data_service.get_rfm_analysis(filters)
            return {
                "success": True,
                "data": result.get('data', []),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in RFM analysis: {str(e)}")
            return {"success": False, "error": str(e), "data": []}

    async def get_reengagement_opportunities(self, filters: Dict = {}) -> Dict:
        """Get reengagement opportunities"""
        try:
            result = await self.data_service.get_reengagement_opportunities(filters)
            return {
                "success": True,
                "data": result.get('data', []),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in reengagement opportunities: {str(e)}")
            return {"success": False, "error": str(e), "data": []}

    async def get_engagement_timeline(self, filters: Dict = {}) -> Dict:
        """Get engagement timeline data"""
        try:
            result = await self.data_service.get_engagement_timeline(filters)
            return {
                "success": True,
                "data": result.get('data', []),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in engagement timeline: {str(e)}")
            return {"success": False, "error": str(e), "data": []}

    async def search_customers(self, search_term: str) -> Dict:
        """Search customers by name or number"""
        try:
            result = await self.data_service.search_customers(search_term)
            return {
                "success": True,
                "data": result.get('data', []),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in customer search: {str(e)}")
            return {"success": False, "error": str(e), "data": []}

    async def get_customer_analytics(self, customer_key: str) -> Dict:
        """Get detailed analytics for a specific customer"""
        try:
            result = await self.data_service.get_customer_analytics(customer_key)
            return {
                "success": True,
                "data": result,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in customer analytics: {str(e)}")
            return {"success": False, "error": str(e), "data": {}}

    def _generate_insights(self, kpi_data: Dict, distribution_data: List) -> List[Dict]:
        """Generate actionable insights based on data"""
        insights = []

        # Insight 1: Engagement trend
        if kpi_data.get('engagement_trend') == 'Declining':
            insights.append({
                "type": "warning",
                "title": "Declining Engagement",
                "description": "Overall engagement is trending downward. Consider launching re-engagement campaigns.",
                "action": "Launch targeted campaigns"
            })
        elif kpi_data.get('engagement_trend') == 'Improving':
            insights.append({
                "type": "success",
                "title": "Improving Engagement",
                "description": "Customer engagement is trending upward. Maintain current strategies.",
                "action": "Continue current approach"
            })

        # Insight 2: At-risk customers
        low_engagement = kpi_data.get('engagement_distribution', {}).get('low', 0)
        if low_engagement > kpi_data.get('total_customers', 1) * 0.3:
            insights.append({
                "type": "alert",
                "title": "High Risk Segment",
                "description": f"{low_engagement} customers are at risk of churning.",
                "action": "Immediate intervention needed"
            })

        # Insight 3: Re-engagement opportunities
        reengagement_opps = kpi_data.get('reengagement_opportunities', 0)
        if reengagement_opps > 0:
            insights.append({
                "type": "info",
                "title": "Re-engagement Opportunities",
                "description": f"{reengagement_opps} loyal customers can be re-engaged.",
                "action": "Send personalized offers"
            })

        # Insight 4: High performers
        high_engagement = kpi_data.get('engagement_distribution', {}).get('high', 0)
        if high_engagement > 0:
            insights.append({
                "type": "success",
                "title": "Highly Engaged Segment",
                "description": f"{high_engagement} customers are highly engaged.",
                "action": "Leverage for advocacy"
            })

        return insights

    def _parse_date_filters(self, filters: Dict) -> Dict:
        """Parse and standardize date filters"""
        parsed = filters.copy()

        # Handle date range
        if 'dateRange' in filters:
            if isinstance(filters['dateRange'], dict):
                parsed['startDate'] = filters['dateRange'].get('startDate')
                parsed['endDate'] = filters['dateRange'].get('endDate')

        # Handle time range presets
        if 'timeRange' in filters:
            today = datetime.now()
            if filters['timeRange'] == 'last30days':
                parsed['startDate'] = (today - timedelta(days=30)).strftime('%Y-%m-%d')
                parsed['endDate'] = today.strftime('%Y-%m-%d')
            elif filters['timeRange'] == 'last90days':
                parsed['startDate'] = (today - timedelta(days=90)).strftime('%Y-%m-%d')
                parsed['endDate'] = today.strftime('%Y-%m-%d')
            elif filters['timeRange'] == 'last12months':
                parsed['startDate'] = (today - timedelta(days=365)).strftime('%Y-%m-%d')
                parsed['endDate'] = today.strftime('%Y-%m-%d')

        return parsed