"""Churn prediction processing service - Port of Express + ML integration"""

import pandas as pd
import numpy as np
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from .data_service import ChurnDataService
from database.filter_engine import FilterEngine
from .ml_predictor import ChurnMLPredictor
from domains.common.simple_cache import cache_dashboard_endpoint


class ChurnProcessingService:
    """Port of Express ChurnProcessingService with ML integration"""

    def __init__(self):
        self.data_service = ChurnDataService()
        self.filter_engine = FilterEngine()
        self.ml_predictor = ChurnMLPredictor()
        self.model_trained = False

    async def _ensure_model_trained(self, filters: Dict = None):
        """Ensure ML model is trained before use"""
        if not self.model_trained and not self.ml_predictor.is_trained:
            await self._train_ml_model(filters)

    def _determine_customer_categories(self, customer_row: pd.Series) -> List[str]:
        """Determine customer's product categories based on purchase patterns.

        This is a simplified approach based on customer metrics.
        In production, you'd have actual product purchase data.
        """
        categories = []

        # Based on spending patterns and frequency, infer likely product categories
        total_sales = customer_row.get('total_sales', 0)
        frequency = customer_row.get('transaction_count', 0)
        avg_order = customer_row.get('avg_transaction_value', 0)

        # Core Platform - regular users with consistent purchases
        if frequency > 10:
            categories.append("Core Platform")

        # Analytics Suite - data-driven customers with higher engagement
        if total_sales > 5000 and frequency > 5:
            categories.append("Analytics Suite")

        # API Services - technical customers with frequent small transactions
        if frequency > 20 and avg_order < 500:
            categories.append("API Services")

        # Professional Services - high-value customers
        if avg_order > 1000 or total_sales > 20000:
            categories.append("Professional Services")

        # Support Packages - customers with regular engagement
        if frequency > 6 and total_sales > 3000:
            categories.append("Support Packages")

        # Add-ons - most customers have some add-ons
        if total_sales > 1000:
            categories.append("Add-ons")

        # If no categories matched, assign Core Platform as default
        if not categories:
            categories.append("Core Platform")

        return categories

    async def _train_ml_model(self, filters: Dict = None):
        """Train the ML model with data filtered by date range"""
        try:
            # Use filters for training data (important for date-specific models)
            training_filters = filters or {}

            # Get data from service with filters
            txns_res = await self.data_service.get_transactions(training_filters)
            loyalty_res = await self.data_service.get_loyalty(training_filters)
            customers_res = await self.data_service.get_customers(training_filters)

            # Prepare features from service data
            customer_df, features = self.ml_predictor.prepare_features_from_service_data(
                txns_res.get('rows', []),
                loyalty_res.get('rows', []),
                customers_res.get('rows', [])
            )

            if len(customer_df) > 0:
                labels = self.ml_predictor.generate_labels(customer_df)
                # Pass filters for caching
                metrics = self.ml_predictor.train_model(features, labels, training_filters)
                self.model_trained = True
                self.ml_predictor.is_trained = True
            else:
                logger.warning(f"No data available for training with filters: {training_filters}")
        except Exception as e:
            logger.error(f"Failed to train ML model: {e}")

    @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
    async def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Main dashboard endpoint - combines SQL and ML

        Returns data matching Express getDashboardSummary format

        ALL FILTERS update the ENTIRE dashboard (KPIs, graphs, table).
        """
        try:
            # Get all metrics in parallel - ALL using the SAME filters
            (
                customer_stats,
                segment_risk,
                monthly_risk,
                probability_dist,
                feature_importance
            ) = await asyncio.gather(
                self.get_customer_stats(filters),
                self.get_segment_risk(filters),
                self.get_monthly_risk(filters),
                self.get_probability_distribution(filters),
                self.get_feature_importance(filters)
            )

            # Generate rule-based insights
            rule_based_insights = self._generate_insights(
                customer_stats,
                segment_risk,
                probability_dist,
                feature_importance
            )

            # Get AI-powered insights from separate cache
            ai_insights = await self._get_cached_ai_insights(
                filters,
                customer_stats,
                segment_risk,
                probability_dist,
                feature_importance
            )

            # COMBINE into single unified insights array
            combined_insights = rule_based_insights + ai_insights

            # ✅ DATA CONSISTENCY: Calculate total customers from unique customer_ids
            total_customers = 0
            if customer_stats:
                unique_customers = set()
                for stat in customer_stats:
                    if 'customerId' in stat:
                        unique_customers.add(stat['customerId'])
                    elif 'customer_id' in stat:
                        unique_customers.add(stat['customer_id'])
                total_customers = len(unique_customers)

            # Calculate KPI metrics for consistency with other dashboards
            high_risk_count = len([c for c in customer_stats if c.get('riskLevel') in ['High', 'Very High']]) if customer_stats else 0
            avg_risk = sum(c.get('riskPercentage', 0) for c in customer_stats) / total_customers if total_customers > 0 else 0

            # Return in Express format with UNIFIED insights
            return {
                "customerStats": customer_stats or [],
                "segmentRisk": segment_risk or [],
                "monthlyRisk": monthly_risk or [],
                "probabilityDistribution": probability_dist or [],
                "featureImportance": feature_importance or [],
                "insights": combined_insights,
                "insights_metadata": {
                    "total_count": len(combined_insights),
                    "rule_based_count": len(rule_based_insights),
                    "ai_count": len(ai_insights),
                    "insights_version": "unified_v2"
                },
                "kpiMetrics": {
                    "totalCustomers": total_customers,
                    "highRiskCount": high_risk_count,
                    "avgRiskPercentage": round(avg_risk, 2)
                }
            }
        except Exception as e:
            import traceback
            print(f"[ChurnProcessingService] Error in getDashboardSummary: {e}")
            print(f"[ChurnProcessingService] Full traceback: {traceback.format_exc()}")
            return {
                "customerStats": [],
                "segmentRisk": [],
                "monthlyRisk": [],
                "probabilityDistribution": [],
                "featureImportance": [],
                "insights": []
            }

    @cache_dashboard_endpoint(dashboard_type='churn_ai_insights', ttl=1800)
    async def _get_cached_ai_insights(
        self,
        filters: Dict,
        customer_stats: List[Dict],
        segment_risk: List[Dict],
        probability_dist: List[Dict],
        feature_importance: List[Dict]
    ) -> List[str]:
        """Get AI insights from cache or generate async (non-blocking)

        Cached separately with longer TTL (30 min) since AI insights are less filter-dependent.
        Uses asyncio.to_thread() to run blocking AI generation in thread pool.

        Args:
            filters: Filter parameters
            customer_stats: Customer statistics data
            segment_risk: Segment risk data
            probability_dist: Probability distribution data
            feature_importance: Feature importance data

        Returns:
            List of AI-generated insight strings (empty on error)
        """
        try:
            # Run AI generation in thread pool to avoid blocking event loop
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                customer_stats,
                segment_risk,
                probability_dist,
                feature_importance,
                filters
            )
            return ai_insights
        except Exception as e:
            print(f"[ChurnProcessingService] Error in _get_cached_ai_insights: {e}")
            return []  # Graceful fallback

    @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
    async def get_customer_stats(self, filters: Dict) -> List[Dict]:
        """Port of Express getCustomerStats - uses ML predictor with service data"""
        try:
            # Log the incoming filters to debug
            print(f"[ChurnProcessingService] get_customer_stats filters: {filters}")

            # Ensure model is trained with current filters
            await self._ensure_model_trained(filters)

            # Get segment, category, and risk level filters if present
            segment_filter = filters.get('segments', [])
            category_filter = filters.get('productCategories', [])
            risk_level_filter = filters.get('riskLevels', [])

            # Remove segments, categories, and riskLevels from filters for DB query (since they're not in DB)
            db_filters = filters.copy()
            db_filters.pop('segments', None)
            db_filters.pop('segment', None)
            db_filters.pop('productCategories', None)
            db_filters.pop('riskLevels', None)
            db_filters.pop('riskLevel', None)

            # Log the DB filters being used
            print(f"[ChurnProcessingService] DB filters: {db_filters}")

            # Get data from database using data service
            txns_res = await self.data_service.get_transactions(db_filters)
            loyalty_res = await self.data_service.get_loyalty(db_filters)
            customers_res = await self.data_service.get_customers(db_filters)

            # Log the data counts
            print(f"[ChurnProcessingService] Data counts - Txns: {len(txns_res.get('rows', []))}, Loyalty: {len(loyalty_res.get('rows', []))}, Customers: {len(customers_res.get('rows', []))}")

            # Use ML predictor to get predictions
            predictions_df = self.ml_predictor.predict_from_service_data(
                txns_res.get('rows', []),
                loyalty_res.get('rows', []),
                customers_res.get('rows', [])
            )

            if predictions_df.empty:
                return []

            # Log prediction statistics
            avg_risk = predictions_df['risk_percentage'].mean() if 'risk_percentage' in predictions_df else 0
            high_risk_count = len(predictions_df[predictions_df['risk_level'] == 'High']) if 'risk_level' in predictions_df else 0
            print(f"[ChurnProcessingService] Predictions - Avg Risk: {avg_risk:.1f}%, High Risk Count: {high_risk_count}")

            # Format results for API response
            results = []
            for _, row in predictions_df.iterrows():
                # Calculate segment based on total sales
                total_sales = row.get('total_sales', 0)
                if total_sales > 20000:
                    customer_segment = "High-Value"
                elif total_sales > 10000:
                    customer_segment = "Mid-Value"
                elif total_sales > 2000:
                    customer_segment = "Standard"
                else:
                    customer_segment = "Small"

                # Apply risk level filter if present
                if risk_level_filter and row['risk_level'] not in risk_level_filter:
                    continue

                # Apply segment filter if present
                if segment_filter and customer_segment not in segment_filter:
                    continue

                # Apply category filter if present
                # For now, we'll determine customer's primary category based on their purchase patterns
                # This is a simplified approach - in production, you'd have actual product purchase data
                if category_filter:
                    # Determine customer's primary product category based on spending patterns
                    customer_categories = self._determine_customer_categories(row)
                    # Check if customer has purchased from any of the filtered categories
                    if not any(cat in category_filter for cat in customer_categories):
                        continue

                # Handle NaN values comprehensively
                rfm = row.get('rfm_score', 0)
                if pd.isna(rfm) or rfm != rfm:  # Check for NaN
                    rfm = 0
                else:
                    rfm = float(rfm)

                lifetime = row.get('lifetime_sales', 0)
                if pd.isna(lifetime) or lifetime != lifetime:  # Check for NaN
                    lifetime = 0
                else:
                    lifetime = float(lifetime)

                avg_order = row.get('avg_transaction_value', 0)
                if pd.isna(avg_order) or avg_order != avg_order:  # Check for NaN
                    avg_order = 0
                else:
                    avg_order = float(avg_order)

                results.append({
                    'customer_id': str(row['customer_id']),
                    'customer_name': row.get('customer_name'),
                    'last_purchase_date': row.get('last_purchase_date'),
                    'frequency': int(row.get('transaction_count', 0)),
                    'avg_order_value': round(avg_order, 2),
                    'rfm_score': rfm,
                    'loyalty_status': row.get('loyalty_status'),
                    'lifetime_sales': lifetime,
                    'riskLevel': row['risk_level'],
                    'riskPercentage': int(row['risk_percentage']),
                    'segment': customer_segment  # Add segment to result
                })

            return results

        except Exception as e:
            print(f"[ChurnProcessingService] Error in getCustomerStats: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
    async def get_segment_risk(self, filters: Dict) -> List[Dict]:
        """Port of Express getSegmentRisk - uses ML predictor with service data"""
        try:
            # Ensure model is trained with current filters
            await self._ensure_model_trained(filters)

            # Get segment and category filters if present
            segment_filter = filters.get('segments', [])
            category_filter = filters.get('productCategories', [])

            # Remove segments and categories from filters for DB query (since they're not in DB)
            db_filters = filters.copy()
            db_filters.pop('segments', None)
            db_filters.pop('segment', None)
            db_filters.pop('productCategories', None)

            # Get data from database using data service
            txns_res = await self.data_service.get_transactions(db_filters)
            loyalty_res = await self.data_service.get_loyalty(db_filters)
            customers_res = await self.data_service.get_customers(db_filters)

            # Use ML predictor to get predictions
            predictions_df = self.ml_predictor.predict_from_service_data(
                txns_res.get('rows', []),
                loyalty_res.get('rows', []),
                customers_res.get('rows', [])
            )

            if predictions_df.empty:
                return []

            # Initialize segment buckets (only for requested segments if filter is present)
            if segment_filter:
                buckets = {seg: {"low": 0, "medium": 0, "high": 0, "very_high": 0} for seg in segment_filter}
            else:
                buckets = {
                    "High-Value": {"low": 0, "medium": 0, "high": 0, "very_high": 0},
                    "Mid-Value": {"low": 0, "medium": 0, "high": 0, "very_high": 0},
                    "Standard": {"low": 0, "medium": 0, "high": 0, "very_high": 0},
                    "Small": {"low": 0, "medium": 0, "high": 0, "very_high": 0}
                }

            # Categorize customers by spend and risk
            for _, customer in predictions_df.iterrows():
                total_spend = customer.get('total_sales', 0)

                # Determine segment based on spend
                if total_spend > 20000:
                    segment = "High-Value"
                elif total_spend > 10000:
                    segment = "Mid-Value"
                elif total_spend > 2000:
                    segment = "Standard"
                else:
                    segment = "Small"

                # Skip if segment filter is active and segment not in filter
                if segment_filter and segment not in segment_filter:
                    continue

                # Apply category filter if present
                if category_filter:
                    customer_categories = self._determine_customer_categories(customer)
                    if not any(cat in category_filter for cat in customer_categories):
                        continue

                # Get risk level from ML predictions
                risk_level = customer['risk_level']
                risk_key = risk_level.lower().replace(" ", "_")

                buckets[segment][risk_key] += 1

            # Format results
            return [
                {"segment": segment, **counts}
                for segment, counts in buckets.items()
            ]

        except Exception as e:
            print(f"[ChurnProcessingService] Error in getSegmentRisk: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
    async def get_monthly_risk(self, filters: Dict) -> List[Dict]:
        """Port of Express getMonthlyRisk

        Track risk evolution over time by month
        """
        try:
            txns_res = await self.data_service.get_transactions(filters)

            # Group transactions by month and customer
            by_month = defaultdict(lambda: {"customers": set(), "last_by_customer": {}})

            for row in txns_res.get('rows', []):
                if not row.get('txn_date'):
                    continue

                month = row['txn_date'][:7]  # YYYY-MM format
                customer_id = str(row['customer_id'])

                by_month[month]["customers"].add(customer_id)

                # Track last transaction date per customer per month
                current = by_month[month]["last_by_customer"].get(customer_id)
                if not current or row['txn_date'] > current:
                    by_month[month]["last_by_customer"][customer_id] = row['txn_date']

            # Calculate reference date
            reference_date = datetime.now()
            if filters.get('dateTo'):
                reference_date = datetime.fromisoformat(filters['dateTo'])

            # Calculate risk levels per month
            results = []
            for month, data in by_month.items():
                low, medium, high, very_high = 0, 0, 0, 0

                for customer_id in data["customers"]:
                    last_txn = data["last_by_customer"][customer_id]
                    last_txn_date = datetime.fromisoformat(last_txn)
                    days_since = (reference_date - last_txn_date).days

                    if days_since < 30:
                        low += 1
                    elif days_since <= 90:
                        medium += 1
                    elif days_since <= 180:
                        high += 1
                    else:
                        very_high += 1

                results.append({
                    "month": month,
                    "total_customers": len(data["customers"]),
                    "low_risk": low,
                    "medium_risk": medium,
                    "high_risk": high,
                    "very_high_risk": very_high
                })

            # Sort by month (most recent first, matching Express)
            results.sort(key=lambda x: x["month"], reverse=True)
            return results

        except Exception as e:
            print(f"[ChurnProcessingService] Error in getMonthlyRisk: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
    async def get_probability_distribution(self, filters: Dict) -> List[Dict]:
        """Get probability distribution using ML model predictions"""
        try:
            # Ensure model is trained with current filters
            await self._ensure_model_trained(filters)

            # Get customer stats which has ML predictions
            customer_stats = await self.get_customer_stats(filters)

            # Bin the probabilities from customer risk percentages
            bins = {
                "0-0.2": 0,
                "0.2-0.4": 0,
                "0.4-0.6": 0,
                "0.6-0.8": 0,
                "0.8-1.0": 0
            }

            for customer in customer_stats:
                # Convert risk percentage (0-100) to probability (0-1)
                churn_prob = customer.get('riskPercentage', 0) / 100.0

                if churn_prob < 0.2:
                    bins["0-0.2"] += 1
                elif churn_prob < 0.4:
                    bins["0.2-0.4"] += 1
                elif churn_prob < 0.6:
                    bins["0.4-0.6"] += 1
                elif churn_prob < 0.8:
                    bins["0.6-0.8"] += 1
                else:
                    bins["0.8-1.0"] += 1

            return [{"range": k, "count": v} for k, v in bins.items()]

        except Exception as e:
            print(f"[ChurnProcessingService] Error in getProbabilityDistribution: {e}")
            return []


    @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
    async def get_feature_importance(self, filters: Dict) -> List[Dict]:
        """Get feature importance from ML model - no icons"""
        try:
            # Ensure model is trained with current filters
            await self._ensure_model_trained(filters)

            # Get from ML model (already has no icons)
            return self.ml_predictor.get_feature_importance()

        except Exception as e:
            print(f"[ChurnProcessingService] Error in getFeatureImportance: {e}")
            # Return empty on error (no misleading hardcoded values)
            return []

    def _generate_insights(
        self,
        customer_stats: List[Dict],
        segment_risk: List[Dict],
        probability_dist: List[Dict],
        feature_importance: List[Dict]
    ) -> List[str]:
        """Generate enhanced AI insights with actionable recommendations"""
        insights = []

        if not customer_stats:
            return ["No customer data available for churn analysis. Please adjust date range filters or check data source connectivity."]

        # Calculate risk metrics
        total_customers = len(customer_stats)
        high_risk = sum(1 for c in customer_stats if c.get('riskLevel') in ['High', 'Very High'])
        very_high_risk = sum(1 for c in customer_stats if c.get('riskLevel') == 'Very High')
        avg_risk = sum(c.get('riskPercentage', 0) for c in customer_stats) / total_customers if total_customers > 0 else 0

        # Calculate revenue at risk
        high_risk_customers = [c for c in customer_stats if c.get('riskLevel') in ['High', 'Very High']]
        total_revenue_at_risk = sum(c.get('lifetime_sales', 0) for c in high_risk_customers)
        very_high_risk_revenue = sum(c.get('lifetime_sales', 0) for c in customer_stats if c.get('riskLevel') == 'Very High')

        # CRITICAL: Very high risk customers insight
        if very_high_risk > 0:
            avg_value = very_high_risk_revenue / very_high_risk if very_high_risk > 0 else 0
            insights.append(
                f"CRITICAL: {very_high_risk} high-value customers (${very_high_risk_revenue:,.0f} total LTV) are at >70% churn risk. "
                f"**Action:** Launch immediate 48-hour retention campaign. Consider offering 10-15% loyalty discount, premium support upgrade, "
                f"or exclusive early access to new features. Estimated cost of inaction: ${very_high_risk_revenue * 0.60:,.0f} lost revenue."
            )

        # HIGH PRIORITY: General high risk insight
        if high_risk > 0:
            risk_pct = (high_risk / total_customers * 100) if total_customers > 0 else 0
            insights.append(
                f"HIGH PRIORITY: {high_risk} customers ({risk_pct:.1f}%) are at elevated churn risk with ${total_revenue_at_risk:,.0f} revenue exposure. "
                f"**Action:** Deploy targeted re-engagement email sequence over next 7 days. Segment by usage patterns and personalize outreach. "
                f"Expected outcome: 25-30% churn reduction with proactive intervention."
            )

        # Average risk insight with context
        if avg_risk > 50:
            insights.append(
                f"ALERT: Portfolio-wide churn risk at {avg_risk:.1f}% indicates systemic issues. "
                f"**Action:** Conduct immediate customer satisfaction survey to identify root causes. "
                f"Review product roadmap alignment with customer needs. Consider implementing quarterly business reviews for top accounts. "
                f"Timeline: Survey within 3 days, action plan within 2 weeks."
            )
        elif avg_risk > 30:
            insights.append(
                f"MODERATE: Average churn risk of {avg_risk:.1f}% is above healthy baseline (20-25%). "
                f"**Action:** Strengthen customer success touchpoints and improve onboarding experience. "
                f"Implement automated health score monitoring with early warning alerts."
            )

        # Segment-specific actionable insights
        if segment_risk:
            high_risk_segments = [s for s in segment_risk if s.get('avgRisk', 0) > 60]
            if high_risk_segments:
                top_segment = max(high_risk_segments, key=lambda x: x.get('avgRisk', 0))
                segment_name = top_segment.get('segment', 'Unknown')
                segment_risk_pct = top_segment.get('avgRisk', 0)
                insights.append(
                    f"SEGMENT ALERT: {segment_name} segment shows critically high {segment_risk_pct:.1f}% churn risk. "
                    f"**Action:** Create segment-specific value proposition and tailored retention offers. "
                    f"Analyze competitive pressures and pricing sensitivity for this segment. "
                    f"Consider dedicated customer success manager assignment for top accounts."
                )

        # Feature importance - actionable root cause insights
        if feature_importance and len(feature_importance) > 0:
            top_factor = feature_importance[0]
            factor_name = top_factor.get('name', 'Unknown')
            factor_importance = top_factor.get('importance', 0)

            # Customize actions based on top factor
            action_map = {
                'Transaction Frequency': 'Set up automated engagement alerts when customers show 30% drop in purchase frequency. Launch win-back campaigns with exclusive offers.',
                'Recency': 'Implement "We miss you" re-activation campaigns for customers inactive >30 days. Offer limited-time incentives to drive repeat purchases.',
                'Average Order Value': 'Create upsell programs and bundle offers to increase transaction value. Provide volume discounts and premium tier benefits.',
                'Lifetime Value': 'Focus on high-LTV customer retention with VIP programs and personalized account management.',
                'Product Diversity': 'Develop cross-sell strategies to increase product adoption. Create product bundles and showcase complementary offerings.'
            }

            action = action_map.get(factor_name, f'Deep-dive analysis required on {factor_name}. Create improvement roadmap with measurable KPIs.')

            insights.append(
                f"ROOT CAUSE: {factor_name} is the #1 churn predictor ({factor_importance:.1f}% importance score). "
                f"**Action:** {action} Expected impact: 20-25% churn reduction when addressed."
            )

        # Probability distribution - immediate action items
        if probability_dist:
            high_prob_bin = next((b for b in probability_dist if b.get('range') == '0.8-1.0'), None)
            if high_prob_bin and high_prob_bin.get('count', 0) > 0:
                critical_count = high_prob_bin.get('count', 0)
                insights.append(
                    f"IMMEDIATE ACTION: {critical_count} customers have >80% churn probability and require direct outreach TODAY. "
                    f"**Action:** Assign to account managers for personal check-in calls. Understand pain points and offer customized solutions. "
                    f"Authorize special retention offers up to 20% discount if needed. Success rate with immediate intervention: 40-50%."
                )

        # Add proactive monitoring recommendation
        if len(insights) > 0:
            insights.append(
                f"NEXT STEPS: Monitor churn risk weekly and track intervention effectiveness. "
                f"Set up automated alerts for customers moving into high-risk categories. "
                f"Measure retention campaign ROI and iterate based on results. Target: Reduce churn by 30% over next quarter."
            )

        return insights

    def _generate_ai_insights(
        self,
        customer_stats: List[Dict],
        segment_risk: List[Dict],
        probability_dist: List[Dict],
        feature_importance: List[Dict],
        filters: Dict
    ) -> List[str]:
        """Generate AI-powered insights using Gemini (hybrid approach)

        This supplements rule-based insights with creative AI analysis.
        Failures gracefully fall back to empty list without breaking the response.
        """
        try:
            # Import here to avoid breaking if module not available
            from lib.ai_insights_generator import generate_ai_insights

            if not customer_stats:
                return []

            # Calculate metrics for AI context
            total_customers = len(customer_stats)
            high_risk = sum(1 for c in customer_stats if c.get('riskLevel') in ['High', 'Very High'])
            very_high_risk = sum(1 for c in customer_stats if c.get('riskLevel') == 'Very High')
            avg_risk = sum(c.get('riskPercentage', 0) for c in customer_stats) / total_customers if total_customers > 0 else 0

            # Calculate revenue at risk
            high_risk_customers = [c for c in customer_stats if c.get('riskLevel') in ['High', 'Very High']]
            total_revenue_at_risk = sum(c.get('lifetime_sales', 0) for c in high_risk_customers)

            # Get top risk factor
            top_factor = "Unknown"
            factor_importance = 0
            if feature_importance and len(feature_importance) > 0:
                top_factor = feature_importance[0].get('name', 'Unknown')
                factor_importance = feature_importance[0].get('importance', 0)

            # Get time period from filters
            time_period = f"{filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}"

            # Build segment breakdown text
            segment_breakdown = ""
            if segment_risk:
                for segment in segment_risk:
                    total_in_seg = segment.get('low', 0) + segment.get('medium', 0) + segment.get('high', 0) + segment.get('very_high', 0)
                    if total_in_seg > 0:
                        high_risk_in_seg = segment.get('high', 0) + segment.get('very_high', 0)
                        risk_pct = (high_risk_in_seg / total_in_seg * 100)
                        segment_breakdown += f"- {segment['segment']}: {high_risk_in_seg}/{total_in_seg} at risk ({risk_pct:.1f}%)\n"

            # Find critical segment
            critical_segment = "Unknown"
            if segment_risk:
                max_risk_segment = max(segment_risk, key=lambda s: (s.get('high', 0) + s.get('very_high', 0)))
                critical_segment = max_risk_segment.get('segment', 'Unknown')

            # Prepare KPIs
            kpis = {
                'total_customers': total_customers,
                'high_risk_count': high_risk,
                'high_risk_pct': (high_risk / total_customers * 100) if total_customers > 0 else 0,
                'revenue_at_risk': total_revenue_at_risk,
                'avg_risk': avg_risk,
                'top_factor': top_factor,
                'factor_importance': factor_importance,
                'time_period': time_period
            }

            # Prepare data summary
            data_summary = {
                'segment_breakdown': segment_breakdown,
                'critical_segment': critical_segment,
                'frequency_decline_rate': 45,  # Placeholder - could be calculated from data
                'high_value_pct': (very_high_risk / total_customers * 100) if total_customers > 0 else 0
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='churn_prediction',
                kpis=kpis,
                data_summary=data_summary,
                filters=filters
            )

            print(f"[ChurnProcessingService] Generated {len(ai_insights)} AI insights")
            return ai_insights

        except ImportError as e:
            print(f"[ChurnProcessingService] AI insights module not available: {e}")
            return []
        except Exception as e:
            print(f"[ChurnProcessingService] Error generating AI insights: {e}")
            return []  # Graceful fallback - don't break the response

    async def get_customers(self, filters: Dict) -> List[Dict]:
        """Get customer list with churn risk levels

        Port of Express getCustomers method - uses ML predictions from get_customer_stats
        """
        try:
            customer_stats = await self.get_customer_stats(filters)

            if not customer_stats:
                return []

            # Use the risk levels and percentages already calculated in get_customer_stats
            # This ensures consistency with ML predictions
            results = []
            for customer in customer_stats:
                results.append({
                    'id': customer['customer_id'],
                    'name': customer['customer_name'] or f"Customer {customer['customer_id']}",
                    'customerId': int(customer['customer_id']) if customer['customer_id'].isdigit() else 0,
                    'clv': customer.get('lifetime_sales', 0) or 0,
                    'riskLevel': customer.get('riskLevel', 'Low'),  # Use ML-calculated risk
                    'riskPercentage': customer.get('riskPercentage', 0)  # Use ML-calculated percentage
                })

            return results

        except Exception as e:
            print(f"[ChurnProcessingService] Error in getCustomers: {e}")
            return []

    async def export_data(self, filters: Dict, format: str = 'csv') -> str:
        """Export customer data in CSV or JSON format

        Port of Express exportData method
        """
        try:
            data = await self.get_customers(filters)

            if format == 'csv':
                # Create CSV format
                headers = ['ID', 'Name', 'Customer ID', 'CLV', 'Risk Level', 'Risk Percentage']
                rows = [headers]

                for customer in data:
                    rows.append([
                        customer['id'],
                        customer['name'],
                        customer['customerId'],
                        customer['clv'],
                        customer['riskLevel'],
                        customer['riskPercentage']
                    ])

                return '\n'.join([','.join(map(str, row)) for row in rows])
            else:
                # Return JSON format
                import json
                return json.dumps(data, indent=2)

        except Exception as e:
            print(f"[ChurnProcessingService] Error in exportData: {e}")
            return "" if format == 'csv' else "[]"