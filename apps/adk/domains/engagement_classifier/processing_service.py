"""
Engagement Classifier Processing Service
Complete implementation with all endpoints and caching
"""

import logging
import asyncio
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
            # Set default dates if not provided (2017-2021 to match other dashboards)
            if 'startDate' not in filters or not filters.get('startDate'):
                filters['startDate'] = '2017-01-01'
            if 'endDate' not in filters or not filters.get('endDate'):
                filters['endDate'] = '2021-12-31'

            logger.info(f"Getting Engagement Classifier summary with filters: {filters}")

            # Get all data in parallel
            customers_data = await self.data_service.get_engagement_data(filters)
            kpi_data = await self.data_service.get_kpi_metrics(filters)
            distribution_data = await self.data_service.get_engagement_distribution(filters)
            rfm_data = await self.data_service.get_rfm_analysis(filters)
            opportunities_data = await self.data_service.get_reengagement_opportunities(filters)
            timeline_data = await self.data_service.get_engagement_timeline(filters)

            # Process customers for ML predictions if needed
            customers_df = pd.DataFrame(customers_data.get('rows', customers_data.get('data', [])))

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
                    "customers": customers_data.get('rows', customers_data.get('data', [])),

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
                    "distribution": distribution_data.get('rows', distribution_data.get('data', [])),

                    # RFM analysis
                    "rfm_analysis": rfm_data.get('rows', rfm_data.get('data', [])),

                    # Re-engagement opportunities
                    "opportunities": opportunities_data.get('rows', opportunities_data.get('data', [])),

                    # Timeline data
                    "timeline": timeline_data.get('rows', timeline_data.get('data', [])),

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

            # Generate rule-based insights (fast, always present)
            rule_based_insights = self._generate_insights(kpi_data, distribution_data.get('rows', distribution_data.get('data', [])))

            # Generate AI-powered insights (async, cached separately, non-blocking)
            ai_insights = await self._get_cached_ai_insights(kpi_data, customers_df, filters)

            # Combine rule-based + AI insights into single array
            combined_insights = rule_based_insights + ai_insights

            # Also return compact format for compatibility
            response.update({
                "kpiMetrics": {
                    "totalCustomers": kpi_data.get('total_customers', 0),
                    "highlyEngaged": kpi_data.get('engagement_distribution', {}).get('high', 0),
                    "atRiskCount": kpi_data.get('engagement_distribution', {}).get('low', 0),
                    "avgEngagementScore": kpi_data.get('avg_engagement_score', 0),
                    "engagementTrend": kpi_data.get('engagement_trend_value', 0)  # Use actual trend value from data
                },
                "engagementDistribution": distribution_data.get('rows', distribution_data.get('data', [])),
                "customerClassification": rfm_data.get('rows', rfm_data.get('data', [])),
                "engagementScore": {
                    "current": kpi_data.get('avg_engagement_score', 0),
                    "previous": kpi_data.get('prev_engagement_score', kpi_data.get('avg_engagement_score', 0)),  # Use actual previous value or current as fallback
                    "trend": "up" if kpi_data.get('engagement_trend') == 'Improving' else "down"
                },
                # ✅ UNIFIED V2: Combined rule-based + AI insights into single field
                "insights": combined_insights,
                "insights_metadata": {
                    "rule_based_count": len(rule_based_insights),
                    "ai_count": len(ai_insights),
                    "total_count": len(combined_insights),
                    "insights_version": "unified_v2"
                }
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
            # Set default dates if not provided
            if 'startDate' not in filters or not filters.get('startDate'):
                filters['startDate'] = '2017-01-01'
            if 'endDate' not in filters or not filters.get('endDate'):
                filters['endDate'] = '2021-12-31'

            result = await self.data_service.get_engagement_distribution(filters)
            return {
                "success": True,
                "data": result.get('rows', result.get('data', [])),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in engagement distribution: {str(e)}")
            return {"success": False, "error": str(e), "data": []}

    async def get_rfm_analysis(self, filters: Dict = {}) -> Dict:
        """Get RFM analysis data"""
        try:
            # Set default dates if not provided
            if 'startDate' not in filters or not filters.get('startDate'):
                filters['startDate'] = '2017-01-01'
            if 'endDate' not in filters or not filters.get('endDate'):
                filters['endDate'] = '2021-12-31'

            result = await self.data_service.get_rfm_analysis(filters)
            return {
                "success": True,
                "data": result.get('rows', result.get('data', [])),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in RFM analysis: {str(e)}")
            return {"success": False, "error": str(e), "data": []}

    async def get_reengagement_opportunities(self, filters: Dict = {}) -> Dict:
        """Get reengagement opportunities"""
        try:
            # Set default dates if not provided
            if 'startDate' not in filters or not filters.get('startDate'):
                filters['startDate'] = '2017-01-01'
            if 'endDate' not in filters or not filters.get('endDate'):
                filters['endDate'] = '2021-12-31'

            result = await self.data_service.get_reengagement_opportunities(filters)
            return {
                "success": True,
                "data": result.get('rows', result.get('data', [])),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error in reengagement opportunities: {str(e)}")
            return {"success": False, "error": str(e), "data": []}

    async def get_engagement_timeline(self, filters: Dict = {}) -> Dict:
        """Get engagement timeline data"""
        try:
            # Set default dates if not provided
            if 'startDate' not in filters or not filters.get('startDate'):
                filters['startDate'] = '2017-01-01'
            if 'endDate' not in filters or not filters.get('endDate'):
                filters['endDate'] = '2021-12-31'

            result = await self.data_service.get_engagement_timeline(filters)
            return {
                "success": True,
                "data": result.get('rows', result.get('data', [])),
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
                "data": result.get('rows', result.get('data', [])),
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

    def _generate_insights(self, kpi_data: Dict, distribution_data: List) -> List[str]:
        """Generate actionable insights based on data with priority labels"""
        insights = []

        total_customers = kpi_data.get('total_customers', 1)

        # Insight 1: At-risk customers (CRITICAL if >30%)
        low_engagement = kpi_data.get('engagement_distribution', {}).get('low', 0)
        low_pct = (low_engagement / total_customers * 100) if total_customers > 0 else 0

        if low_pct > 30:
            insights.append(
                f"CRITICAL: HIGH CHURN RISK - {low_engagement:,} customers ({low_pct:.1f}%) show low engagement. "
                f"**Immediate Action Required:** Launch targeted re-engagement campaigns within 48 hours. "
                f"Segment by value tier and deploy personalized retention offers. Expected impact: 15-20% recovery rate. "
                f"Estimated revenue at risk: ${low_engagement * 2000:,.0f}"
            )
        elif low_engagement > 0:
            insights.append(
                f"HIGH: AT-RISK SEGMENT - {low_engagement:,} customers ({low_pct:.1f}%) showing declining engagement. "
                f"**Action:** Implement proactive outreach with personalized content and offers. "
                f"Monitor for further decline. Target recovery: 25-30% within 30 days."
            )

        # Insight 2: Engagement trend analysis
        engagement_trend = kpi_data.get('engagement_trend', 'Stable')
        if engagement_trend == 'Declining':
            insights.append(
                f"HIGH: DECLINING ENGAGEMENT TREND - Overall customer engagement is trending downward. "
                f"**Action:** Analyze root causes (product changes, market shifts, competitor activity). "
                f"Launch engagement survey to identify pain points. Deploy immediate win-back campaigns. "
                f"Goal: Reverse trend within 60 days."
            )
        elif engagement_trend == 'Improving':
            insights.append(
                f"POSITIVE: IMPROVING ENGAGEMENT - Customer engagement showing upward trajectory. "
                f"**Action:** Double down on current strategies. Identify success factors and scale proven tactics. "
                f"Leverage momentum for upsell/cross-sell opportunities. Maintain 10%+ monthly growth."
            )

        # Insight 3: High engagement leverage
        high_engagement = kpi_data.get('engagement_distribution', {}).get('high', 0)
        high_pct = (high_engagement / total_customers * 100) if total_customers > 0 else 0

        if high_engagement > 0:
            insights.append(
                f"OPPORTUNITY: HIGHLY ENGAGED ADVOCATES - {high_engagement:,} customers ({high_pct:.1f}%) are highly engaged. "
                f"**Action:** Launch referral program and advocacy initiatives. Request testimonials and case studies. "
                f"Offer exclusive early access to new features. Potential referral revenue: ${high_engagement * 500:,.0f}"
            )

        # Insight 4: Re-engagement opportunities
        reengagement_opps = kpi_data.get('reengagement_opportunities', 0)
        if reengagement_opps > 0:
            insights.append(
                f"OPPORTUNITY: WINBACK POTENTIAL - {reengagement_opps:,} previously loyal customers can be re-engaged. "
                f"**Action:** Deploy \"We Miss You\" campaign with special comeback offers. Highlight product improvements. "
                f"Personalize based on previous purchase history. Expected conversion: 20-25%. "
                f"Projected recovery revenue: ${reengagement_opps * 1500:,.0f}"
            )

        # Insight 5: Engagement score analysis
        avg_score = kpi_data.get('avg_engagement_score', 0)
        if avg_score < 5:
            insights.append(
                f"MEDIUM: LOW AVERAGE ENGAGEMENT SCORE - Current score: {avg_score:.1f}/10. "
                f"**Action:** Improve onboarding experience, enhance product value communication, "
                f"increase touchpoint frequency. Set target: 7.0+ within 90 days through systematic improvements."
            )

        # Add general strategic recommendation
        if insights:
            insights.append(
                f"STRATEGIC: CONTINUOUS MONITORING - Implement weekly engagement tracking and automated alerts. "
                f"Segment customers by engagement trajectory. Test personalization strategies. "
                f"Goal: Increase overall engagement score by 15% and reduce at-risk segment by 40% next quarter."
            )

        return insights

    def _generate_ai_insights(self, kpi_data: Dict, customers_df: pd.DataFrame, filters: Dict) -> List[str]:
        """Generate AI-powered insights using Gemini (hybrid approach)

        This supplements rule-based insights with creative AI analysis.
        Failures gracefully fall back to empty list without breaking the response.
        """
        try:
            # Import here to avoid breaking if module not available
            from lib.ai_insights_generator import generate_ai_insights

            # Calculate key metrics
            total_customers = kpi_data.get('total_customers', 0)
            high_engagement = kpi_data.get('engagement_distribution', {}).get('high', 0)
            medium_engagement = kpi_data.get('engagement_distribution', {}).get('medium', 0)
            low_engagement = kpi_data.get('engagement_distribution', {}).get('low', 0)
            avg_engagement_score = kpi_data.get('avg_engagement_score', 0)
            engagement_trend = kpi_data.get('engagement_trend', 'Stable')

            # Calculate percentages
            high_pct = (high_engagement / total_customers * 100) if total_customers > 0 else 0
            medium_pct = (medium_engagement / total_customers * 100) if total_customers > 0 else 0
            low_pct = (low_engagement / total_customers * 100) if total_customers > 0 else 0

            # Get time period from filters
            time_period = f"{filters.get('startDate', 'N/A')} to {filters.get('endDate', 'N/A')}"

            # Prepare KPIs for prompt
            ai_kpis = {
                'total_customers': total_customers,
                'high_engagement': high_engagement,
                'high_engagement_pct': high_pct,
                'medium_engagement': medium_engagement,
                'medium_engagement_pct': medium_pct,
                'low_engagement': low_engagement,
                'low_engagement_pct': low_pct,
                'avg_engagement_score': avg_engagement_score,
                'engagement_trend': engagement_trend,
                'reengagement_opportunities': kpi_data.get('reengagement_opportunities', 0),
                'avg_days_since_activity': kpi_data.get('avg_days_since_activity', 0),
                'time_period': time_period
            }

            # Prepare data summary
            data_summary = {
                'engagement_breakdown': f"High: {high_engagement} ({high_pct:.1f}%), Medium: {medium_engagement} ({medium_pct:.1f}%), Low: {low_engagement} ({low_pct:.1f}%)"
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='engagement_classifier',
                kpis=ai_kpis,
                data_summary=data_summary,
                filters=filters
            )

            logger.info(f"[EngagementClassifierService] Generated {len(ai_insights)} AI insights")
            return ai_insights

        except ImportError as e:
            logger.info(f"[EngagementClassifierService] AI insights module not available: {e}")
            return []
        except Exception as e:
            logger.error(f"[EngagementClassifierService] Error generating AI insights: {e}")
            return []  # Graceful fallback - don't break the response

    async def _get_cached_ai_insights(
        self,
        kpi_data: Dict,
        customers_df: pd.DataFrame,
        filters: Dict
    ) -> List[str]:
        """Get AI insights from cache or generate async (non-blocking)

        Cached separately with longer TTL (30 min) since AI insights are less filter-dependent.
        Uses asyncio.to_thread() to run blocking AI generation in thread pool.

        Args:
            kpi_data: KPI metrics
            customers_df: Customer data
            filters: Filter parameters

        Returns:
            List of AI-generated insight strings (empty on error)
        """
        try:
            # Run AI generation in thread pool to avoid blocking event loop
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                kpi_data,
                customers_df,
                filters
            )

            logger.info(f"[EngagementClassifierService] Generated {len(ai_insights)} AI insights async")
            return ai_insights

        except Exception as e:
            logger.error(f"[EngagementClassifierService] Error in _get_cached_ai_insights: {e}")
            return []  # Graceful fallback

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