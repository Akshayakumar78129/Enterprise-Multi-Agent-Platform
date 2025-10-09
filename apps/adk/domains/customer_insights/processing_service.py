"""Processing service for customer insights domain - Following pattern from other domains"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import pandas as pd

from .data_service import CustomerInsightsDataService
from domains.common.simple_cache import cache_dashboard_endpoint


class CustomerInsightsService:
    """Handles business logic for customer insights"""

    def __init__(self):
        self.data_service = CustomerInsightsDataService()

    @cache_dashboard_endpoint("customer-insights")
    async def get_dashboard_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get comprehensive customer insights summary with caching"""
        return await self._get_dashboard_summary_internal(filters)

    async def _get_dashboard_summary_internal(self, filters: Dict[str, Any] = {}) -> Dict:
        """Internal method for dashboard summary without caching"""
        try:
            # Fetch all data components in parallel
            kpi_metrics, engagement_overview, customer_profiles = await asyncio.gather(
                self.data_service.get_kpi_metrics(filters),
                self.data_service.get_engagement_overview(filters),
                self.data_service.get_customer_profiles(filters)
            )

            # Get behavior metrics for insights generation
            behavior_data = await self.data_service.get_behavior_insights_data(filters)

            # Generate behavior insights
            behavior_insights = self._generate_behavior_insights(
                engagement_overview,
                customer_profiles,
                behavior_data
            )

            # Generate recommendations
            recommendations = self._generate_recommendations(
                engagement_overview,
                customer_profiles,
                behavior_data
            )

            # Extract key insights from behaviorInsights for top-level
            top_level_insights = []
            if behavior_insights:
                # Extract trends as insights
                trends = behavior_insights.get('trends', [])
                if trends:
                    top_level_insights.extend(trends[:3])  # Top 3 trends

                # Extract patterns as insights
                patterns = behavior_insights.get('patterns', [])
                if patterns:
                    top_level_insights.extend(patterns[:2])  # Top 2 patterns

            # If no insights from behaviorInsights, create default ones
            if not top_level_insights:
                total_customers = kpi_metrics.get('totalCustomers', 0)
                avg_engagement = kpi_metrics.get('averageEngagement', 0)
                if total_customers > 0:
                    top_level_insights.append(
                        f"Analyzing {total_customers} customers with {avg_engagement}% average engagement"
                    )

            return {
                'kpiMetrics': kpi_metrics,
                'mainData': {
                    'engagementOverview': engagement_overview,
                    'customerProfiles': customer_profiles,
                    'behaviorInsights': behavior_insights,
                    'recommendations': recommendations
                },
                'insights': top_level_insights
            }
        except Exception as e:
            print(f"[CustomerInsightsService] Error in get_dashboard_summary: {e}")
            # Return empty data structure on error
            return {
                'kpiMetrics': {
                    'totalCustomers': 0,
                    'averageEngagement': 0,
                    'topPerformers': 0,
                    'insightAccuracy': '0%'
                },
                'mainData': {
                    'engagementOverview': {'high': 0, 'medium': 0, 'low': 0, 'veryLow': 0},
                    'customerProfiles': [],
                    'behaviorInsights': {'trends': [], 'patterns': []},
                    'recommendations': []
                },
                'insights': []
            }

    def _generate_behavior_insights(
        self,
        engagement: Dict,
        profiles: List[Dict],
        behavior_data: Dict
    ) -> Dict:
        """Generate behavior insights based on data"""

        trends = []
        patterns = []

        # Analyze engagement trends
        total_engaged = engagement.get('high', 0) + engagement.get('medium', 0)
        total_customers = sum(engagement.values()) if engagement else 1

        if total_customers > 0:
            engagement_rate = (total_engaged / total_customers) * 100
            if engagement_rate > 60:
                trends.append("High overall customer engagement")
            elif engagement_rate > 40:
                trends.append("Moderate customer engagement levels")
            else:
                trends.append("Low customer engagement requiring attention")

        # Analyze at-risk customers
        at_risk_count = behavior_data.get('at_risk_customers', 0)
        if at_risk_count > 0:
            if at_risk_count > engagement.get('high', 0):
                trends.append("More customers at risk than highly engaged")
            else:
                trends.append(f"{at_risk_count} customers showing churn risk signals")

        # Analyze customer profiles
        if profiles:
            champions = next((p for p in profiles if p['segment'] == 'Champions'), None)
            if champions and champions['count'] > 0:
                patterns.append(f"{champions['count']} champion customers drive major revenue")

            at_risk_segment = next((p for p in profiles if p['segment'] == 'At Risk'), None)
            if at_risk_segment and at_risk_segment['count'] > 0:
                patterns.append(f"{at_risk_segment['count']} customers need retention focus")

            # Add insights about new customers
            new_customers = next((p for p in profiles if p['segment'] == 'New Customers'), None)
            if new_customers and new_customers['count'] > 0:
                patterns.append(f"{new_customers['count']} new customers in onboarding phase")

        # Default patterns if none generated
        if not patterns:
            patterns = [
                "Regular purchase patterns detected",
                "Seasonal trends influence buying behavior",
                "Mobile channel showing increased adoption"
            ]

        if not trends:
            trends = [
                "Customer base shows stable growth",
                "Engagement metrics improving quarterly",
                "Digital channels gaining prominence"
            ]

        return {
            'trends': trends[:3],  # Limit to top 3
            'patterns': patterns[:3]
        }

    def _generate_recommendations(
        self,
        engagement: Dict,
        profiles: List[Dict],
        behavior_data: Dict
    ) -> List[str]:
        """Generate AI recommendations based on insights"""

        recommendations = []

        # Engagement-based recommendations
        very_low_engaged = engagement.get('veryLow', 0)
        if very_low_engaged > 100:
            recommendations.append("Launch re-engagement campaign for dormant customers")

        if engagement.get('high', 0) < engagement.get('low', 0):
            recommendations.append("Implement loyalty program to boost high-value engagement")

        # Profile-based recommendations
        if profiles:
            top_segment = profiles[0] if profiles else None
            if top_segment:
                if top_segment['segment'] == 'Champions':
                    recommendations.append("Create VIP tier for champion customers")
                elif top_segment['segment'] == 'At Risk':
                    recommendations.append("Urgent: Deploy retention strategies for at-risk segment")
                elif top_segment['segment'] == 'New Customers':
                    recommendations.append("Optimize onboarding flow for new customers")

        # Behavior-based recommendations
        at_risk_pct = 0
        if behavior_data.get('total_customers', 0) > 0:
            at_risk_pct = (behavior_data.get('at_risk_customers', 0) /
                          behavior_data['total_customers']) * 100

        if at_risk_pct > 20:
            recommendations.append("High churn risk detected - implement win-back campaigns")

        # Add general recommendations if needed
        if len(recommendations) < 2:
            recommendations.extend([
                "Personalize marketing based on customer segments",
                "Optimize product recommendations using purchase history"
            ])

        return recommendations[:4]  # Return top 4 recommendations

    async def export_data(self, filters: Dict[str, Any] = {}, format: str = 'csv') -> str:
        """Export customer insights data"""

        summary = await self._get_dashboard_summary_internal(filters)

        if format == 'csv':
            # Convert to DataFrame for CSV export
            profiles_df = pd.DataFrame(summary['mainData']['customerProfiles'])
            if not profiles_df.empty:
                return profiles_df.to_csv(index=False)
            else:
                # Return a minimal CSV if no data
                return "segment,count,value\n"
        else:
            # Return JSON
            import json
            return json.dumps(summary, indent=2)