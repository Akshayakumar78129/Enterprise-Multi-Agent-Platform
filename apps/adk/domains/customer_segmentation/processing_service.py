"""
Customer Segmentation Processing Service
Complete implementation following ChurnPredictionService pattern
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import CustomerSegmentationDataService
from .ml_predictor import CustomerSegmentationMLPredictor

logger = logging.getLogger(__name__)


class CustomerSegmentationService:
    """Processing service for Customer segmentation using RFM analysis and clustering"""

    def __init__(self):
        """Initialize the service with data service and ML predictor"""
        self.data_service = CustomerSegmentationDataService()
        self.ml_predictor = CustomerSegmentationMLPredictor()
        logger.info(f"{self.__class__.__name__} initialized")

    @cache_dashboard_endpoint(dashboard_type='segmentation', ttl=300)
    async def get_dashboard_summary(self, filters: Dict = {}) -> Dict:
        """Get Customer Segmentation dashboard summary with ML predictions"""

        try:
            logger.info(f"Getting Customer Segmentation summary with filters: {filters}")

            # Parse date filters
            date_filters = self._parse_date_filters(filters)

            # Get segmentation data from data service (NO SQL in processing layer!)
            segmentation_data = await self.data_service.get_segmentation_data(date_filters)

            # Convert to DataFrame - handle different response formats
            if isinstance(segmentation_data, dict):
                if 'data' in segmentation_data:
                    segmentation_df = pd.DataFrame(segmentation_data['data'])
                elif 'rows' in segmentation_data:
                    segmentation_df = pd.DataFrame(segmentation_data['rows'])
                else:
                    # If dict but no 'data' or 'rows' key, assume it's the data itself
                    segmentation_df = pd.DataFrame([segmentation_data]) if segmentation_data else pd.DataFrame()
            elif isinstance(segmentation_data, list):
                segmentation_df = pd.DataFrame(segmentation_data)
            else:
                segmentation_df = pd.DataFrame()

            if segmentation_df.empty:
                return self._get_empty_response()

            # Perform ML segmentation analysis
            ml_results = self.ml_predictor.perform_segmentation(segmentation_df)

            # Apply customer segment filters if provided
            if date_filters.get('segments'):
                ml_results = self._filter_by_segments(ml_results, date_filters['segments'])

            # Apply value category filters if provided
            if date_filters.get('value_categories'):
                ml_results = self._filter_by_value_categories(ml_results, date_filters['value_categories'])

            # Apply behavior type filters if provided
            if date_filters.get('behavior_types'):
                ml_results = self._filter_by_behavior_types(ml_results, date_filters['behavior_types'])

            # Generate visualizations data first (contains calculated segment values)
            visualizations = self._generate_visualizations_from_segmentation(
                segmentation_df, ml_results
            )

            # Calculate KPIs from visualizations (which have calculated segment data)
            segments = visualizations.get('segmentDistribution', [])
            most_valuable_segment = 'N/A'
            if segments:
                # Find highest avg_lifetime_value segment
                max_revenue_segment = max(segments, key=lambda x: x.get('avg_lifetime_value', 0))
                most_valuable_segment = max_revenue_segment.get('segment_name', 'N/A')

            kpis = {
                'totalSegments': len(segments),
                'largestSegmentSize': max([s.get('customer_count', 0) for s in segments], default=0) if segments else 0,
                'mostValuableSegment': most_valuable_segment,
                'avgSegmentValue': np.mean([s.get('avg_lifetime_value', 0) for s in segments]) if segments else 0,
                'segmentationQuality': self._calculate_segmentation_quality(ml_results)
            }

            # Generate rule-based insights (fast, always present)
            insights = self._generate_insights(ml_results, kpis)

            # Generate AI-powered insights (optional, with graceful fallback)
            ai_insights = self._generate_ai_insights(ml_results, kpis, filters)

            # Include customer data for BI Panel
            customers_list = []
            if not segmentation_df.empty:
                customers_list = segmentation_df.head(100).to_dict('records')  # Limit to 100 for performance

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
                'customers': customers_list,  # Add customers for BI Panel
                'metadata': {
                    'analysisDate': datetime.now().isoformat(),
                    'totalCustomers': len(segmentation_df),
                    'filters': filters,
                    'dataQuality': self._assess_segmentation_data_quality(segmentation_df)
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
        if 'customer_segmentation' == 'customer_segmentation':
            return self.ml_predictor.perform_segmentation(df)
        elif 'customer_segmentation' == 'customer_ltv':
            return self.ml_predictor.predict_ltv(df)
        elif 'customer_segmentation' == 'engagement_classifier':
            return self.ml_predictor.classify_engagement(df)
        elif 'customer_segmentation' == 'next_purchase' and transaction_df is not None:
            return self.ml_predictor.predict_next_purchase(df, transaction_df)
        else:
            return self.ml_predictor.analyze_data(df)

    def _calculate_kpis_from_segmentation(self, segmentation_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Calculate KPI metrics from segmentation data"""

        segments = ml_results.get('segments', [])

        # Find the most valuable segment by average revenue
        most_valuable_segment = 'N/A'
        if segments:
            logger.info(f"Segments for most valuable calculation: {len(segments)} segments")
            for i, seg in enumerate(segments[:3]):  # Log first 3 segments
                logger.info(f"Segment {i}: name={seg.get('segment_name', seg.get('name', 'NO_NAME'))}, avg_revenue={seg.get('avg_revenue', 0)}")

            max_revenue_segment = max(segments, key=lambda x: x.get('avg_lifetime_value', x.get('avg_revenue', 0)))
            most_valuable_segment = max_revenue_segment.get('segment_name', max_revenue_segment.get('name', 'N/A'))
            logger.info(f"Most valuable segment: {most_valuable_segment} with revenue {max_revenue_segment.get('avg_lifetime_value', max_revenue_segment.get('avg_revenue', 0))}")
        else:
            logger.warning("No segments found for most valuable calculation")

        kpis = {
            'totalSegments': len(segments),
            'largestSegmentSize': max([s['size'] for s in segments], default=0),
            'mostValuableSegment': most_valuable_segment,
            'avgSegmentValue': np.mean([s.get('avg_lifetime_value', s.get('avg_revenue', 0)) for s in segments]) if segments else 0,
            'segmentationQuality': self._calculate_segmentation_quality(ml_results)
        }

        return kpis

    def _calculate_kpis_from_segments(self, segments: List[Dict]) -> Dict:
        """Calculate KPI metrics from visualization segment data"""

        # Find the most valuable segment by average lifetime value
        most_valuable_segment = 'N/A'
        if segments:
            logger.info(f"Segments for KPI calculation: {len(segments)} segments")
            for i, seg in enumerate(segments[:3]):  # Log first 3 segments
                logger.info(f"Segment {i}: name={seg.get('segment_name')}, avg_lifetime_value={seg.get('avg_lifetime_value', 0)}")

            max_revenue_segment = max(segments, key=lambda x: x.get('avg_lifetime_value', 0))
            most_valuable_segment = max_revenue_segment.get('segment_name', 'N/A')
            logger.info(f"Most valuable segment: {most_valuable_segment} with avg_lifetime_value {max_revenue_segment.get('avg_lifetime_value', 0)}")
        else:
            logger.warning("No segments found for KPI calculation")

        kpis = {
            'totalSegments': len(segments),
            'largestSegmentSize': max([s.get('customer_count', 0) for s in segments], default=0),
            'mostValuableSegment': most_valuable_segment,
            'avgSegmentValue': np.mean([s.get('avg_lifetime_value', 0) for s in segments]) if segments else 0,
            'segmentationQuality': self._calculate_segmentation_quality_from_segments(segments)
        }

        return kpis

    def _calculate_segmentation_quality_from_segments(self, segments: List[Dict]) -> float:
        """Calculate segmentation quality score from segment data"""
        if not segments:
            return 0

        # Quality based on segment separation and balance
        sizes = [s.get('customer_count', 0) for s in segments]
        total = sum(sizes)

        if total == 0:
            return 0

        # Calculate balance score (how evenly distributed)
        expected_size = total / len(segments)
        balance_score = 1 - (np.std(sizes) / expected_size if expected_size > 0 else 1)

        return min(balance_score * 100, 100)

    def _calculate_segmentation_quality(self, ml_results: Dict) -> float:
        """Calculate segmentation quality score"""
        segments = ml_results.get('segments', [])
        if not segments:
            return 0

        # Quality based on segment separation and balance
        sizes = [s['size'] for s in segments]
        total = sum(sizes)

        # Calculate balance score (how evenly distributed)
        expected_size = total / len(segments)
        balance_score = 1 - (np.std(sizes) / expected_size if expected_size > 0 else 1)

        return min(balance_score * 100, 100)

    def _calculate_kpis(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                       loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Legacy KPI calculation - redirects to new method"""

        # This is kept for backward compatibility
        if 'customer_segmentation' == 'customer_segmentation':
            kpis = {
                'totalSegments': len(ml_results.get('segments', [])),
                'largestSegmentSize': max([s['size'] for s in ml_results.get('segments', [{}])], default=0),
                'avgSegmentValue': np.mean([s['avg_revenue'] for s in ml_results.get('segments', [{}])], default=0),
                'segmentationQuality': ml_results.get('quality_score', 0)
            }
        elif 'customer_segmentation' == 'customer_ltv':
            predictions = ml_results.get('predictions', [])
            if predictions:
                ltv_values = [p.get('predicted_ltv', 0) for p in predictions]
                kpis = {
                    'avgLTV': np.mean(ltv_values) if ltv_values else 0,
                    'totalLTV': np.sum(ltv_values) if ltv_values else 0,
                    'highValueCount': len([v for v in ltv_values if v > np.percentile(ltv_values, 75)]) if ltv_values else 0,
                    'ltvGrowth': 5.2  # Mock growth percentage
                }
        elif 'customer_segmentation' == 'purchase_frequency':
            kpis = {
                'avgPurchaseFrequency': transactions_df.groupby('customer_id').size().mean() if not transactions_df.empty else 0,
                'highFrequencyCustomers': len(transactions_df.groupby('customer_id').filter(lambda x: len(x) > 5)) if not transactions_df.empty else 0,
                'frequencyTrend': 3.8,  # Mock trend
                'retentionRate': 68.5  # Mock retention rate
            }
        elif 'customer_segmentation' == 'engagement_classifier':
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

    def _generate_visualizations_from_segmentation(self, segmentation_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Generate visualization data from segmentation results"""

        # Enhanced visualization data for comprehensive dashboard
        segments = ml_results.get('segments', [])

        # If no segments, create default ones based on data
        if not segments and not segmentation_df.empty:
            segments = self._create_default_segments(segmentation_df)
            ml_results['segments'] = segments

        # Process individual customer data for scatter plot - AFTER segments are assigned
        segment_data = []
        if not segmentation_df.empty:
            # Make a copy to avoid modifying original
            df_copy = segmentation_df.copy()

            # Check if ML predictor successfully added segment_name column
            if 'segment_name' not in df_copy.columns:
                logger.warning("segment_name column missing after ML processing - applying segment names from ML results")

                # Create mapping from cluster id to segment name from ML results
                segments = ml_results.get('segments', [])
                if segments and 'segment' in df_copy.columns:
                    # Create segment mapping by analyzing the segments
                    segment_mapping = {}
                    for segment in segments:
                        # Find customers in this segment and map their cluster IDs
                        segment_name = segment.get('segment_name', 'Unknown')
                        if segment_name != 'Unknown' and segment.get('size', 0) > 0:
                            # Since we know the segment stats, we need to map cluster IDs to segment names
                            # For now, create a simple mapping based on segment order
                            segment_id = segment.get('segment_id', len(segment_mapping))
                            segment_mapping[segment_id] = segment_name

                    # Apply the mapping
                    df_copy['segment_name'] = df_copy['segment'].map(segment_mapping).fillna('Unknown')
                    logger.info(f"Applied segment mapping: {segment_mapping}")
                    logger.info(f"Segment distribution after mapping: {df_copy['segment_name'].value_counts().to_dict()}")
                else:
                    logger.warning("No valid segments found in ML results - setting all to Unknown")
                    df_copy['segment_name'] = 'Unknown'
            else:
                logger.info(f"segment_name column exists. Distribution: {df_copy['segment_name'].value_counts().to_dict()}")

            sample_size = min(len(df_copy), 2000)  # Limit for performance
            sampled_df = df_copy.sample(n=sample_size) if len(df_copy) > sample_size else df_copy

            for _, row in sampled_df.iterrows():
                segment_data.append({
                    'customer_id': row.get('customer_id', ''),
                    'customer_name': row.get('customer_name', f"Customer {row.get('customer_id', '')}"),
                    'segment_name': row.get('segment_name', 'Unknown'),
                    'rfm_rl_score': row.get('rfm_score', row.get('recency', 0) * 0.3 + row.get('frequency', 0) * 0.3 + row.get('monetary_value', 0) * 0.4),
                    'lifetime_value': row.get('monetary_value', 0),
                    'avg_order_value': row.get('monetary_value', 0) / max(row.get('frequency', 1), 1),
                    'transaction_count': row.get('frequency', 0),
                    'days_since_last_activity': row.get('recency', 0),
                    'total_spend': row.get('monetary_value', 0)
                })

        # Enhanced segment distribution with all 9 metrics - ensure unique values per segment
        segment_distribution = []
        segment_comparison = []

        for i, s in enumerate(segments):
            # Use actual segment data to create unique metrics
            seg_name = s.get('segment_name', s.get('name', f'Segment {i+1}'))

            # Calculate unique metrics based on segment characteristics
            avg_revenue = s.get('avg_revenue', 0)
            avg_transactions = s.get('avg_transactions', 0)
            avg_recency = s.get('avg_recency', 30)
            avg_rfm = s.get('avg_rfm_score', 50)

            segment_metrics = {
                'segment_name': seg_name,
                'customer_count': s.get('size', 0),
                'percentage': s.get('percentage', 0),
                'avg_lifetime_value': avg_revenue,
                'avg_order_value': avg_revenue / max(avg_transactions, 1),
                'avg_frequency': avg_transactions,
                'avg_recency': avg_recency,
                'transaction_count': s.get('total_transactions', s.get('size', 0) * avg_transactions),
                'rfm_rl_score': avg_rfm,
                'total_spend': s.get('total_revenue', avg_revenue * s.get('size', 0)),
                'days_since_last_activity': avg_recency,
                'color': self._get_segment_color(seg_name)
            }
            segment_distribution.append(segment_metrics)
            segment_comparison.append(segment_metrics)

        # KPI data
        kpi_data = {
            'total_segments': len(segments),
            'largest_segment_size': max([s.get('size', 0) for s in segments], default=0),
            'most_valuable_segment': max(segments, key=lambda x: x.get('avg_revenue', 0)).get('segment_name', max(segments, key=lambda x: x.get('avg_revenue', 0)).get('name', 'N/A')) if segments else 'N/A',
            'segmentation_quality': ml_results.get('quality_score', 85),  # Default quality score
            'avg_segment_value': np.mean([s.get('avg_revenue', 0) for s in segments]) if segments else 0,
            'total_customers': len(segmentation_df),
            'segment_stability': 92  # Stability index
        }

        return {
            'segmentDistribution': segment_distribution,
            'segmentComparison': segment_comparison,
            'segmentData': segment_data,  # Individual customer data for scatter plot
            'kpiData': kpi_data,
            'segmentCharacteristics': self._create_segment_characteristics_chart(ml_results),
            'featureImportance': ml_results.get('feature_importance', []),
            'segmentMatrix': self._create_segment_matrix(ml_results)
        }

    def _create_default_segments(self, segmentation_df: pd.DataFrame) -> List[Dict]:
        """Create default segments when ML predictor returns empty"""
        segments = []

        # Define all 8 default segments based on RFM analysis (matching filter dropdown)
        default_segments = [
            {'name': 'Champions', 'min_score': 87.5, 'max_score': 101},
            {'name': 'Loyal Customers', 'min_score': 75, 'max_score': 87.5},
            {'name': 'Potential Loyalists', 'min_score': 62.5, 'max_score': 75},
            {'name': 'New Customers', 'min_score': 50, 'max_score': 62.5},
            {'name': 'At Risk', 'min_score': 37.5, 'max_score': 50},
            {'name': "Can't Lose Them", 'min_score': 25, 'max_score': 37.5},
            {'name': 'Hibernating', 'min_score': 12.5, 'max_score': 25},
            {'name': 'Lost', 'min_score': 0, 'max_score': 12.5}
        ]

        # Calculate RFM scores if not present
        if 'rfm_score' not in segmentation_df.columns:
            # Normalize values to 0-100 scale
            if 'recency' in segmentation_df.columns and not segmentation_df['recency'].isna().all():
                # Lower recency is better (more recent)
                min_recency = segmentation_df['recency'].min()
                max_recency = segmentation_df['recency'].max()
                if max_recency > min_recency:
                    segmentation_df['recency_score'] = 100 - ((segmentation_df['recency'] - min_recency) / (max_recency - min_recency) * 100)
                else:
                    segmentation_df['recency_score'] = 50
            else:
                segmentation_df['recency_score'] = 50

            if 'frequency' in segmentation_df.columns and not segmentation_df['frequency'].isna().all():
                # Higher frequency is better
                min_freq = segmentation_df['frequency'].min()
                max_freq = segmentation_df['frequency'].max()
                if max_freq > min_freq:
                    segmentation_df['frequency_score'] = ((segmentation_df['frequency'] - min_freq) / (max_freq - min_freq) * 100)
                else:
                    segmentation_df['frequency_score'] = 50
            else:
                segmentation_df['frequency_score'] = 50

            if 'monetary_value' in segmentation_df.columns and not segmentation_df['monetary_value'].isna().all():
                # Higher monetary value is better
                min_monetary = segmentation_df['monetary_value'].min()
                max_monetary = segmentation_df['monetary_value'].max()
                if max_monetary > min_monetary:
                    segmentation_df['monetary_score'] = ((segmentation_df['monetary_value'] - min_monetary) / (max_monetary - min_monetary) * 100)
                else:
                    segmentation_df['monetary_score'] = 50
            else:
                segmentation_df['monetary_score'] = 50

            # Calculate weighted RFM score
            segmentation_df['rfm_score'] = (
                segmentation_df['recency_score'] * 0.3 +
                segmentation_df['frequency_score'] * 0.3 +
                segmentation_df['monetary_score'] * 0.4
            )

        # Assign segment names to each customer based on RFM scores
        for seg_def in default_segments:
            mask = (segmentation_df['rfm_score'] >= seg_def['min_score']) & \
                   (segmentation_df['rfm_score'] < seg_def['max_score'])
            segmentation_df.loc[mask, 'segment_name'] = seg_def['name']

            seg_customers = segmentation_df[mask]

            if not seg_customers.empty:
                # Calculate actual metrics for this segment
                segments.append({
                    'segment_id': len(segments) + 1,
                    'segment_name': seg_def['name'],
                    'name': seg_def['name'],  # Include both for compatibility
                    'size': len(seg_customers),
                    'percentage': (len(seg_customers) / len(segmentation_df)) * 100,
                    'avg_revenue': float(seg_customers['monetary_value'].mean()) if 'monetary_value' in seg_customers.columns else 0,
                    'avg_transactions': float(seg_customers['frequency'].mean()) if 'frequency' in seg_customers.columns else 0,
                    'avg_recency': float(seg_customers['recency'].mean()) if 'recency' in seg_customers.columns else 30,
                    'avg_rfm_score': float(seg_customers['rfm_score'].mean()) if 'rfm_score' in seg_customers.columns else 50,
                    'total_revenue': float(seg_customers['monetary_value'].sum()) if 'monetary_value' in seg_customers.columns else 0,
                    'total_transactions': float(seg_customers['frequency'].sum()) if 'frequency' in seg_customers.columns else 0
                })

        return segments

    def _filter_by_segments(self, ml_results: Dict, segment_names: List[str]) -> Dict:
        """Filter ML results by selected segment names"""
        if not segment_names:
            return ml_results

        # Map filter values to actual segment names
        segment_map = {
            'champions': 'Champions',
            'loyal_customers': 'Loyal Customers',
            'potential_loyalists': 'Potential Loyalists',
            'new_customers': 'New Customers',
            'at_risk': 'At Risk',
            'cant_lose_them': "Can't Lose Them",
            'hibernating': 'Hibernating',
            'lost': 'Lost'
        }

        selected_segments = [segment_map.get(s, s) for s in segment_names]

        # Filter segments in ML results
        if 'segments' in ml_results:
            ml_results['segments'] = [
                s for s in ml_results['segments']
                if s.get('segment_name') in selected_segments
            ]

        return ml_results

    def _filter_by_value_categories(self, ml_results: Dict, value_categories: List[str]) -> Dict:
        """Filter ML results by value categories"""
        if not value_categories:
            return ml_results

        # Map filter values to value ranges
        value_map = {
            'high_value': (10000, float('inf')),
            'medium_high_value': (5000, 10000),
            'medium_value': (2000, 5000),
            'medium_low_value': (500, 2000),
            'low_value': (0, 500)
        }

        # Filter segments by average revenue
        if 'segments' in ml_results:
            filtered_segments = []
            for segment in ml_results['segments']:
                avg_revenue = segment.get('avg_revenue', 0)
                for category in value_categories:
                    min_val, max_val = value_map.get(category, (0, float('inf')))
                    if min_val <= avg_revenue < max_val:
                        filtered_segments.append(segment)
                        break
            ml_results['segments'] = filtered_segments

        return ml_results

    def _filter_by_behavior_types(self, ml_results: Dict, behavior_types: List[str]) -> Dict:
        """Filter ML results by behavior types"""
        if not behavior_types:
            return ml_results

        # Map filter values to frequency ranges (transactions per month)
        behavior_map = {
            'frequent_purchasers': (10, float('inf')),
            'regular_purchasers': (5, 10),
            'occasional_purchasers': (2, 5),
            'rare_purchasers': (0.5, 2),
            'new_purchasers': (0, 1),
            'inactive': (0, 0.1)
        }

        # Filter segments by average transactions
        if 'segments' in ml_results:
            filtered_segments = []
            for segment in ml_results['segments']:
                avg_transactions = segment.get('avg_transactions', 0)
                for behavior in behavior_types:
                    min_val, max_val = behavior_map.get(behavior, (0, float('inf')))
                    if min_val <= avg_transactions < max_val:
                        filtered_segments.append(segment)
                        break
            ml_results['segments'] = filtered_segments

        return ml_results

    def _get_empty_response(self) -> Dict:
        """Return empty response structure when no data is available"""
        return {
            'kpiMetrics': {
                'total_segments': 0,
                'largest_segment_size': 0,
                'most_valuable_segment': 'N/A',
                'segmentation_quality': 0,
                'avg_segment_value': 0,
                'total_customers': 0,
                'segment_stability': 0
            },
            'mainData': {
                'kpiData': {
                    'total_segments': 0,
                    'largest_segment_size': 0,
                    'most_valuable_segment': 'N/A',
                    'segmentation_quality': 0
                },
                'segmentData': [],
                'segmentDistribution': [],
                'segmentComparison': []
            },
            'mlResults': {},
            'insights': ['No data available for the selected filters'],
            'metadata': {
                'analysisDate': datetime.now().isoformat(),
                'dataCount': 0,
                'processingTime': 0
            }
        }

    def _get_segment_color(self, segment_name: str) -> str:
        """Get color for segment visualization with vibrant soft pastel colors"""
        segment_colors = {
            'Champions': '#10b981',           # Vibrant emerald green
            'Loyal Customers': '#8b5cf6',     # Vibrant purple
            'Potential Loyalists': '#f59e0b', # Vibrant amber
            'New Customers': '#ec4899',       # Vibrant pink
            'At Risk': '#ef4444',            # Vibrant red
            "Can't Lose Them": '#dc2626',    # Dark red
            'Hibernating': '#6366f1',        # Vibrant indigo
            'Lost': '#6b7280',              # Gray (intentionally less vibrant)
            'Segment 1': '#10b981',          # Map generic names to vibrant colors
            'Segment 2': '#8b5cf6',
            'Segment 3': '#f59e0b',
            'Segment 4': '#ec4899',
            'Segment 5': '#ef4444',
            'Segment 6': '#dc2626',
            'Segment 7': '#6366f1',
            'Segment 8': '#6b7280',
            'Unknown': '#94a3b8',
            'High Value': '#10b981',
            'Medium Value': '#f59e0b',
            'Low Value': '#6b7280'
        }
        return segment_colors.get(segment_name, '#8b5cf6')

    def _assess_segmentation_data_quality(self, segmentation_df: pd.DataFrame) -> Dict:
        """Assess data quality for segmentation data"""

        quality = {
            'completeness': 100.0,
            'accuracy': 100.0,
            'consistency': 100.0
        }

        if not segmentation_df.empty:
            # Check for missing values in critical fields
            critical_fields = ['customer_id', 'recency', 'frequency', 'monetary_value']
            existing_fields = [f for f in critical_fields if f in segmentation_df.columns]

            if existing_fields:
                null_percentage = segmentation_df[existing_fields].isnull().sum().sum()
                total_values = len(segmentation_df) * len(existing_fields)
                quality['completeness'] = 100 - (null_percentage / total_values * 100 if total_values > 0 else 0)

            # Check data consistency
            if 'monetary_value' in segmentation_df.columns:
                invalid_amounts = (segmentation_df['monetary_value'] < 0).sum()
                quality['consistency'] = 100 - (invalid_amounts / len(segmentation_df) * 100)

        return quality

    def _generate_visualizations(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                                loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Generate data for dashboard visualizations"""

        visualizations = {}

        # Generate based on dashboard type
        if 'customer_segmentation' == 'customer_segmentation':
            visualizations = {
                'segmentDistribution': self._create_segment_distribution_chart(ml_results),
                'segmentCharacteristics': self._create_segment_characteristics_chart(ml_results),
                'featureImportance': ml_results.get('feature_importance', []),
                'segmentMatrix': self._create_segment_matrix(ml_results)
            }
        elif 'customer_segmentation' == 'customer_ltv':
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
        """Generate enhanced insights with actionable recommendations"""

        insights = []

        # Generate insights based on dashboard type
        if 'customer_segmentation' == 'customer_segmentation':
            segments = ml_results.get('segments', [])
            if segments and len(segments) > 0:
                # Largest segment insights
                largest_segment = max(segments, key=lambda x: x['size'])
                segment_name = largest_segment.get('segment_name', largest_segment.get('segment_id', 'Unknown'))
                segment_size = largest_segment['size']
                segment_pct = largest_segment['percentage']

                insights.append(
                    f"DOMINANT SEGMENT: {segment_name} represents {segment_pct:.1f}% of customer base ({segment_size:,} customers). "
                    f"**Action:** Tailor primary marketing campaigns and product features to this segment's needs. "
                    f"Analyze their behavior patterns to inform product roadmap. Expected impact: 15-20% increase in engagement."
                )

                # Highest value segment
                highest_value_segment = max(segments, key=lambda x: x['avg_revenue'])
                value_seg_name = highest_value_segment.get('segment_name', highest_value_segment.get('segment_id', 'Unknown'))
                avg_revenue = highest_value_segment['avg_revenue']
                value_seg_size = highest_value_segment.get('size', 0)

                insights.append(
                    f"HIGH-VALUE SEGMENT: {value_seg_name} generates ${avg_revenue:,.2f} average revenue per customer ({value_seg_size} customers). "
                    f"**Action:** Implement VIP program with dedicated account management, exclusive features, and priority support. "
                    f"Create upsell/cross-sell campaigns targeting similar characteristics. Potential revenue uplift: ${avg_revenue * value_seg_size * 0.25:,.0f} annually."
                )

                # Segment diversity insight
                if len(segments) >= 3:
                    total_revenue = sum(s['avg_revenue'] * s['size'] for s in segments)
                    revenue_concentration = (highest_value_segment['avg_revenue'] * highest_value_segment['size']) / total_revenue if total_revenue > 0 else 0

                    if revenue_concentration > 0.5:
                        insights.append(
                            f"REVENUE CONCENTRATION: {revenue_concentration*100:.1f}% of revenue from {value_seg_name} segment creates dependency risk. "
                            f"**Action:** Develop growth strategies for underperforming segments. Launch targeted campaigns to upgrade customers from lower-value segments. "
                            f"Diversification goal: Reduce concentration to <40% over 6 months."
                        )

                # Growth opportunity segments
                low_engagement_segments = [s for s in segments if s['avg_revenue'] < (kpis.get('avgRevenue', 0) * 0.7) and s['size'] > (kpis.get('totalCustomers', 0) * 0.1)]
                if low_engagement_segments:
                    opp_segment = low_engagement_segments[0]
                    opp_name = opp_segment.get('segment_name', opp_segment.get('segment_id', 'Unknown'))
                    potential_uplift = (kpis.get('avgRevenue', 0) - opp_segment['avg_revenue']) * opp_segment['size']

                    insights.append(
                        f"GROWTH OPPORTUNITY: {opp_name} segment ({opp_segment['size']:,} customers) shows ${potential_uplift:,.0f} revenue expansion potential. "
                        f"**Action:** Launch engagement campaign with personalized product recommendations and limited-time offers. "
                        f"Analyze barriers to purchase and address through targeted content. Expected conversion lift: 30-35%."
                    )

        elif 'customer_segmentation' == 'customer_ltv':
            if kpis.get('avgLTV', 0) > 0:
                insights.append(f"Average customer lifetime value is ${kpis['avgLTV']:.2f}")
            if kpis.get('highValueCount', 0) > 0:
                insights.append(f"{kpis['highValueCount']} customers are classified as high-value (top 25%)")

        elif 'customer_segmentation' == 'engagement_classifier':
            if kpis.get('highlyEngaged', 0) > 0:
                insights.append(f"{kpis['highlyEngaged']} customers are highly engaged")
            if kpis.get('atRiskCount', 0) > 0:
                insights.append(f"{kpis['atRiskCount']} customers are at risk and need attention")

        # Add strategic recommendations
        if len(insights) > 0:
            total_customers = kpis.get('totalCustomers', 0)
            insights.append(
                f"STRATEGIC ACTIONS: Continuously monitor segment performance and migration patterns. "
                f"Re-segment quarterly to identify emerging customer groups. Measure campaign effectiveness by segment. "
                f"Goal: Increase average segment value by 20% and reduce churn in bottom segments by 25% over next quarter."
            )

        # Add general insights if nothing specific was generated
        if not insights:
            insights = [
                "INFO: Segmentation analysis completed successfully",
                f"INFO: Processed data for {kpis.get('totalCustomers', 0):,} customers across all segments",
                "INFO: ML-powered segmentation ready for targeted marketing and personalization strategies"
            ]

        return insights

    def _generate_ai_insights(self, ml_results: Dict, kpis: Dict, filters: Dict) -> List[str]:
        """Generate AI-powered insights using Gemini (hybrid approach)

        This supplements rule-based insights with creative AI analysis.
        Failures gracefully fall back to empty list without breaking the response.
        """
        try:
            # Import here to avoid breaking if module not available
            from lib.ai_insights_generator import generate_ai_insights

            segments = ml_results.get('segments', [])
            if not segments:
                return []

            # Calculate key metrics
            total_customers = kpis.get('totalCustomers', 0)
            segment_count = len(segments)

            # Find largest segment
            largest_segment = max(segments, key=lambda x: x.get('size', 0))
            largest_segment_name = largest_segment.get('segment_name', largest_segment.get('segment_id', 'Unknown'))
            largest_segment_size = largest_segment.get('size', 0)
            largest_segment_pct = largest_segment.get('percentage', 0)

            # Find highest value segment
            highest_value_segment = max(segments, key=lambda x: x.get('avg_revenue', 0))
            highest_value_name = highest_value_segment.get('segment_name', highest_value_segment.get('segment_id', 'Unknown'))
            avg_segment_revenue = highest_value_segment.get('avg_revenue', 0)

            # Calculate revenue concentration
            total_revenue = sum(s.get('avg_revenue', 0) * s.get('size', 0) for s in segments)
            top_segment_revenue = highest_value_segment.get('avg_revenue', 0) * highest_value_segment.get('size', 0)
            revenue_concentration_pct = (top_segment_revenue / total_revenue * 100) if total_revenue > 0 else 0

            # Build segment breakdown
            segment_breakdown = ""
            for seg in segments[:5]:  # Top 5 segments
                seg_name = seg.get('segment_name', seg.get('segment_id', 'Unknown'))
                seg_size = seg.get('size', 0)
                seg_revenue = seg.get('avg_revenue', 0)
                segment_breakdown += f"- {seg_name}: {seg_size:,} customers, ${seg_revenue:,.0f} avg revenue\n"

            # Find growth opportunity segments
            avg_revenue = sum(s.get('avg_revenue', 0) for s in segments) / len(segments) if segments else 0
            low_engagement = [s for s in segments if s.get('avg_revenue', 0) < avg_revenue * 0.7]
            growth_segments = ", ".join([s.get('segment_name', s.get('segment_id', 'Unknown')) for s in low_engagement[:3]])

            # Get time period from filters
            time_period = f"{filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}"

            # Prepare KPIs for prompt
            ai_kpis = {
                'total_customers': total_customers,
                'segment_count': segment_count,
                'largest_segment_name': largest_segment_name,
                'largest_segment_size': largest_segment_size,
                'largest_segment_pct': largest_segment_pct,
                'highest_value_segment': highest_value_name,
                'avg_segment_revenue': avg_segment_revenue,
                'revenue_concentration_pct': revenue_concentration_pct,
                'avg_revenue': avg_revenue,
                'min_revenue': min(s.get('avg_revenue', 0) for s in segments) if segments else 0,
                'max_revenue': max(s.get('avg_revenue', 0) for s in segments) if segments else 0,
                'growth_segments': growth_segments,
                'time_period': time_period
            }

            # Prepare data summary
            data_summary = {
                'segment_breakdown': segment_breakdown
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='customer_segmentation',
                kpis=ai_kpis,
                data_summary=data_summary,
                filters=filters
            )

            print(f"[CustomerSegmentationService] Generated {len(ai_insights)} AI insights")
            return ai_insights

        except ImportError as e:
            print(f"[CustomerSegmentationService] AI insights module not available: {e}")
            return []
        except Exception as e:
            print(f"[CustomerSegmentationService] Error generating AI insights: {e}")
            return []  # Graceful fallback - don't break the response

    def _parse_date_filters(self, filters: Dict) -> Dict:
        """Parse and validate date filters"""

        parsed = filters.copy()

        # Handle date range - support both dateFrom/dateTo and date_from/date_to
        if 'dateFrom' in parsed:
            parsed['date_from'] = parsed.pop('dateFrom')
        if 'dateTo' in parsed:
            parsed['date_to'] = parsed.pop('dateTo')

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

        # Handle additional filters
        if 'customerSegments' in parsed:
            parsed['segments'] = parsed.pop('customerSegments')
        if 'valueCategories' in parsed:
            parsed['value_categories'] = parsed.pop('valueCategories')
        if 'behaviorTypes' in parsed:
            parsed['behavior_types'] = parsed.pop('behaviorTypes')

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
