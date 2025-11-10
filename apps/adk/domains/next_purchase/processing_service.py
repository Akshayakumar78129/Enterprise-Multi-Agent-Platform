"""
Next Purchase Predictor Processing Service
Complete implementation following ChurnPredictionService pattern
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import json

from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import NextPurchaseDataService
from .ml_predictor import NextPurchaseMLPredictor

logger = logging.getLogger(__name__)


def convert_numpy_types(obj):
    """Convert numpy types to native Python types for JSON serialization"""
    if isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return convert_numpy_types(obj.tolist())
    elif isinstance(obj, (pd.Timestamp, datetime)):
        return obj.isoformat() if hasattr(obj, 'isoformat') else str(obj)
    elif pd.isna(obj):
        return None
    elif hasattr(obj, 'item'):  # Catch any remaining numpy scalars
        return obj.item()
    else:
        return obj


class NextPurchaseService:
    """Processing service for Next purchase time and product prediction"""

    def __init__(self):
        """Initialize the service with data service and ML predictor"""
        self.data_service = NextPurchaseDataService()
        self.ml_predictor = NextPurchaseMLPredictor()
        logger.info(f"{self.__class__.__name__} initialized")

    @cache_dashboard_endpoint(dashboard_type='next-purchase', ttl=300)
    async def get_dashboard_summary(self, filters: Dict = {}) -> Dict:
        """Get Next Purchase Predictor dashboard summary with ML predictions"""

        try:
            logger.info(f"Getting Next Purchase Predictor summary with filters: {filters}")

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

            # Generate hybrid insights (rule-based + AI)
            rule_based_insights = self._generate_insights(ml_results, kpis)
            ai_insights = await self._get_cached_ai_insights(ml_results, kpis, filters)

            # Combine into unified insights array (hybrid approach)
            combined_insights = rule_based_insights + ai_insights

            result = {
                'kpiMetrics': kpis,
                'mainData': visualizations,
                'mlResults': ml_results,
                'insights': combined_insights,  # Unified hybrid insights
                'insights_metadata': {
                    'total_count': len(combined_insights),
                    'rule_based_count': len(rule_based_insights),
                    'ai_count': len(ai_insights),
                    'insights_version': 'unified_v2'
                },
                'metadata': {
                    'analysisDate': datetime.now().isoformat(),
                    'totalCustomers': len(customers_df),
                    'totalTransactions': len(transactions_df),
                    'filters': filters,
                    'dataQuality': self._assess_data_quality(customers_df, transactions_df)
                }
            }

            # Convert all numpy types to native Python types for JSON serialization
            return convert_numpy_types(result)

        except Exception as e:
            logger.error(f"Error in get_dashboard_summary: {str(e)}", exc_info=True)
            return self._get_error_response(str(e))

    def _perform_ml_analysis(self, df: pd.DataFrame, transaction_df: pd.DataFrame = None) -> Dict:
        """Perform ML analysis specific to this dashboard"""

        if df.empty:
            return self._get_empty_ml_results()

        # Call appropriate ML predictor method based on dashboard
        if 'next_purchase' == 'customer_segmentation':
            return self.ml_predictor.perform_segmentation(df)
        elif 'next_purchase' == 'customer_ltv':
            return self.ml_predictor.predict_ltv(df)
        elif 'next_purchase' == 'engagement_classifier':
            return self.ml_predictor.classify_engagement(df)
        elif 'next_purchase' == 'next_purchase' and transaction_df is not None:
            return self.ml_predictor.predict_next_purchase(df, transaction_df)
        else:
            return self.ml_predictor.analyze_data(df)

    def _calculate_kpis(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                       loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Calculate KPI metrics for Next Purchase Predictor"""

        predictions = ml_results.get('predictions', [])

        if not predictions:
            return {
                'totalPredictions': 0,
                'highProbability': 0,
                'avgDays': 0,
                'accuracy': '0%',
                'predictedRevenue30d': 0,
                'highIntentCustomers': 0,
                'customersWithin7d': 0,
                'confidenceIndex': 0,
                'crossSellRate': 0,
                'avgPredictedDays': 0,
                'activeCustomers': len(customers_df)
            }

        # Calculate next purchase specific KPIs
        total_predictions = int(len(predictions))
        high_intent = int(len([p for p in predictions if p.get('probability', 0) >= 0.7]))
        customers_within_7d = int(len([p for p in predictions if p.get('days_to_purchase', 999) <= 7]))

        # Use float() on np.mean() results to ensure native Python types
        avg_days_raw = np.mean([p.get('days_to_purchase', 0) for p in predictions])
        avg_days = float(avg_days_raw) if not pd.isna(avg_days_raw) else 0.0

        confidence_raw = np.mean([p.get('probability', 0) for p in predictions])
        confidence_index = float(confidence_raw) if not pd.isna(confidence_raw) else 0.0

        # Calculate predicted revenue (30 day window)
        revenue_30d = float(sum([
            p.get('probability', 0) * p.get('predicted_amount', 0)
            for p in predictions
            if p.get('days_to_purchase', 999) <= 30
        ]))

        # Calculate cross-sell rate (predictions for products customer hasn't bought)
        cross_sell_count = int(len([p for p in predictions if p.get('is_cross_sell', False)]))
        cross_sell_rate = float((cross_sell_count / total_predictions * 100)) if total_predictions > 0 else 0.0

        # Model accuracy (from ML results)
        accuracy = ml_results.get('model_accuracy', 0)
        accuracy_pct = f"{accuracy * 100:.1f}%" if isinstance(accuracy, (int, float)) else "N/A"

        # Calculate Model Ops secondary metrics
        product_counts = {}
        for p in predictions:
            prod = p.get('predicted_product', 'Unknown')
            product_counts[prod] = product_counts.get(prod, 0) + 1

        top_demand_product = max(product_counts.items(), key=lambda x: x[1]) if product_counts else ('N/A', 0)
        top_demand_share = float((top_demand_product[1] / total_predictions * 100)) if total_predictions > 0 else 0

        total_customers = int(len(customers_df))
        prediction_coverage = float((len(set([p.get('customer_id') for p in predictions])) / total_customers * 100)) if total_customers > 0 else 0

        # Calculate average purchase window from transactions
        avg_purchase_window = 0
        date_col = 'txn_date' if 'txn_date' in transactions_df.columns else 'date'

        if not transactions_df.empty and 'customer_id' in transactions_df.columns and date_col in transactions_df.columns:
            try:
                # Make a copy to avoid modifying the original
                txn_copy = transactions_df.copy()
                txn_copy[date_col] = pd.to_datetime(txn_copy[date_col], errors='coerce')

                # Remove rows with invalid dates
                txn_copy = txn_copy.dropna(subset=[date_col])

                if len(txn_copy) > 0:
                    # Calculate gaps between consecutive purchases per customer
                    customer_gaps = txn_copy.sort_values(['customer_id', date_col]).groupby('customer_id')[date_col].diff().dt.days

                    # Filter out NaN values (first purchase per customer has no gap) and zero-day gaps (same-day purchases)
                    valid_gaps = customer_gaps.dropna()
                    valid_gaps = valid_gaps[valid_gaps > 0]  # Exclude same-day purchases

                    if len(valid_gaps) > 0:
                        median_gap = valid_gaps.median()
                        avg_purchase_window = int(median_gap) if not pd.isna(median_gap) else 0
            except Exception as e:
                logger.error(f"[Purchase Window] Error calculating: {e}", exc_info=True)

        kpis = {
            # Primary KPIs (for tiles - 7 total)
            'totalPredictions': total_predictions,
            'highProbability': high_intent,
            'avgDays': int(avg_days),
            'accuracy': accuracy_pct,

            # Detailed KPIs (for enhanced tiles)
            'predictedRevenue30d': revenue_30d,
            'highIntentCustomers': high_intent,
            'customersWithin7d': customers_within_7d,
            'confidenceIndex': confidence_index,
            'crossSellRate': cross_sell_rate,
            'avgPredictedDays': int(avg_days),
            'activeCustomers': int(len(customers_df)),

            # Model Ops Secondary Metrics (for panel below KPIs)
            'topDemandProduct': str(top_demand_product[0]),
            'topDemandShare': round(top_demand_share, 1),
            'predictionCoverage': round(prediction_coverage, 1),
            'totalCustomers': total_customers,
            'avgPurchaseWindow': avg_purchase_window,

            # Trend indicators (can be calculated from historical data later)
            'revenueTrend': 'up',
            'intentTrend': 'stable',
            'confidenceTrend': 'up'
        }

        return kpis

    def _generate_visualizations(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame,
                                loyalty_df: pd.DataFrame, ml_results: Dict) -> Dict:
        """Generate data for Next Purchase Predictor visualizations"""

        predictions = ml_results.get('predictions', [])

        visualizations = {
            # Top predictions for table display
            'predictions': predictions[:50] if predictions else [],  # Top 50 predictions
            'nextPurchasePredictions': predictions[:50] if predictions else [],  # Alias for backward compatibility

            # Purchase probability distribution
            'probabilityDistribution': self._create_probability_distribution(predictions),
            'purchaseProbability': self._create_probability_distribution(predictions),  # Alias

            # Recommended products (aggregated by product)
            'recommendedProducts': self._create_product_recommendations(predictions),

            # Timing forecast (grouped by time buckets)
            'timingForecast': self._create_timing_forecast(predictions),

            # Purchase timing predictor (top 12 individual predictions)
            'purchaseTiming': self._create_purchase_timing_data(predictions),
            'purchaseTimingData': self._create_purchase_timing_data(predictions),  # Alias

            # Feature importance (from ML model)
            'featureImportance': ml_results.get('feature_importance', []),

            # Phase 7: Advanced visualizations
            'affinityNetwork': self._create_product_affinity_network(predictions, transactions_df),
            'productAffinityNetwork': self._create_product_affinity_network(predictions, transactions_df),  # Alias
            'confidenceMatrix': self._create_confidence_matrix(predictions),

            # Category performance with sparklines
            'categoryPerformance': self._create_category_performance(predictions, transactions_df),
            'categoryRevenueSeries': self._create_category_revenue_series(predictions, transactions_df),
            'categorySeries': self._create_category_revenue_series(predictions, transactions_df),  # Alias

            # Additional data for advanced visualizations
            'probabilityBySegment': self._create_probability_by_segment(predictions, customers_df),
            'timeDistribution': self._create_time_distribution(predictions),

            # Customer timeline data (for journey visualization - keyed by customer_id)
            'customerTimeline': self._create_customer_timeline_data(predictions, transactions_df),
            'customerJourneys': self._create_customer_timeline_data(predictions, transactions_df)  # Alias
        }

        return visualizations

    def _create_probability_distribution(self, predictions: List[Dict]) -> Dict:
        """Create probability distribution histogram data"""
        if not predictions:
            return {'bins': [], 'counts': []}

        probabilities = [p.get('probability', 0) for p in predictions]
        bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
        counts, _ = np.histogram(probabilities, bins=bins)

        return {
            'bins': ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
            'counts': counts.tolist(),
            'mean': float(np.mean(probabilities)),
            'median': float(np.median(probabilities)),
            'std': float(np.std(probabilities))
        }

    def _create_product_recommendations(self, predictions: List[Dict]) -> List[Dict]:
        """Aggregate predictions by product"""
        if not predictions:
            return []

        product_stats = {}
        for p in predictions:
            product = p.get('predicted_product', 'Unknown')
            if product not in product_stats:
                product_stats[product] = {
                    'product': product,
                    'predictionCount': 0,
                    'avgProbability': 0,
                    'totalProbability': 0,
                    'estimatedRevenue': 0
                }

            product_stats[product]['predictionCount'] += 1
            product_stats[product]['totalProbability'] += p.get('probability', 0)
            product_stats[product]['estimatedRevenue'] += p.get('probability', 0) * p.get('predicted_amount', 0)

        # Calculate averages and sort
        result = []
        for stats in product_stats.values():
            stats['avgProbability'] = stats['totalProbability'] / stats['predictionCount']
            del stats['totalProbability']
            result.append(stats)

        return sorted(result, key=lambda x: x['estimatedRevenue'], reverse=True)[:10]

    def _create_timing_forecast(self, predictions: List[Dict]) -> List[Dict]:
        """Group predictions by time buckets"""
        if not predictions:
            return []

        buckets = {
            '0-7 days': {'min': 0, 'max': 7, 'count': 0, 'revenue': 0, 'customers': []},
            '8-14 days': {'min': 8, 'max': 14, 'count': 0, 'revenue': 0, 'customers': []},
            '15-30 days': {'min': 15, 'max': 30, 'count': 0, 'revenue': 0, 'customers': []},
            '31-60 days': {'min': 31, 'max': 60, 'count': 0, 'revenue': 0, 'customers': []},
            '60+ days': {'min': 61, 'max': 999, 'count': 0, 'revenue': 0, 'customers': []}
        }

        for p in predictions:
            days = p.get('days_to_purchase', 999)
            for bucket_name, bucket_data in buckets.items():
                if bucket_data['min'] <= days <= bucket_data['max']:
                    bucket_data['count'] += 1
                    bucket_data['revenue'] += p.get('probability', 0) * p.get('predicted_amount', 0)
                    bucket_data['customers'].append(p.get('customer_id', ''))
                    break

        return [
            {
                'bucket': name,
                'count': data['count'],
                'estimatedRevenue': float(data['revenue']),
                'avgProbability': np.mean([p.get('probability', 0) for p in predictions if data['min'] <= p.get('days_to_purchase', 999) <= data['max']]) if data['count'] > 0 else 0
            }
            for name, data in buckets.items()
        ]

    def _create_probability_by_segment(self, predictions: List[Dict], customers_df: pd.DataFrame) -> List[Dict]:
        """Group predictions by customer segment"""
        # Placeholder - would need customer segmentation data
        return []

    def _create_category_performance(self, predictions: List[Dict], transactions_df: pd.DataFrame) -> List[Dict]:
        """Calculate category performance with revenue, orders, customers, repeat rate, growth"""
        if predictions is None or len(predictions) == 0 or transactions_df.empty:
            return []

        try:
            # Check which amount column is available (schema uses 'net_sales_amount' as output alias)
            amount_col = 'net_sales_amount' if 'net_sales_amount' in transactions_df.columns else 'net_amount'

            # Group predictions by product/category
            category_stats = {}
            for p in predictions:
                cat = p.get('predicted_product', 'Unknown')
                if cat not in category_stats:
                    category_stats[cat] = {
                        'category': cat,
                        'revenue': 0,
                        'orders': 0,
                        'customers': set(),
                        'predictedRevenue': 0
                    }

                category_stats[cat]['predictedRevenue'] += p.get('probability', 0) * p.get('predicted_amount', 0)
                category_stats[cat]['customers'].add(p.get('customer_id'))

            # Get actual transaction data for categories
            if 'item_number' in transactions_df.columns and amount_col in transactions_df.columns:
                for cat in category_stats.keys():
                    cat_txns = transactions_df[transactions_df['item_number'] == cat]
                    if not cat_txns.empty:
                        category_stats[cat]['revenue'] = float(cat_txns[amount_col].sum())
                        category_stats[cat]['orders'] = int(len(cat_txns))

            # Calculate derived metrics
            total_revenue = sum(s['revenue'] for s in category_stats.values())
            result = []

            for stats in category_stats.values():
                customers_count = len(stats['customers'])
                revenue = stats['revenue']

                result.append({
                    'category': stats['category'],
                    'revenue': int(revenue),
                    'revenueShare': round((revenue / total_revenue * 100) if total_revenue > 0 else 0, 1),
                    'orders': stats['orders'],
                    'customers': customers_count,
                    'repeatRate': round(((stats['orders'] / customers_count) - 1) * 100 if customers_count > 0 else 0, 1),
                    'growthPercent': round(((stats['predictedRevenue'] / revenue) - 1) * 100 if revenue > 0 else 0, 1),
                    'growthAbs': int(stats['predictedRevenue'] - revenue)
                })

            return sorted(result, key=lambda x: x['revenue'], reverse=True)[:10]

        except Exception as e:
            logger.error(f"Error in _create_category_performance: {str(e)}", exc_info=True)
            return []

    def _create_product_affinity_network(self, predictions: List[Dict], transactions_df: pd.DataFrame = None) -> Dict:
        """Create product affinity network data based on historical co-purchase patterns"""
        if not predictions:
            return {'nodes': [], 'links': []}

        try:
            # Use historical transaction data for co-purchase patterns if available
            if transactions_df is not None and not transactions_df.empty and 'item_number' in transactions_df.columns:
                # Count customers who bought each product (historical data)
                product_customers = {}
                for _, row in transactions_df.iterrows():
                    product = row.get('item_number', 'Unknown')
                    customer = row.get('customer_id')
                    if product and customer:
                        if product not in product_customers:
                            product_customers[product] = set()
                        product_customers[product].add(customer)
            else:
                # Fallback to predictions (will have no links since each customer has one predicted product)
                product_customers = {}
                for p in predictions:
                    product = p.get('predicted_product', 'Unknown')
                    customer = p.get('customer_id')
                    if product not in product_customers:
                        product_customers[product] = set()
                    product_customers[product].add(customer)

            # Create nodes with proper sizing
            nodes = []
            for product, customers in product_customers.items():
                nodes.append({
                    'id': product,
                    'name': product,
                    'value': len(customers),  # Size based on customer count
                    'group': 1,
                    'category': product[0] if product else 'Unknown'  # First char as category
                })

            # Create links based on shared customers with strength values
            links = []
            products = list(product_customers.keys())
            for i, prod1 in enumerate(products):
                for prod2 in products[i+1:]:
                    shared = len(product_customers[prod1] & product_customers[prod2])
                    if shared > 0:
                        # Calculate strength (0-100 scale)
                        max_possible = min(len(product_customers[prod1]), len(product_customers[prod2]))
                        strength = int((shared / max_possible) * 100) if max_possible > 0 else 0

                        links.append({
                            'source': prod1,
                            'target': prod2,
                            'value': shared,  # Absolute shared customer count
                            'strength': strength  # Normalized strength 0-100
                        })

            # Sort and limit nodes
            nodes_sorted = sorted(nodes, key=lambda x: x['value'], reverse=True)[:15]

            # Get IDs of nodes that made it to the final list
            final_node_ids = {node['id'] for node in nodes_sorted}

            # Filter links to only include those connecting nodes in the final list
            valid_links = [link for link in links if link['source'] in final_node_ids and link['target'] in final_node_ids]
            links_sorted = sorted(valid_links, key=lambda x: x['strength'], reverse=True)[:30]

            return {
                'nodes': nodes_sorted,
                'links': links_sorted
            }

        except Exception as e:
            logger.error(f"Error in _create_product_affinity_network: {str(e)}")
            return {'nodes': [], 'links': []}

    def _create_confidence_matrix(self, predictions: List[Dict]) -> Dict:
        """Create confidence matrix heatmap data"""
        if not predictions:
            return {'matrix': [], 'products': [], 'segments': []}

        # Group by product and create segments based on probability
        segments = ['High (>70%)', 'Medium (50-70%)', 'Low (<50%)']
        products = list(set([p.get('predicted_product', 'Unknown') for p in predictions]))[:10]

        # Create matrix
        matrix = []
        for segment in segments:
            row = []
            for product in products:
                if segment == 'High (>70%)':
                    count = len([p for p in predictions if p.get('predicted_product') == product and p.get('probability', 0) > 0.7])
                elif segment == 'Medium (50-70%)':
                    count = len([p for p in predictions if p.get('predicted_product') == product and 0.5 <= p.get('probability', 0) <= 0.7])
                else:
                    count = len([p for p in predictions if p.get('predicted_product') == product and p.get('probability', 0) < 0.5])
                row.append(count)
            matrix.append(row)

        return {
            'matrix': matrix,
            'products': products,
            'segments': segments
        }

    def _create_time_distribution(self, predictions: List[Dict]) -> List[Dict]:
        """Create detailed time distribution for histogram"""
        if not predictions:
            return []

        days = [p.get('days_to_purchase', 0) for p in predictions]
        bins = list(range(0, 61, 5))  # 0-60 days in 5-day buckets
        counts, _ = np.histogram(days, bins=bins)

        return [
            {'days': f"{bins[i]}-{bins[i+1]}", 'count': int(counts[i])}
            for i in range(len(counts))
        ]

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
        """Generate rule-based insights for Next Purchase Predictor"""

        insights = []
        predictions = ml_results.get('predictions', [])

        # Insight 1: High-intent customers
        high_intent_count = kpis.get('highIntentCustomers', kpis.get('highProbability', 0))
        if high_intent_count > 0:
            total_predictions = kpis.get('totalPredictions', len(predictions))
            pct = (high_intent_count / total_predictions * 100) if total_predictions > 0 else 0
            insights.append(f"{high_intent_count} customers ({pct:.1f}%) have high purchase intent (>70% probability)")

        # Insight 2: Near-term opportunities
        customers_7d = kpis.get('customersWithin7d', 0)
        if customers_7d > 0:
            insights.append(f"{customers_7d} customers are likely to purchase within the next 7 days")

        # Insight 3: Revenue potential
        revenue_30d = kpis.get('predictedRevenue30d', 0)
        if revenue_30d > 0:
            insights.append(f"Potential revenue of ${revenue_30d:,.2f} expected within 30 days")

        # Insight 4: Average purchase timing
        avg_days = kpis.get('avgPredictedDays', kpis.get('avgDays', 0))
        if avg_days > 0:
            insights.append(f"Average predicted time to next purchase is {int(avg_days)} days")

        # Insight 5: Confidence level
        confidence = kpis.get('confidenceIndex', 0)
        if confidence > 0:
            conf_pct = confidence * 100
            conf_level = "high" if conf_pct >= 70 else "moderate" if conf_pct >= 50 else "low"
            insights.append(f"Model confidence is {conf_level} ({conf_pct:.1f}%) across all predictions")

        # Fallback if no insights generated
        if not insights:
            insights = [
                f"Generated {kpis.get('totalPredictions', 0)} next purchase predictions",
                "Purchase prediction analysis completed successfully"
            ]

        return insights

    async def _get_cached_ai_insights(self, ml_results: Dict, kpis: Dict, filters: Dict) -> List[str]:
        """Get AI insights with separate caching (30-min TTL) - Non-blocking async wrapper

        Args:
            ml_results: ML prediction results
            kpis: KPI metrics from dashboard
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            import asyncio
            # Run AI generation in thread pool to avoid blocking
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                ml_results,
                kpis,
                filters
            )
            return ai_insights
        except Exception as e:
            logger.error(f"[NextPurchaseService] Error in async AI insights: {e}")
            return []

    def _generate_ai_insights(self, ml_results: Dict, kpis: Dict, filters: Dict) -> List[str]:
        """Generate AI-powered strategic insights using Gemini (synchronous)

        Complements rule-based insights with creative, strategic analysis.
        Uses dashboard-specific prompts for consistent, actionable recommendations.

        Args:
            ml_results: ML prediction results
            kpis: KPI metrics from dashboard
            filters: Applied filters for context

        Returns:
            List of AI-generated insight strings (empty list on error)
        """
        try:
            # Import at method level for error isolation
            from lib.ai_insights_generator import generate_ai_insights

            # Extract key metrics for AI context
            predictions = ml_results.get('predictions', [])
            total_predictions = len(predictions)
            high_intent_count = len([p for p in predictions if p.get('probability', 0) >= 0.7])
            high_intent_pct = (high_intent_count / total_predictions * 100) if total_predictions > 0 else 0

            # Calculate predicted revenue
            predicted_revenue_30d = sum([
                p.get('probability', 0) * p.get('predicted_amount', 0)
                for p in predictions
                if p.get('days_to_purchase', 999) <= 30
            ])

            # Find top predicted product
            product_counts = {}
            for p in predictions:
                prod = p.get('predicted_product', 'Unknown')
                product_counts[prod] = product_counts.get(prod, 0) + 1
            top_product = max(product_counts.items(), key=lambda x: x[1])[0] if product_counts else 'N/A'

            # Average days to next purchase
            avg_days = np.mean([p.get('days_to_purchase', 0) for p in predictions]) if predictions else 0

            # Build context for AI
            kpis_dict = {
                'total_predictions': total_predictions,
                'high_intent_count': high_intent_count,
                'high_intent_pct': high_intent_pct,
                'predicted_revenue_30d': predicted_revenue_30d,
                'avg_days_to_next': avg_days,
                'confidence_index': kpis.get('confidenceIndex', 0),
                'cross_sell_rate': kpis.get('crossSellRate', 0)
            }

            data_summary = {
                'top_product': top_product,
                'product_count': len(product_counts),
                'customers_within_7d': kpis.get('customersWithin7d', 0),
                'date_range': f"{filters.get('dateFrom', 'N/A')} to {filters.get('dateTo', 'N/A')}"
            }

            # Generate AI insights
            ai_insights = generate_ai_insights(
                dashboard_type='next_purchase_predictor',  # Updated to match AI insights generator
                kpis=kpis_dict,
                data_summary=data_summary,
                filters=filters
            )

            return ai_insights

        except ImportError:
            logger.info("[NextPurchaseService] AI insights module not available, skipping AI insights")
            return []
        except Exception as e:
            logger.error(f"[NextPurchaseService] Error generating AI insights: {e}")
            return []  # Graceful fallback

    @cache_dashboard_endpoint(dashboard_type='next-purchase', ttl=300)
    async def get_customer_timeline(self, customer_id: int, limit: int = 20) -> Dict:
        """Get customer purchase timeline for expandable row"""
        try:
            # Fetch customer transactions
            transactions = await self.data_service.get_transactions({
                'customer_id': customer_id
            })

            transaction_rows = transactions.get('rows', transactions.get('data', []))

            if not transaction_rows:
                return {'purchases': [], 'customer_id': customer_id}

            # Convert to DataFrame and process
            df = pd.DataFrame(transaction_rows)

            # Sort by date and limit
            df['txn_date'] = pd.to_datetime(df['txn_date'])
            df = df.sort_values('txn_date', ascending=False).head(limit)

            # Format for timeline display
            purchases = []
            for _, row in df.iterrows():
                purchases.append({
                    'date': row['txn_date'].strftime('%Y-%m-%d'),
                    'category': row.get('product_category', row.get('product_name', 'Unknown')),
                    'product': row.get('product_name', 'Unknown'),
                    'amount': float(row.get('net_sales_amount', 0)),
                    'quantity': int(row.get('quantity', 1))
                })

            return {
                'purchases': purchases,
                'customer_id': customer_id,
                'total_purchases': len(transaction_rows)
            }

        except Exception as e:
            logger.error(f"Error fetching customer timeline: {str(e)}", exc_info=True)
            return {'purchases': [], 'customer_id': customer_id, 'error': str(e)}

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

    def _create_purchase_timing_data(self, predictions: List[Dict]) -> List[Dict]:
        """Create purchase timing data for time-to-purchase cards (top 12)"""
        if not predictions:
            return []

        try:
            # Sort by probability and get top 12
            sorted_predictions = sorted(predictions, key=lambda x: x.get('probability', 0), reverse=True)[:12]

            result = []
            for p in sorted_predictions:
                result.append({
                    'customerId': p.get('customer_id'),
                    'product': p.get('predicted_product', 'Unknown'),
                    'daysToPurchase': int(p.get('days_to_purchase', 0)),
                    'probability': float(p.get('probability', 0))
                })

            return result

        except Exception as e:
            logger.error(f"Error in _create_purchase_timing_data: {str(e)}")
            return []

    def _create_category_revenue_series(self, predictions: List[Dict], transactions_df: pd.DataFrame) -> List[Dict]:
        """Create time-series revenue data for category sparklines"""
        if predictions is None or len(predictions) == 0 or transactions_df.empty:
            return []

        try:
            result = []

            # Get unique categories from predictions
            categories = list(set([p.get('predicted_product', 'Unknown') for p in predictions]))[:10]

            # Check which columns are available (schema uses 'txn_date' and 'net_sales_amount' as output aliases)
            date_col = 'txn_date' if 'txn_date' in transactions_df.columns else 'date'
            amount_col = 'net_sales_amount' if 'net_sales_amount' in transactions_df.columns else 'net_amount'

            # Check if we have required columns
            if date_col not in transactions_df.columns or amount_col not in transactions_df.columns or 'item_number' not in transactions_df.columns:
                logger.warning(f"Missing required columns. Available: {transactions_df.columns.tolist()}")
                return []

            # Ensure date is datetime
            transactions_df[date_col] = pd.to_datetime(transactions_df[date_col], errors='coerce')

            for category in categories:
                # Get transactions for this category
                cat_txns = transactions_df[transactions_df['item_number'] == category].copy()

                if not cat_txns.empty:
                    # Group by month and sum revenue
                    cat_txns['month'] = cat_txns[date_col].dt.to_period('M')
                    monthly = cat_txns.groupby('month')[amount_col].sum().reset_index()

                    # Get last 6 months
                    monthly_sorted = monthly.sort_values('month', ascending=False).head(6)

                    points = []
                    for _, row in monthly_sorted.iterrows():
                        points.append({
                            'month': str(row['month']),
                            'revenue': float(row[amount_col])
                        })

                    result.append({
                        'category': category,
                        'points': list(reversed(points))  # Chronological order
                    })

            return result

        except Exception as e:
            logger.error(f"Error in _create_category_revenue_series: {str(e)}", exc_info=True)
            return []

    def _create_customer_timeline_data(self, predictions: List[Dict], transactions_df: pd.DataFrame) -> Dict:
        """Create customer timeline data for journey visualization (keyed by customer_id)"""
        if predictions is None or len(predictions) == 0 or transactions_df.empty:
            return {}

        try:
            # Get top 50 customers (to match the predictions table)
            top_customers = sorted(predictions, key=lambda x: x.get('probability', 0), reverse=True)[:50]
            customer_ids = [p.get('customer_id') for p in top_customers]

            result = {}

            # Check which date column is available (schema uses 'txn_date' as output alias)
            date_col = 'txn_date' if 'txn_date' in transactions_df.columns else 'date'
            amount_col = 'net_sales_amount' if 'net_sales_amount' in transactions_df.columns else 'net_amount'

            for pred in top_customers:
                cust_id = pred.get('customer_id')
                customer_name = pred.get('customer_name', f'Customer {cust_id}')

                # Get customer's transactions
                cust_txns = transactions_df[transactions_df['customer_id'] == cust_id].copy()

                if not cust_txns.empty:
                    # Sort by date descending and limit to last 20
                    if date_col in cust_txns.columns:
                        cust_txns[date_col] = pd.to_datetime(cust_txns[date_col], errors='coerce')
                        cust_txns = cust_txns.sort_values(date_col, ascending=False).head(20)

                        purchases = []
                        for _, txn in cust_txns.iterrows():
                            purchases.append({
                                'date': txn[date_col].isoformat() if pd.notna(txn[date_col]) else None,
                                'category': txn.get('item_number', 'Unknown'),
                                'amount': float(txn.get(amount_col, 0)),
                                'txn_id': str(txn.get('txn_id', ''))
                            })

                        # Store keyed by customer_id with customer_name for O(1) lookup
                        result[int(cust_id)] = {
                            'customer_name': customer_name,
                            'purchases': list(reversed(purchases))  # Chronological order
                        }

            return result

        except Exception as e:
            logger.error(f"Error in _create_customer_timeline_data: {str(e)}", exc_info=True)
            return {}

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
