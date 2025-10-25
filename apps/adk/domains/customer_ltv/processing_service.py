"""
Customer Lifetime Value Processing Service
Complete implementation following ChurnPredictionService pattern
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import CustomerLtvDataService
from .ml_predictor import CustomerLtvMLPredictor

logger = logging.getLogger(__name__)


class CustomerLtvService:
    """Processing service for Customer lifetime value prediction using regression models"""

    def __init__(self):
        """Initialize the service with data service and ML predictor"""
        self.data_service = CustomerLtvDataService()
        self.ml_predictor = CustomerLtvMLPredictor()
        logger.info(f"{self.__class__.__name__} initialized")

    @cache_dashboard_endpoint(dashboard_type='customer-ltv', ttl=300)
    async def get_dashboard_summary(self, filters: Dict = {}) -> Dict:
        """Get Customer Lifetime Value dashboard summary with ML predictions"""

        try:
            logger.info(f"Getting Customer Lifetime Value summary with filters: {filters}")

            # Parse date filters
            date_filters = self._parse_date_filters(filters)

            # Get data from data service
            customers = await self.data_service.get_customers(date_filters)
            transactions = await self.data_service.get_transactions(date_filters)
            loyalty = await self.data_service.get_loyalty(date_filters)
            aggregated = await self.data_service.get_aggregated_metrics(date_filters)

            # Convert to DataFrames - using 'rows' key as per database response
            customers_df = pd.DataFrame(customers.get('rows', []))
            transactions_df = pd.DataFrame(transactions.get('rows', []))
            loyalty_df = pd.DataFrame(loyalty.get('rows', []))
            aggregated_df = pd.DataFrame(aggregated.get('rows', []))

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

            # Generate rule-based insights (fast, always present)
            insights = self._generate_insights(ml_results, kpis)

            # Generate AI-powered insights (optional, with graceful fallback)
            ai_insights = self._generate_ai_insights(ml_results, kpis, filters)

            return {
                'kpiMetrics': kpis,
                'mainData': visualizations,
                'mlResults': ml_results,
                'insights': insights,  # Rule-based (backward compatible)
                'ai_insights': ai_insights,  # AI-powered (new)
                'insights_metadata': {
                    'rule_based_count': len(insights),
                    'ai_insights_count': len(ai_insights),
                    'insights_version': 'hybrid_v1'
                },
                'metadata': {
                    'analysisDate': datetime.now().isoformat(),
                    'totalCustomers': len(customers_df),
                    'totalTransactions': len(transactions_df),
                    'filters': filters,
                    'dataQuality': self._assess_data_quality(customers_df, transactions_df)
                }
            }

        except Exception as e:
            logger.error(f"Error in get_dashboard_summary: {str(e)}", exc_info=True)
            return self._get_error_response(str(e))

    def _perform_ml_analysis(self, df: pd.DataFrame, transaction_df: pd.DataFrame = None) -> Dict:
        """Perform ML analysis specific to this dashboard"""

        if df.empty:
            return self._get_empty_ml_results()

        # Call appropriate ML predictor method based on dashboard
        if 'customer_ltv' == 'customer_segmentation':
            return self.ml_predictor.perform_segmentation(df)
        elif 'customer_ltv' == 'customer_ltv':
            return self.ml_predictor.predict_ltv(df)
        elif 'customer_ltv' == 'engagement_classifier':
            return self.ml_predictor.classify_engagement(df)
        elif 'customer_ltv' == 'next_purchase' and transaction_df is not None:
            return self.ml_predictor.predict_next_purchase(df, transaction_df)
        else:
            return self.ml_predictor.analyze_data(df)

    def _calculate_kpis(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                       loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Calculate KPI metrics"""

        kpis = {}

        # Calculate based on dashboard type
        if 'customer_ltv' == 'customer_segmentation':
            kpis = {
                'totalSegments': len(ml_results.get('segments', [])),
                'largestSegmentSize': max([s['size'] for s in ml_results.get('segments', [{}])], default=0),
                'avgSegmentValue': np.mean([s['avg_revenue'] for s in ml_results.get('segments', [{}])], default=0),
                'segmentationQuality': ml_results.get('quality_score', 0)
            }
        elif 'customer_ltv' == 'customer_ltv':
            predictions = ml_results.get('predictions', [])
            if predictions:
                ltv_values = [p.get('predicted_ltv', 0) for p in predictions]
                kpis = {
                    'avgLtv': int(np.mean(ltv_values)) if ltv_values else 0,
                    'medianLtv': int(np.median(ltv_values)) if ltv_values else 0,
                    'totalValue': int(np.sum(ltv_values)) if ltv_values else 0,
                    'highValueCount': len([v for v in ltv_values if v > 100000]) if ltv_values else 0,
                    'ltvGrowth': ml_results.get('growth_percentage', 0),
                    'predictionAccuracy': ml_results.get('accuracy_score', 0)
                }
            else:
                # Return empty KPIs if no predictions
                kpis = {
                    'avgLtv': 0,
                    'medianLtv': 0,
                    'totalValue': 0,
                    'highValueCount': 0,
                    'ltvGrowth': 0,
                    'predictionAccuracy': 0
                }
        elif 'customer_ltv' == 'purchase_frequency':
            kpis = {
                'avgPurchaseFrequency': transactions_df.groupby('customer_id').size().mean() if not transactions_df.empty else 0,
                'highFrequencyCustomers': len(transactions_df.groupby('customer_id').filter(lambda x: len(x) > 5)) if not transactions_df.empty else 0,
                'frequencyTrend': ml_results.get('frequency_trend', 0),
                'retentionRate': ml_results.get('retention_rate', 0)
            }
        elif 'customer_ltv' == 'engagement_classifier':
            classifications = ml_results.get('classifications', [])
            if classifications:
                engagement_levels = [c.get('engagement_level', 'Unknown') for c in classifications]
                kpis = {
                    'highlyEngaged': engagement_levels.count('High') + engagement_levels.count('Champion'),
                    'atRiskCount': engagement_levels.count('Low') + engagement_levels.count('Inactive'),
                    'avgEngagementScore': np.mean([c.get('engagement_score', 0) for c in classifications]),
                    'engagementTrend': ml_results.get('engagement_trend', 0)
                }
        else:
            # Default KPIs
            kpis = {
                'totalCustomers': len(customers_df),
                'activeCustomers': len(customers_df[customers_df.get('customer_status') == 'Active']) if 'customer_status' in customers_df else 0,
                'totalRevenue': transactions_df['net_sales_amount'].sum() if not transactions_df.empty and 'net_sales_amount' in transactions_df else 0,
                'avgCustomerValue': transactions_df.groupby('customer_id')['net_sales_amount'].sum().mean() if not transactions_df.empty and 'net_sales_amount' in transactions_df else 0
            }

        return kpis

    def _generate_visualizations(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                                loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Generate data for dashboard visualizations"""

        visualizations = {}

        # Generate based on dashboard type
        if 'customer_ltv' == 'customer_segmentation':
            visualizations = {
                'segmentDistribution': self._create_segment_distribution_chart(ml_results),
                'segmentCharacteristics': self._create_segment_characteristics_chart(ml_results),
                'featureImportance': ml_results.get('feature_importance', []),
                'segmentMatrix': self._create_segment_matrix(ml_results)
            }
        elif 'customer_ltv' == 'customer_ltv':
            visualizations = {
                'ltvDistribution': self._create_ltv_distribution_chart(ml_results),
                'ltvTrends': self._create_ltv_trends_data(transactions_df, customers_df),
                'segmentAnalysis': self._create_segment_analysis_data(customers_df, transactions_df, ml_results),
                'topCustomers': self._create_top_customers_data(customers_df, transactions_df, ml_results),
                'predictionData': self._create_prediction_accuracy_data(ml_results),
                'valueContribution': self._create_value_contribution_data(customers_df, transactions_df, ml_results),
                'customerValueMatrix': self._create_value_matrix(ml_results),
                'ltvBySegment': self._create_ltv_by_segment_chart(ml_results)
            }
        else:
            # Default visualizations
            visualizations = {
                'timeSeries': self._create_time_series_chart(transactions_df),
                'distribution': self._create_distribution_chart(ml_results),
                'topMetrics': self._create_top_metrics_chart(customers_df, transactions_df)
            }

        return visualizations

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
            # Return empty data instead of mock
            return []

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

        predictions = ml_results.get('predictions', [])
        if not predictions:
            return []

        # Group predictions by segment
        segment_ltv = {}
        for pred in predictions:
            segment = pred.get('segment', 'Unknown')
            ltv = pred.get('predicted_ltv', 0)

            if segment not in segment_ltv:
                segment_ltv[segment] = []
            segment_ltv[segment].append(ltv)

        # Calculate average LTV per segment
        result = []
        for segment, ltv_values in segment_ltv.items():
            if ltv_values:
                result.append({
                    'segment': segment,
                    'ltv': int(np.mean(ltv_values))
                })

        # Sort by LTV descending
        result.sort(key=lambda x: x['ltv'], reverse=True)
        return result[:10]  # Return top 10 segments

    def _create_time_series_chart(self, transactions_df: pd.DataFrame) -> List[Dict]:
        """Create generic time series chart"""

        if transactions_df.empty or 'txn_date' not in transactions_df.columns:
            # Return empty data instead of mock
            return []

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
            # Return empty data instead of mock
            return []

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
        """Generate enhanced insights with actionable value maximization strategies"""

        insights = []

        # Generate insights based on dashboard type
        if 'customer_ltv' == 'customer_segmentation':
            segments = ml_results.get('segments', [])
            if segments:
                largest_segment = max(segments, key=lambda x: x['size'])
                insights.append(f"Largest customer segment contains {largest_segment['size']} customers ({largest_segment['percentage']:.1f}% of total)")

                highest_value_segment = max(segments, key=lambda x: x['avg_revenue'])
                insights.append(f"Segment {highest_value_segment['segment_id']} has the highest average revenue at ${highest_value_segment['avg_revenue']:.2f}")

        elif 'customer_ltv' == 'customer_ltv':
            avg_ltv = kpis.get('avgLTV', 0)
            total_customers = kpis.get('totalCustomers', 0)
            high_value_count = kpis.get('highValueCount', 0)
            total_ltv = kpis.get('totalLTV', 0)

            if avg_ltv > 0 and total_customers > 0:
                insights.append(
                    f"PORTFOLIO VALUE: Average customer lifetime value is ${avg_ltv:,.2f} across {total_customers:,} customers (${total_ltv:,.0f} total portfolio value). "
                    f"**Action:** Focus on increasing LTV by 15-20% through: (1) Reduce time-to-value for new customers, "
                    f"(2) Launch cross-sell campaigns to increase product adoption, (3) Implement loyalty rewards for repeat purchases. "
                    f"Target impact: ${total_ltv * 0.15:,.0f} additional revenue over 12 months."
                )

            if high_value_count > 0 and total_customers > 0:
                high_value_pct = (high_value_count / total_customers * 100)
                high_value_contribution = kpis.get('highValueTotalLTV', 0)
                contribution_pct = (high_value_contribution / total_ltv * 100) if total_ltv > 0 else 0

                insights.append(
                    f"VIP CUSTOMERS: {high_value_count:,} customers ({high_value_pct:.1f}%) drive ${high_value_contribution:,.0f} ({contribution_pct:.1f}%) of total value. "
                    f"**Action:** Establish white-glove VIP program with dedicated success managers, quarterly business reviews, and early feature access. "
                    f"Retention priority: >95% for this segment. Cost of losing one VIP: ${high_value_contribution/high_value_count if high_value_count > 0 else 0:,.0f} average."
                )

            # Mid-tier expansion opportunity
            medium_value_count = total_customers - high_value_count
            if medium_value_count > 0:
                avg_medium_value = ((total_ltv - kpis.get('highValueTotalLTV', 0)) / medium_value_count) if medium_value_count > 0 else 0
                upgrade_potential = (avg_ltv * 1.5 - avg_medium_value) * medium_value_count

                if upgrade_potential > 0:
                    insights.append(
                        f"GROWTH OPPORTUNITY: {medium_value_count:,} mid-tier customers show ${upgrade_potential:,.0f} expansion potential to reach top quartile. "
                        f"**Action:** Create upgrade path with: (1) Personalized upsell recommendations, (2) Feature education campaigns, "
                        f"(3) Usage-based incentives. Target: Move 20% to high-value tier. Expected revenue gain: ${upgrade_potential * 0.20:,.0f}."
                    )

            # LTV distribution insights
            ltv_std = kpis.get('ltvStdDev', 0)
            if ltv_std > avg_ltv * 0.8:
                insights.append(
                    f"VALUE DISTRIBUTION: High LTV variance (${ltv_std:,.0f} std dev) indicates uneven value realization. "
                    f"**Action:** Analyze success patterns of top 10% customers and replicate across base. "
                    f"Standardize onboarding and success playbooks. Goal: Reduce variance by 25% while lifting floor value by 30%."
                )

        elif 'customer_ltv' == 'engagement_classifier':
            if kpis.get('highlyEngaged', 0) > 0:
                insights.append(f"{kpis['highlyEngaged']} customers are highly engaged")
            if kpis.get('atRiskCount', 0) > 0:
                insights.append(f"{kpis['atRiskCount']} customers are at risk and need attention")

        # Add strategic LTV maximization playbook
        if len(insights) > 0:
            insights.append(
                f"LTV MAXIMIZATION PLAYBOOK: (1) Reduce churn in top 2 quartiles (protect high value), "
                f"(2) Increase purchase frequency through automated re-engagement, "
                f"(3) Expand wallet share via cross-sell programs, (4) Optimize pricing for value-based tiers. "
                f"Measure monthly LTV trends and cohort performance. 90-day goal: 15% LTV increase across all segments."
            )

        # Add general insights if nothing specific was generated
        if not insights:
            insights = [
                "LTV analysis completed successfully",
                f"Processed lifetime value data for {kpis.get('totalCustomers', 0):,} customers",
                "ML-powered LTV predictions ready for value optimization and retention strategies"
            ]

        return insights

    def _generate_ai_insights(self, ml_results: Dict, kpis: Dict, filters: Dict) -> List[str]:
        """Generate AI-powered strategic insights using Gemini

        This complements rule-based insights with creative, strategic analysis.
        Uses dashboard-specific prompts for LTV optimization strategies.

        Args:
            ml_results: ML analysis results with customer LTV data
            kpis: KPI metrics from dashboard
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            # Import at method level for error isolation
            from lib.ai_insights_generator import generate_ai_insights

            # Extract customer LTV data
            customer_stats = ml_results.get('customers', [])
            total_customers = len(customer_stats)

            if total_customers == 0:
                return []

            # Calculate LTV metrics
            ltv_values = [c.get('predictedLTV', 0) for c in customer_stats]
            ltv_values_sorted = sorted(ltv_values, reverse=True)

            avg_ltv = sum(ltv_values) / total_customers if total_customers > 0 else 0
            total_ltv = sum(ltv_values)

            # Calculate quartiles
            q3_idx = int(total_customers * 0.25)
            q2_idx = int(total_customers * 0.50)
            q1_idx = int(total_customers * 0.75)

            top_quartile_ltv = sum(ltv_values_sorted[:q3_idx]) / q3_idx if q3_idx > 0 else 0
            median_ltv = ltv_values_sorted[q2_idx] if q2_idx < len(ltv_values_sorted) else 0
            bottom_quartile_ltv = sum(ltv_values_sorted[q1_idx:]) / (total_customers - q1_idx) if q1_idx < total_customers else 0

            # Calculate standard deviation
            ltv_mean = avg_ltv
            ltv_variance = sum((x - ltv_mean) ** 2 for x in ltv_values) / total_customers if total_customers > 0 else 0
            ltv_std = ltv_variance ** 0.5

            # Identify high-value customers (top 20% by LTV)
            high_value_threshold_idx = int(total_customers * 0.2)
            high_value_customers = customer_stats[:high_value_threshold_idx]
            high_value_count = len(high_value_customers)
            high_value_pct = (high_value_count / total_customers * 100) if total_customers > 0 else 0
            high_value_total = sum(c.get('predictedLTV', 0) for c in high_value_customers)
            high_value_contribution_pct = (high_value_total / total_ltv * 100) if total_ltv > 0 else 0

            # Analyze value drivers (frequency, recency, monetary)
            avg_frequency = sum(c.get('frequency', 0) for c in customer_stats) / total_customers if total_customers > 0 else 0
            avg_recency = sum(c.get('recency', 0) for c in customer_stats) / total_customers if total_customers > 0 else 0
            avg_monetary = sum(c.get('monetary', 0) for c in customer_stats) / total_customers if total_customers > 0 else 0

            value_drivers = (
                f"- Purchase Frequency: {avg_frequency:.1f} transactions/customer\n"
                f"- Average Recency: {avg_recency:.0f} days since last purchase\n"
                f"- Average Monetary: ${avg_monetary:,.0f} per transaction"
            )

            # Build context for AI
            kpis_dict = {
                'total_customers': total_customers,
                'avg_ltv': avg_ltv,
                'total_ltv': total_ltv,
                'high_value_count': high_value_count,
                'high_value_pct': high_value_pct,
                'high_value_total': high_value_total,
                'high_value_contribution_pct': high_value_contribution_pct,
                'top_quartile_ltv': top_quartile_ltv,
                'median_ltv': median_ltv,
                'bottom_quartile_ltv': bottom_quartile_ltv,
                'ltv_std': ltv_std
            }

            data_summary = {
                'value_drivers': value_drivers,
                'avg_frequency': avg_frequency,
                'avg_recency': avg_recency,
                'avg_monetary': avg_monetary
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='customer_ltv',
                kpis=kpis_dict,
                data_summary=data_summary,
                filters=filters
            )

            return ai_insights

        except ImportError:
            print("[CustomerLTVService] AI insights module not available, skipping AI insights")
            return []
        except Exception as e:
            print(f"[CustomerLTVService] Error generating AI insights: {e}")
            return []  # Graceful fallback

    def _parse_date_filters(self, filters: Dict) -> Dict:
        """Parse and validate date filters"""

        parsed = filters.copy()

        # Handle date range
        if 'date_from' in parsed:
            try:
                parsed['date_from'] = pd.to_datetime(parsed['date_from']).strftime('%Y-%m-%d')
            except:
                parsed['date_from'] = '2017-01-01'  # Default to 2017 start

        if 'date_to' in parsed:
            try:
                parsed['date_to'] = pd.to_datetime(parsed['date_to']).strftime('%Y-%m-%d')
            except:
                parsed['date_to'] = '2021-12-31'  # Default to 2021 end

        # Handle time_period format (for compatibility)
        if 'time_period' in parsed:
            if ':' in parsed['time_period']:
                dates = parsed['time_period'].split(':')
                parsed['date_from'] = dates[0]
                parsed['date_to'] = dates[1] if len(dates) > 1 else '2021-12-31'  # Default to 2021 end

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

    def _create_ltv_trends_data(self, transactions_df: pd.DataFrame, customers_df: pd.DataFrame) -> Dict:
        """Create LTV trends data for multi-line chart"""

        # Generate monthly data
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        if transactions_df.empty:
            return {
                'labels': months,
                'avgLtv': [0] * 12,
                'newCustomerLtv': [0] * 12,
                'existingCustomerLtv': [0] * 12
            }

        # Process real transaction data
        if 'txn_date' in transactions_df.columns:
            # Convert to string first if needed, then to datetime
            transactions_df['txn_date'] = transactions_df['txn_date'].astype(str)
            transactions_df['txn_date'] = pd.to_datetime(transactions_df['txn_date'], errors='coerce')
        else:
            return {
                'labels': months,
                'avgLtv': [0] * 12,
                'newCustomerLtv': [0] * 12,
                'existingCustomerLtv': [0] * 12
            }
        transactions_df['month'] = transactions_df['txn_date'].dt.month

        # Calculate monthly LTV for all, new and existing customers
        monthly_stats = {}
        for month_num in range(1, 13):
            month_data = transactions_df[transactions_df['month'] == month_num]
            if not month_data.empty:
                # Calculate average LTV per customer for this month
                customer_monthly_ltv = month_data.groupby('customer_id')['net_sales_amount'].sum()
                monthly_stats[month_num] = {
                    'avg': float(customer_monthly_ltv.mean()) if len(customer_monthly_ltv) > 0 else 0,
                    'new': float(customer_monthly_ltv.head(10).mean()) if len(customer_monthly_ltv) > 0 else 0,  # Simplified: first 10 as new
                    'existing': float(customer_monthly_ltv.tail(-10).mean()) if len(customer_monthly_ltv) > 10 else float(customer_monthly_ltv.mean()) if len(customer_monthly_ltv) > 0 else 0
                }
            else:
                monthly_stats[month_num] = {'avg': 0, 'new': 0, 'existing': 0}

        return {
            'labels': months,
            'avgLtv': [monthly_stats.get(i+1, {}).get('avg', 0) for i in range(12)],
            'newCustomerLtv': [monthly_stats.get(i+1, {}).get('new', 0) for i in range(12)],
            'existingCustomerLtv': [monthly_stats.get(i+1, {}).get('existing', 0) for i in range(12)]
        }

    def _create_segment_analysis_data(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame, ml_results: Dict) -> List[Dict]:
        """Create segment analysis data for doughnut chart"""

        if customers_df.empty or transactions_df.empty:
            return []

        # Always use quartile-based segmentation for better visualization
        # (customer_type column typically has only "business" which isn't useful for analysis)
        customer_ltv = transactions_df.groupby('customer_id')['net_sales_amount'].sum().reset_index()
        customer_ltv.columns = ['customer_id', 'ltv']

        # Create quartile-based segments
        quartiles = customer_ltv['ltv'].quantile([0.25, 0.5, 0.75, 1.0])
        segments = []

        segment_ranges = [
            ('Low Value', 0, quartiles[0.25]),
            ('Medium Value', quartiles[0.25], quartiles[0.5]),
            ('High Value', quartiles[0.5], quartiles[0.75]),
            ('Premium', quartiles[0.75], quartiles[1.0])
        ]

        for segment_name, min_val, max_val in segment_ranges:
            segment_customers = customer_ltv[(customer_ltv['ltv'] >= min_val) & (customer_ltv['ltv'] <= max_val)]
            if not segment_customers.empty:
                segments.append({
                    'segment': segment_name,
                    'totalLtv': float(segment_customers['ltv'].sum()),
                    'avgLtv': float(segment_customers['ltv'].mean()),
                    'count': len(segment_customers)
                })

        return segments

    def _create_top_customers_data(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame, ml_results: Dict) -> List[Dict]:
        """Create top customers data for table"""

        if customers_df.empty or transactions_df.empty:
            return []

        # Aggregate real data by customer
        if 'net_sales_amount' not in transactions_df.columns:
            return []

        customer_stats = transactions_df.groupby('customer_id').agg({
            'net_sales_amount': ['sum', 'mean', 'count']
        }).reset_index()

        customer_stats.columns = ['customer_id', 'ltv', 'avgOrder', 'transactions']

        # Merge with customer info - check if columns exist
        merge_cols = ['customer_id']
        if 'customer_name' in customers_df.columns:
            merge_cols.append('customer_name')
        if 'customer_type' in customers_df.columns:
            merge_cols.append('customer_type')

        result = customer_stats.merge(customers_df[merge_cols],
                                     on='customer_id', how='left') if len(merge_cols) > 1 else customer_stats

        # Sort by LTV and get top 10
        result = result.nlargest(10, 'ltv')

        top_customers = []
        for _, row in result.iterrows():
            top_customers.append({
                'id': row['customer_id'],
                'name': row.get('customer_name', 'Unknown'),
                'ltv': float(row['ltv']),
                'transactions': int(row['transactions']),
                'avgOrder': float(row['avgOrder']),
                'trend': 0,  # Would need historical data to calculate
                'segment': row.get('customer_type', 'Unknown')
            })

        return top_customers

    def _create_prediction_accuracy_data(self, ml_results: Dict) -> List[Dict]:
        """Create prediction accuracy scatter plot data"""

        predictions = ml_results.get('predictions', [])

        if not predictions:
            return []

        # Process real predictions only
        accuracy_data = []
        for pred in predictions[:100]:  # Limit to 100 points
            actual = pred.get('actual_ltv', 0)
            predicted = pred.get('predicted_ltv', 0)
            error_pct = ((predicted - actual) / actual * 100) if actual > 0 else 0

            accuracy_data.append({
                'customer_id': pred.get('customer_id'),
                'customer_name': pred.get('customer_name', 'Unknown'),
                'actual_value': actual,
                'predicted_ltv': predicted,
                'percentage_error': error_pct,
                'error_amount': abs(predicted - actual),
                'error_category': 'Low' if abs(error_pct) < 5 else 'Medium' if abs(error_pct) < 15 else 'High',
                'transaction_count': pred.get('transaction_count', 0)
            })

        return accuracy_data

    def _create_value_contribution_data(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame, ml_results: Dict) -> List[Dict]:
        """Create value contribution analysis data"""

        if customers_df.empty or transactions_df.empty:
            return []

        # Same logic as segment analysis but with different structure
        if 'customer_type' in customers_df.columns:
            merged = transactions_df.merge(customers_df[['customer_id', 'customer_type']], on='customer_id', how='left')
            segment_data = merged.groupby('customer_type').agg({
                'net_sales_amount': ['sum', 'mean'],
                'customer_id': 'nunique'
            })

            segments = []
            for segment, row in segment_data.iterrows():
                segments.append({
                    'segment': segment,
                    'totalValue': float(row[('net_sales_amount', 'sum')]),
                    'customerCount': int(row[('customer_id', 'nunique')]),
                    'avgValue': float(row[('net_sales_amount', 'mean')])
                })
            return segments

        return []
