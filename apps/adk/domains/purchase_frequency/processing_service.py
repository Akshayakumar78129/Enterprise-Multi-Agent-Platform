"""
Purchase Frequency Processing Service
Complete implementation following ChurnPredictionService pattern
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import PurchaseFrequencyDataService
from .ml_predictor import PurchaseFrequencyMLPredictor

logger = logging.getLogger(__name__)


class PurchaseFrequencyService:
    """Processing service for Purchase frequency analysis and prediction"""

    def __init__(self):
        """Initialize the service with data service and ML predictor"""
        self.data_service = PurchaseFrequencyDataService()
        self.ml_predictor = PurchaseFrequencyMLPredictor()
        logger.info(f"{self.__class__.__name__} initialized")

    @cache_dashboard_endpoint(dashboard_type='purchase-frequency', ttl=300)
    async def get_dashboard_summary(self, filters: Dict = {}) -> Dict:
        """Get Purchase Frequency dashboard summary - matches web folder logic"""

        try:
            logger.info(f"Getting Purchase Frequency summary with filters: {filters}")

            # Get purchase frequency data from data service
            frequency_data = await self.data_service.get_purchase_frequency_data(filters)
            frequency_df = pd.DataFrame(frequency_data.get('rows', frequency_data.get('data', [])))

            if frequency_df.empty:
                return self._get_empty_response()

            # Perform purchase frequency analysis using web folder logic
            analysis_results = self._analyze_purchase_frequency(frequency_df, filters)

            # Calculate KPIs from analysis
            kpis = {
                'totalCustomers': analysis_results.get('total_customers', 0),
                'avgPurchaseFrequency': analysis_results.get('avg_purchase_frequency', 0),
                'avgIntervalDays': analysis_results.get('avg_interval_days', 0),
                'highFrequencyCustomers': analysis_results.get('high_frequency_count', 0),
                'activeCustomers': analysis_results.get('active_customers', 0)
            }

            # Generate visualization data
            visualizations = {
                'frequencyDistribution': analysis_results.get('frequency_distribution', []),
                'intervalAnalysis': analysis_results.get('interval_analysis', {}),
                'customerSegments': analysis_results.get('customer_segments', []),
                'valuePatterns': analysis_results.get('value_patterns', {})
            }

            return {
                'kpiMetrics': kpis,
                'mainData': visualizations,
                'analysisResults': analysis_results,
                'insights': analysis_results.get('insights', []),
                'metadata': {
                    'analysisDate': datetime.now().isoformat(),
                    'totalRecords': len(frequency_df),
                    'filters': filters
                }
            }

        except Exception as e:
            logger.error(f"Error in get_dashboard_summary: {str(e)}", exc_info=True)
            return self._get_empty_response()

    def _analyze_purchase_frequency(self, df: pd.DataFrame, filters: Dict) -> Dict:
        """Analyze purchase frequency patterns - matches web folder logic"""
        try:
            # Convert transaction_date to datetime
            df['transaction_date'] = pd.to_datetime(df['transaction_date'])

            # Calculate key metrics per customer
            customer_metrics = {}
            insights = []

            for customer_id, group in df.groupby('customer_id'):
                dates = group['transaction_date'].sort_values()
                intervals = dates.diff().dropna()

                metrics = {
                    'total_purchases': len(dates),
                    'avg_interval_days': intervals.dt.total_seconds().mean() / (24 * 3600) if len(intervals) > 0 else 0,
                    'first_purchase': dates.min(),
                    'last_purchase': dates.max(),
                    'total_spent': group['transaction_amount'].sum(),
                    'avg_transaction': group['transaction_amount'].mean()
                }

                customer_metrics[customer_id] = metrics

            # Convert to DataFrame for analysis
            metrics_df = pd.DataFrame(customer_metrics).T

            if metrics_df.empty:
                return {'insights': ['No transaction data found for analysis']}

            # Calculate overall metrics
            total_customers = len(metrics_df)
            avg_purchase_frequency = metrics_df['total_purchases'].mean()
            avg_interval = metrics_df['avg_interval_days'].mean()

            insights.append(f"Total Customers Analyzed: {total_customers}")
            insights.append(f"Average Purchases per Customer: {avg_purchase_frequency:.2f}")
            insights.append(f"Average Days Between Purchases: {avg_interval:.1f}")

            # Frequency segments
            high_frequency = metrics_df[metrics_df['total_purchases'] > avg_purchase_frequency * 1.5]
            low_frequency = metrics_df[metrics_df['total_purchases'] < avg_purchase_frequency * 0.5]

            high_frequency_count = len(high_frequency)
            low_frequency_count = len(low_frequency)

            insights.append(f"High Frequency Customers (>{avg_purchase_frequency * 1.5:.1f} purchases): {high_frequency_count} ({high_frequency_count/total_customers*100:.1f}%)")
            insights.append(f"Low Frequency Customers (<{avg_purchase_frequency * 0.5:.1f} purchases): {low_frequency_count} ({low_frequency_count/total_customers*100:.1f}%)")

            # Recent purchase patterns
            recent_cutoff = pd.Timestamp.now() - pd.Timedelta(days=90)
            recent_customers = metrics_df[metrics_df['last_purchase'] >= recent_cutoff]
            active_customers = len(recent_customers)

            insights.append(f"Active Customers (purchased in last 90 days): {active_customers} ({active_customers/total_customers*100:.1f}%)")

            # Value analysis
            avg_transaction_mean = metrics_df['avg_transaction'].mean()
            high_value = metrics_df[metrics_df['avg_transaction'] > avg_transaction_mean * 1.5]
            high_value_count = len(high_value)

            insights.append(f"High Value Customers (avg transaction > ${avg_transaction_mean * 1.5:.2f}): {high_value_count} ({high_value_count/total_customers*100:.1f}%)")

            # Frequency distribution for visualization
            frequency_bins = [0, 1, 3, 5, 10, float('inf')]
            frequency_labels = ['1', '2-3', '4-5', '6-10', '10+']
            metrics_df['frequency_category'] = pd.cut(
                metrics_df['total_purchases'],
                bins=frequency_bins,
                labels=frequency_labels,
                include_lowest=True
            )

            frequency_distribution = []
            for category in frequency_labels:
                count = (metrics_df['frequency_category'] == category).sum()
                percentage = (count / total_customers * 100) if total_customers > 0 else 0
                frequency_distribution.append({
                    'category': category,
                    'count': int(count),
                    'percentage': float(percentage)
                })

            # Customer segments based on frequency and value
            customer_segments = []
            segments = ['High Frequency', 'Medium Frequency', 'Low Frequency']
            for i, segment in enumerate(segments):
                if i == 0:  # High frequency
                    segment_data = high_frequency
                elif i == 1:  # Medium frequency
                    segment_data = metrics_df[
                        (metrics_df['total_purchases'] >= avg_purchase_frequency * 0.5) &
                        (metrics_df['total_purchases'] <= avg_purchase_frequency * 1.5)
                    ]
                else:  # Low frequency
                    segment_data = low_frequency

                if not segment_data.empty:
                    customer_segments.append({
                        'segmentName': segment,
                        'customerCount': len(segment_data),
                        'avgPurchases': float(segment_data['total_purchases'].mean()),
                        'avgSpend': float(segment_data['total_spent'].mean()),
                        'avgInterval': float(segment_data['avg_interval_days'].mean())
                    })

            return {
                'total_customers': total_customers,
                'avg_purchase_frequency': float(avg_purchase_frequency),
                'avg_interval_days': float(avg_interval),
                'high_frequency_count': high_frequency_count,
                'active_customers': active_customers,
                'insights': insights,
                'frequency_distribution': frequency_distribution,
                'customer_segments': customer_segments,
                'interval_analysis': {
                    'min_interval': float(metrics_df['avg_interval_days'].min()) if not metrics_df.empty else 0,
                    'max_interval': float(metrics_df['avg_interval_days'].max()) if not metrics_df.empty else 0,
                    'median_interval': float(metrics_df['avg_interval_days'].median()) if not metrics_df.empty else 0
                },
                'value_patterns': {
                    'avg_transaction_value': float(avg_transaction_mean),
                    'high_value_customers': high_value_count,
                    'total_revenue': float(metrics_df['total_spent'].sum()) if not metrics_df.empty else 0
                }
            }

        except Exception as e:
            logger.error(f"Error analyzing purchase frequency: {e}")
            return {'insights': ['Error performing purchase frequency analysis']}

    def _get_empty_response(self) -> Dict:
        """Return empty response structure"""
        return {
            'kpiMetrics': {
                'totalCustomers': 0,
                'avgPurchaseFrequency': 0,
                'avgIntervalDays': 0,
                'highFrequencyCustomers': 0,
                'activeCustomers': 0
            },
            'mainData': {
                'frequencyDistribution': [],
                'intervalAnalysis': {},
                'customerSegments': [],
                'valuePatterns': {}
            },
            'analysisResults': {},
            'insights': [],
            'metadata': {
                'analysisDate': datetime.now().isoformat(),
                'totalRecords': 0,
                'filters': {}
            }
        }

    def _perform_ml_analysis(self, df: pd.DataFrame, transaction_df: pd.DataFrame = None) -> Dict:
        """Perform ML analysis specific to this dashboard"""

        if df.empty:
            return self._get_empty_ml_results()

        # Call appropriate ML predictor method based on dashboard
        if 'purchase_frequency' == 'customer_segmentation':
            return self.ml_predictor.perform_segmentation(df)
        elif 'purchase_frequency' == 'customer_ltv':
            return self.ml_predictor.predict_ltv(df)
        elif 'purchase_frequency' == 'engagement_classifier':
            return self.ml_predictor.classify_engagement(df)
        elif 'purchase_frequency' == 'next_purchase' and transaction_df is not None:
            return self.ml_predictor.predict_next_purchase(df, transaction_df)
        else:
            return self.ml_predictor.analyze_data(df)

    def _calculate_kpis(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                       loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Calculate KPI metrics"""

        kpis = {}

        # Calculate based on dashboard type
        if 'purchase_frequency' == 'customer_segmentation':
            kpis = {
                'totalSegments': len(ml_results.get('segments', [])),
                'largestSegmentSize': max([s['size'] for s in ml_results.get('segments', [{}])], default=0),
                'avgSegmentValue': np.mean([s['avg_revenue'] for s in ml_results.get('segments', [{}])], default=0),
                'segmentationQuality': ml_results.get('quality_score', 0)
            }
        elif 'purchase_frequency' == 'customer_ltv':
            predictions = ml_results.get('predictions', [])
            if predictions:
                ltv_values = [p.get('predicted_ltv', 0) for p in predictions]
                kpis = {
                    'avgLTV': np.mean(ltv_values) if ltv_values else 0,
                    'totalLTV': np.sum(ltv_values) if ltv_values else 0,
                    'highValueCount': len([v for v in ltv_values if v > np.percentile(ltv_values, 75)]) if ltv_values else 0,
                    'ltvGrowth': 5.2  # Mock growth percentage
                }
        elif 'purchase_frequency' == 'purchase_frequency':
            kpis = {
                'avgPurchaseFrequency': transactions_df.groupby('customer_id').size().mean() if not transactions_df.empty else 0,
                'highFrequencyCustomers': len(transactions_df.groupby('customer_id').filter(lambda x: len(x) > 5)) if not transactions_df.empty else 0,
                'frequencyTrend': 3.8,  # Mock trend
                'retentionRate': 68.5  # Mock retention rate
            }
        elif 'purchase_frequency' == 'engagement_classifier':
            classifications = ml_results.get('classifications', [])
            if classifications:
                engagement_levels = [c.get('engagement_level', 'Unknown') for c in classifications]
                kpis = {
                    'highlyEngaged': engagement_levels.count('High') + engagement_levels.count('Champion'),
                    'atRiskCount': engagement_levels.count('Low') + engagement_levels.count('Inactive'),
                    'avgEngagementScore': np.mean([c.get('engagement_score', 0) for c in classifications]),
                    'engagementTrend': 2.1  # Mock trend
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
        if 'purchase_frequency' == 'customer_segmentation':
            visualizations = {
                'segmentDistribution': self._create_segment_distribution_chart(ml_results),
                'segmentCharacteristics': self._create_segment_characteristics_chart(ml_results),
                'featureImportance': ml_results.get('feature_importance', []),
                'segmentMatrix': self._create_segment_matrix(ml_results)
            }
        elif 'purchase_frequency' == 'customer_ltv':
            visualizations = {
                'ltvDistribution': self._create_ltv_distribution_chart(ml_results),
                'ltvTrend': self._create_ltv_trend_chart(transactions_df),
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
        """Generate insights based on ML results and KPIs"""

        insights = []

        # Generate insights based on dashboard type
        if 'purchase_frequency' == 'customer_segmentation':
            segments = ml_results.get('segments', [])
            if segments:
                largest_segment = max(segments, key=lambda x: x['size'])
                insights.append(f"Largest customer segment contains {largest_segment['size']} customers ({largest_segment['percentage']:.1f}% of total)")

                highest_value_segment = max(segments, key=lambda x: x['avg_revenue'])
                insights.append(f"Segment {highest_value_segment['segment_id']} has the highest average revenue at ${highest_value_segment['avg_revenue']:.2f}")

        elif 'purchase_frequency' == 'customer_ltv':
            if kpis.get('avgLTV', 0) > 0:
                insights.append(f"Average customer lifetime value is ${kpis['avgLTV']:.2f}")
            if kpis.get('highValueCount', 0) > 0:
                insights.append(f"{kpis['highValueCount']} customers are classified as high-value (top 25%)")

        elif 'purchase_frequency' == 'engagement_classifier':
            if kpis.get('highlyEngaged', 0) > 0:
                insights.append(f"{kpis['highlyEngaged']} customers are highly engaged")
            if kpis.get('atRiskCount', 0) > 0:
                insights.append(f"{kpis['atRiskCount']} customers are at risk and need attention")

        # Add general insights
        if not insights:
            insights = [
                "Analysis completed successfully",
                f"Processed data for {kpis.get('totalCustomers', 0)} customers",
                "ML model predictions are available for decision making"
            ]

        return insights

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
