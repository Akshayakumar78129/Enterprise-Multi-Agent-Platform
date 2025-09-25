"""Customer behavior processing service"""

import pandas as pd
import numpy as np
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

from .data_service import CustomerBehaviorDataService
from database.filter_engine import FilterEngine


class CustomerBehaviorProcessingService:
    """Processing service for customer behavior analysis"""

    def __init__(self):
        self.data_service = CustomerBehaviorDataService()
        self.filter_engine = FilterEngine()

    def _separate_filters(self, filters: Dict) -> tuple:
        """Separate transaction-specific filters from general filters

        Returns:
            (transaction_filters, general_filters)
        """
        transaction_only_keys = ['dateFrom', 'dateTo', 'datefrom', 'dateto', 'timeRange', 'time_period']

        transaction_filters = {}
        general_filters = {}

        for key, value in filters.items():
            if key in transaction_only_keys:
                transaction_filters[key] = value
            else:
                general_filters[key] = value
                # Also include in transaction filters for consistency
                transaction_filters[key] = value

        return transaction_filters, general_filters

    async def get_behavior_summary(self, filters: Dict) -> Dict:
        """Main dashboard endpoint for customer behavior analysis

        Returns comprehensive behavior analysis data
        """
        try:
            # Get all metrics in parallel for better performance
            (
                purchase_patterns,
                product_preferences,
                channel_usage,
                engagement_metrics,
                customer_segments,
                top_customers
            ) = await asyncio.gather(
                self.get_purchase_patterns(filters),
                self.get_product_preferences(filters),
                self.get_channel_usage(filters),
                self.get_engagement_metrics(filters),
                self.get_customer_segments(filters),
                self.get_top_customers(filters)
            )

            # Return in structured format
            return {
                "purchasePatterns": purchase_patterns,
                "productPreferences": product_preferences,
                "channelUsage": channel_usage,
                "engagementMetrics": engagement_metrics,
                "customerSegments": customer_segments,
                "topCustomers": top_customers,
                "analysisMetadata": {
                    "analysisDate": datetime.now().isoformat(),
                    "filters": filters
                }
            }
        except Exception as e:
            print(f"[CustomerBehaviorProcessingService] Error in getBehaviorSummary: {e}")
            return {
                "purchasePatterns": {},
                "productPreferences": {},
                "channelUsage": {},
                "engagementMetrics": {},
                "customerSegments": [],
                "topCustomers": [],
                "analysisMetadata": {}
            }

    async def get_purchase_patterns(self, filters: Dict) -> Dict:
        """Analyze customer purchase patterns"""
        try:
            # Get transaction data
            txns_res = await self.data_service.get_transactions(filters)
            transactions = pd.DataFrame(txns_res.get('rows', []))

            if transactions.empty:
                return {}

            # Convert date column
            transactions['transaction_date'] = pd.to_datetime(transactions['transaction_date'])

            # Group by customer
            customer_patterns = transactions.groupby('customer_id').agg({
                'transaction_date': ['count', 'min', 'max'],
                'net_sales_amount': ['sum', 'mean', 'median', 'std', 'min', 'max'],
                'quantity': ['sum', 'mean']
            }).reset_index()

            # Flatten column names
            customer_patterns.columns = ['_'.join(col).strip('_') for col in customer_patterns.columns.values]

            # Calculate days between purchases
            customer_patterns['days_range'] = (
                pd.to_datetime(customer_patterns['transaction_date_max']) -
                pd.to_datetime(customer_patterns['transaction_date_min'])
            ).dt.days

            customer_patterns['avg_days_between'] = (
                customer_patterns['days_range'] / customer_patterns['transaction_date_count']
            ).fillna(0)

            # Calculate frequency categories
            customer_patterns['frequency_category'] = pd.cut(
                customer_patterns['transaction_date_count'],
                bins=[0, 1, 5, 10, float('inf')],
                labels=['Single', 'Low', 'Medium', 'High']
            )

            # Calculate frequency distribution
            freq_dist = customer_patterns['frequency_category'].value_counts(normalize=True) * 100

            return {
                'frequencyDistribution': [
                    {'category': cat, 'count': int(customer_patterns[customer_patterns['frequency_category'] == cat].shape[0]),
                     'percentage': float(pct)}
                    for cat, pct in freq_dist.items()
                ],
                'avgDaysBetweenPurchases': float(customer_patterns['avg_days_between'].mean()),
                'spendPatterns': {
                    'avgOrderValue': float(customer_patterns['net_sales_amount_mean'].mean()),
                    'medianOrderValue': float(customer_patterns['net_sales_amount_median'].median()),
                    'avgItemsPerOrder': float(customer_patterns['quantity_mean'].mean()),
                    'minOrderValue': float(customer_patterns['net_sales_amount_min'].min()),
                    'maxOrderValue': float(customer_patterns['net_sales_amount_max'].max()),
                    'stdOrderValue': float(customer_patterns['net_sales_amount_std'].mean())
                },
                'totalCustomersAnalyzed': len(customer_patterns),
                'timePeriod': filters.get('time_period', 'all')
            }

        except Exception as e:
            print(f"[CustomerBehaviorProcessingService] Error in getPurchasePatterns: {e}")
            return {}

    async def get_product_preferences(self, filters: Dict) -> Dict:
        """Analyze product preferences"""
        try:
            # Get transaction data
            txns_res = await self.data_service.get_transactions(filters)
            transactions = pd.DataFrame(txns_res.get('rows', []))

            if transactions.empty or 'product_category' not in transactions.columns:
                return {}

            # Calculate category distribution
            category_sales = transactions.groupby('product_category').agg({
                'net_sales_amount': ['sum', 'mean'],
                'customer_id': 'nunique'
            }).reset_index()

            category_sales.columns = ['category', 'total_sales', 'avg_sales', 'unique_customers']

            # Calculate distribution percentages
            total_sales = category_sales['total_sales'].sum()
            category_sales['percentage'] = (category_sales['total_sales'] / total_sales * 100).round(2)

            # Get top categories
            top_categories = category_sales.nlargest(10, 'total_sales')

            # Generate insights
            insights = []
            if not top_categories.empty:
                top_cat = top_categories.iloc[0]
                insights.append(f"Top category '{top_cat['category']}' accounts for {top_cat['percentage']:.1f}% of total sales")

                if len(top_categories) > 1:
                    concentration = top_categories.head(3)['percentage'].sum()
                    insights.append(f"Top 3 categories represent {concentration:.1f}% of total sales")

            return {
                'categoryDistribution': dict(zip(
                    category_sales['category'].astype(str),
                    category_sales['percentage'].tolist()
                )),
                'avgSpendByCategory': dict(zip(
                    category_sales['category'].astype(str),
                    category_sales['avg_sales'].round(2).tolist()
                )),
                'topCategories': top_categories.to_dict('records'),
                'insights': insights
            }

        except Exception as e:
            print(f"[CustomerBehaviorProcessingService] Error in getProductPreferences: {e}")
            return {}

    async def get_channel_usage(self, filters: Dict) -> Dict:
        """Analyze channel usage patterns"""
        try:
            # Get transaction data
            txns_res = await self.data_service.get_transactions(filters)
            transactions = pd.DataFrame(txns_res.get('rows', []))

            if transactions.empty or 'sales_channel' not in transactions.columns:
                return {}

            # Calculate channel distribution
            channel_stats = transactions.groupby('sales_channel').agg({
                'net_sales_amount': ['sum', 'mean'],
                'customer_id': 'nunique',
                'transaction_date': 'count'
            }).reset_index()

            channel_stats.columns = ['channel', 'total_sales', 'avg_sales', 'unique_customers', 'transaction_count']

            # Calculate distribution percentages
            total_sales = channel_stats['total_sales'].sum()
            channel_stats['percentage'] = (channel_stats['total_sales'] / total_sales * 100).round(2)

            # Generate insights
            insights = []
            if not channel_stats.empty:
                top_channel = channel_stats.nlargest(1, 'total_sales').iloc[0]
                insights.append(f"'{top_channel['channel']}' is the dominant channel with {top_channel['percentage']:.1f}% of sales")

                # Calculate channel efficiency
                channel_stats['sales_per_customer'] = channel_stats['total_sales'] / channel_stats['unique_customers']
                most_efficient = channel_stats.nlargest(1, 'sales_per_customer').iloc[0]
                insights.append(f"'{most_efficient['channel']}' has highest sales per customer at ${most_efficient['sales_per_customer']:.2f}")

            return {
                'channelDistribution': dict(zip(
                    channel_stats['channel'].fillna('Unknown').astype(str),
                    channel_stats['percentage'].tolist()
                )),
                'avgSpendByChannel': dict(zip(
                    channel_stats['channel'].fillna('Unknown').astype(str),
                    channel_stats['avg_sales'].round(2).tolist()
                )),
                'channelTrends': channel_stats.to_dict('records'),
                'insights': insights
            }

        except Exception as e:
            print(f"[CustomerBehaviorProcessingService] Error in getChannelUsage: {e}")
            return {}

    async def get_engagement_metrics(self, filters: Dict) -> Dict:
        """Calculate customer engagement metrics"""
        try:
            # Separate filters - loyalty doesn't have transaction date columns
            transaction_filters, general_filters = self._separate_filters(filters)

            # Get loyalty data with general filters only
            loyalty_res = await self.data_service.get_loyalty(general_filters)
            loyalty_data = pd.DataFrame(loyalty_res.get('rows', []))

            if loyalty_data.empty:
                return {}

            # Calculate recency distribution
            recency_dist = {}
            if 'recency_band' in loyalty_data.columns:
                recency_counts = loyalty_data['recency_band'].value_counts(normalize=True) * 100
                recency_dist = recency_counts.to_dict()

            # Calculate engagement distribution based on RFM scores
            engagement_dist = {}
            if 'rfm_score' in loyalty_data.columns:
                loyalty_data['engagement_level'] = pd.cut(
                    loyalty_data['rfm_score'].fillna(0),
                    bins=[0, 200, 400, 600, 800, 1000],
                    labels=['Very Low', 'Low', 'Medium', 'High', 'Very High']
                )
                engagement_counts = loyalty_data['engagement_level'].value_counts(normalize=True) * 100
                engagement_dist = engagement_counts.to_dict()

            # Calculate average engagement score
            avg_engagement = loyalty_data['rfm_score'].mean() if 'rfm_score' in loyalty_data.columns else 0

            # Calculate churn risk (customers with Low or Very Low engagement)
            churn_risk = 0
            if 'loyalty_status' in loyalty_data.columns:
                at_risk = loyalty_data[loyalty_data['loyalty_status'].isin(['At Risk', 'Lost'])].shape[0]
                total = loyalty_data.shape[0]
                churn_risk = (at_risk / total * 100) if total > 0 else 0

            # Loyalty distribution
            loyalty_dist = {}
            if 'loyalty_status' in loyalty_data.columns:
                loyalty_counts = loyalty_data['loyalty_status'].value_counts(normalize=True) * 100
                loyalty_dist = loyalty_counts.to_dict()

            return {
                'recencyDistribution': recency_dist,
                'engagementDistribution': engagement_dist,
                'avgEngagementScore': float(avg_engagement),
                'churnRiskPercentage': float(churn_risk),
                'loyaltyDistribution': loyalty_dist
            }

        except Exception as e:
            print(f"[CustomerBehaviorProcessingService] Error in getEngagementMetrics: {e}")
            return {}

    async def get_customer_segments(self, filters: Dict) -> List[Dict]:
        """Analyze customer segments"""
        try:
            # Separate filters - loyalty doesn't have transaction date columns
            transaction_filters, general_filters = self._separate_filters(filters)

            # Get customer and loyalty data with general filters, transactions with all filters
            customers_res = await self.data_service.get_customers(general_filters)
            loyalty_res = await self.data_service.get_loyalty(general_filters)
            txns_res = await self.data_service.get_transactions(transaction_filters)

            customers = pd.DataFrame(customers_res.get('rows', []))
            loyalty = pd.DataFrame(loyalty_res.get('rows', []))
            transactions = pd.DataFrame(txns_res.get('rows', []))

            if customers.empty:
                return []

            # Merge data
            if not loyalty.empty:
                customers = customers.merge(loyalty, on='customer_id', how='left')

            # Calculate transaction metrics per customer
            if not transactions.empty:
                txn_metrics = transactions.groupby('customer_id').agg({
                    'net_sales_amount': ['sum', 'mean'],
                    'transaction_date': 'count'
                }).reset_index()
                txn_metrics.columns = ['customer_id', 'total_spend', 'avg_order_value', 'transaction_count']
                customers = customers.merge(txn_metrics, on='customer_id', how='left')

            # Group by customer type/segment
            segment_col = 'customer_type' if 'customer_type' in customers.columns else 'customer_category'

            if segment_col in customers.columns:
                # Build aggregation dict based on available columns
                agg_dict = {'customer_id': 'count'}

                if 'lifetime_sales' in customers.columns:
                    agg_dict['lifetime_sales'] = 'mean'
                else:
                    agg_dict['customer_id_for_clv'] = 'count'

                if 'days_since_last_activity' in customers.columns:
                    agg_dict['days_since_last_activity'] = 'mean'

                if 'total_spend' in customers.columns:
                    agg_dict['total_spend'] = 'mean'

                segments = customers.groupby(segment_col).agg(agg_dict).reset_index()

                # Rename columns dynamically based on what was aggregated
                new_cols = [segment_col]
                if 'customer_id' in agg_dict:
                    new_cols.append('customer_count')
                if 'lifetime_sales' in agg_dict:
                    new_cols.append('avg_clv')
                elif 'customer_id_for_clv' in agg_dict:
                    new_cols.append('avg_clv')
                if 'days_since_last_activity' in agg_dict:
                    new_cols.append('avg_recency')
                if 'total_spend' in agg_dict:
                    new_cols.append('avg_monetary')

                segments.columns = new_cols
                segments.rename(columns={segment_col: 'segment_name'}, inplace=True)

                # Fill missing columns with defaults
                if 'avg_clv' not in segments.columns:
                    segments['avg_clv'] = 0
                if 'avg_recency' not in segments.columns:
                    segments['avg_recency'] = 0
                if 'avg_monetary' not in segments.columns:
                    segments['avg_monetary'] = 0

                # Calculate frequency from transaction count
                if 'transaction_count' in customers.columns:
                    # Need to use the original column name for groupby
                    original_segment_col = segment_col if segment_col in customers.columns else 'segment_name'
                    freq_by_segment = customers.groupby(original_segment_col)['transaction_count'].mean().reset_index()
                    freq_by_segment.columns = ['segment_name', 'avg_frequency']
                    segments = segments.merge(freq_by_segment, on='segment_name', how='left')
                else:
                    segments['avg_frequency'] = 0

                # Format results
                results = []
                for _, row in segments.iterrows():
                    results.append({
                        'segmentId': str(row['segment_name']),
                        'segmentName': str(row['segment_name']),
                        'customerCount': int(row['customer_count']),
                        'avgClv': float(row['avg_clv']) if pd.notna(row['avg_clv']) else 0,
                        'avgFrequency': float(row['avg_frequency']) if pd.notna(row['avg_frequency']) else 0,
                        'avgRecency': float(row['avg_recency']) if pd.notna(row['avg_recency']) else 0,
                        'avgMonetary': float(row['avg_monetary']) if pd.notna(row['avg_monetary']) else 0
                    })

                return results

            return []

        except Exception as e:
            print(f"[CustomerBehaviorProcessingService] Error in getCustomerSegments: {e}")
            return []

    async def get_top_customers(self, filters: Dict, limit: int = 20) -> List[Dict]:
        """Get top customers by various metrics"""
        try:
            # Separate filters - loyalty doesn't have transaction date columns
            transaction_filters, general_filters = self._separate_filters(filters)

            # Get all data with appropriate filters
            customers_res = await self.data_service.get_customers(general_filters)
            loyalty_res = await self.data_service.get_loyalty(general_filters)
            txns_res = await self.data_service.get_transactions(transaction_filters)

            customers = pd.DataFrame(customers_res.get('rows', []))
            loyalty = pd.DataFrame(loyalty_res.get('rows', []))
            transactions = pd.DataFrame(txns_res.get('rows', []))

            if customers.empty:
                return []

            # Merge loyalty data
            if not loyalty.empty:
                customers = customers.merge(loyalty, on='customer_id', how='left')

            # Calculate transaction metrics
            if not transactions.empty:
                # Customer transaction metrics
                txn_metrics = transactions.groupby('customer_id').agg({
                    'net_sales_amount': ['sum', 'mean'],
                    'transaction_date': ['count', lambda x: (datetime.now() - pd.to_datetime(x).max()).days],
                    'product_category': lambda x: x.mode()[0] if len(x) > 0 else None,
                    'sales_channel': lambda x: x.mode()[0] if len(x) > 0 else None
                }).reset_index()

                txn_metrics.columns = ['customer_id', 'total_spend', 'avg_order_value',
                                      'transaction_count', 'recency_days',
                                      'preferred_category', 'preferred_channel']

                customers = customers.merge(txn_metrics, on='customer_id', how='left')

                # Calculate purchase frequency (transactions per month)
                customers['purchase_frequency'] = customers['transaction_count'] / 12  # Assuming 1 year of data

                # Calculate estimated CLV
                customers['estimated_clv'] = customers['avg_order_value'] * customers['purchase_frequency'] * 12

                # Calculate engagement score (normalized RFM or custom)
                if 'rfm_score' in customers.columns:
                    customers['engagement_score'] = customers['rfm_score'] / 10  # Normalize to 0-100
                else:
                    customers['engagement_score'] = 50  # Default

                # Determine frequency category
                customers['frequency_category'] = pd.cut(
                    customers['transaction_count'].fillna(0),
                    bins=[0, 1, 5, 10, float('inf')],
                    labels=['Single', 'Low', 'Medium', 'High']
                )

                # Sort by total spend and get top customers
                top_customers = customers.nlargest(limit, 'total_spend')

                # Format results
                results = []
                for _, row in top_customers.iterrows():
                    results.append({
                        'customerId': str(row['customer_id']),
                        'customerName': row.get('customer_name', f"Customer {row['customer_id']}"),
                        'customerType': row.get('customer_type', 'Unknown'),
                        'loyaltyStatus': row.get('loyalty_status', 'Unknown'),
                        'transactionCount': int(row['transaction_count']) if pd.notna(row['transaction_count']) else 0,
                        'totalSpend': float(row['total_spend']) if pd.notna(row['total_spend']) else 0,
                        'avgOrderValue': float(row['avg_order_value']) if pd.notna(row['avg_order_value']) else 0,
                        'purchaseFrequency': float(row['purchase_frequency']) if pd.notna(row['purchase_frequency']) else 0,
                        'recencyDays': int(row['recency_days']) if pd.notna(row['recency_days']) else 999,
                        'preferredCategory': str(row['preferred_category']) if pd.notna(row['preferred_category']) else None,
                        'preferredChannel': str(row['preferred_channel']) if pd.notna(row['preferred_channel']) else None,
                        'estimatedClv': float(row['estimated_clv']) if pd.notna(row['estimated_clv']) else 0,
                        'engagementScore': float(row['engagement_score']) if pd.notna(row['engagement_score']) else 0,
                        'frequencyCategory': str(row['frequency_category']) if pd.notna(row['frequency_category']) else 'Low'
                    })

                return results

            return []

        except Exception as e:
            print(f"[CustomerBehaviorProcessingService] Error in getTopCustomers: {e}")
            return []

    async def export_data(self, filters: Dict, format: str = "csv") -> str:
        """Export customer behavior data"""
        try:
            # Get top customers data
            customers = await self.get_top_customers(filters, limit=1000)

            if format == "csv":
                import csv
                import io

                output = io.StringIO()
                if customers:
                    writer = csv.DictWriter(output, fieldnames=customers[0].keys())
                    writer.writeheader()
                    writer.writerows(customers)

                return output.getvalue()
            else:
                import json
                return json.dumps(customers, indent=2)

        except Exception as e:
            print(f"[CustomerBehaviorProcessingService] Error in exportData: {e}")
            return "" if format == "csv" else "[]"