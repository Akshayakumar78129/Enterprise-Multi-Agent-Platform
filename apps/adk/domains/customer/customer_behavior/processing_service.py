"""Customer Behavior Processing Service - Integrated Version"""

from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import asyncio
import logging

from .data_service import CustomerBehaviorDataService
from database.filter_engine import FilterEngine
from .ml_predictor import CustomerBehaviorMLPredictor
from domains.common.simple_cache import cache_dashboard_endpoint

logger = logging.getLogger(__name__)


class CustomerBehaviorProcessingService:
    """Service for processing customer behavior data"""

    def __init__(self):
        self.data_service = CustomerBehaviorDataService()
        self.filter_engine = FilterEngine()
        self.ml_predictor = CustomerBehaviorMLPredictor()

    def _separate_filters(self, filters: Dict) -> tuple:
        """Separate filters into date and non-date filters"""

        date_from = filters.get('date_from') or filters.get('dateFrom')
        date_to = filters.get('date_to') or filters.get('dateTo')

        # Remove date fields from filters
        non_date_filters = {k: v for k, v in filters.items()
                           if k not in ['date_from', 'date_to', 'dateFrom', 'dateTo']}

        return date_from, date_to, non_date_filters

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_dashboard_summary(self, filters: Dict = {}) -> Dict:
        """Main dashboard endpoint - returns comprehensive customer behavior metrics"""

        try:
            # Get all data sources
            behavior_data = await self.get_behavior_data(filters)
            transaction_data = await self.data_service.get_transaction_details(filters)

            # Convert to DataFrames
            behavior_df = pd.DataFrame(behavior_data.get('rows', behavior_data.get('data', []))) if isinstance(behavior_data, dict) else behavior_data
            transaction_df = pd.DataFrame(transaction_data.get('rows', transaction_data.get('data', [])))

            if behavior_df.empty:
                return self._get_empty_response()

            # Perform comprehensive analysis
            purchase_patterns = self._analyze_purchase_patterns_comprehensive(behavior_df, transaction_df)
            product_preferences = self._analyze_product_preferences_comprehensive(behavior_df, transaction_df)
            channel_usage = self._analyze_channel_usage_comprehensive(behavior_df, transaction_df)
            engagement_metrics = self._calculate_engagement_metrics_comprehensive(behavior_df, transaction_df)
            customer_segments = self._analyze_customer_segments(behavior_df)
            top_customers = self._get_top_customers_sync(behavior_df, filters)
            behavioral_metrics = self._calculate_behavioral_metrics_comprehensive(behavior_df, transaction_df)

            # Calculate comprehensive KPIs
            kpis = self._calculate_comprehensive_kpis(behavior_df, transaction_df)

            # Generate rule-based insights
            rule_based_insights = self._generate_behavior_insights(behavior_df, transaction_df)

            # Get AI insights async (non-blocking with graceful fallback)
            ai_insights = await self._get_cached_ai_insights(
                filters,
                kpis,
                purchase_patterns,
                product_preferences,
                engagement_metrics
            )

            # Combine insights (rule-based + AI)
            all_insights = rule_based_insights + [{'type': 'ai', 'message': insight} for insight in ai_insights]

            return {
                'kpiMetrics': kpis,
                'mainData': {
                    'purchasePatterns': purchase_patterns,
                    'productPreferences': product_preferences,
                    'channelUsage': channel_usage,
                    'engagementMetrics': engagement_metrics,
                    'customerSegments': customer_segments,
                    'topCustomers': top_customers,
                    'behavioralMetrics': behavioral_metrics
                },
                'insights': all_insights,
                'metadata': {
                    'analysisDate': datetime.now().isoformat(),
                    'totalRecords': len(behavior_df),
                    'filters': filters
                }
            }

        except Exception as e:
            logger.error(f"Error in get_dashboard_summary: {e}")
            return self._get_empty_response()

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_behavior_summary(self, filters: Dict) -> Dict:
        """Alternate endpoint for behavior summary - maintains backward compatibility"""

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

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_behavior_data(self, filters: Dict) -> pd.DataFrame:
        """Get customer behavior data"""
        try:
            # Get customer behavior analysis data from the data service
            behavior_result = await self.data_service.get_behavior_analysis_data(filters)
            behavior_df = pd.DataFrame(behavior_result.get('rows', behavior_result.get('data', [])))

            # If empty, try to build from customers and transactions
            if behavior_df.empty:
                # Get customers and transactions
                customers_result = await self.data_service.get_customers(filters)
                transactions_result = await self.data_service.get_transactions(filters)
                loyalty_result = await self.data_service.get_loyalty(filters)

                customers_df = pd.DataFrame(customers_result.get('rows', customers_result.get('data', [])))
                transactions_df = pd.DataFrame(transactions_result.get('rows', transactions_result.get('data', [])))
                loyalty_df = pd.DataFrame(loyalty_result.get('rows', loyalty_result.get('data', [])))

                if not customers_df.empty and not transactions_df.empty:
                    # Build behavior data from customers and transactions
                    behavior_df = self._build_behavior_from_transactions(customers_df, transactions_df, loyalty_df)
            else:
                # CRITICAL FIX: Even if behavior_df is not empty, we need to calculate preferred fields
                # because the SQL query doesn't include them
                try:
                    # Get transaction details to calculate preferred category/channel
                    transaction_result = await self.data_service.get_transaction_details(filters)
                    transaction_df = pd.DataFrame(transaction_result.get('rows', transaction_result.get('data', [])))

                    if not transaction_df.empty:
                        # Calculate preferred channel
                        preferred_channels = self._calculate_preferred_channels(transaction_df)
                        if not preferred_channels.empty:
                            behavior_df = behavior_df.merge(preferred_channels, on='customer_id', how='left')
                            behavior_df['preferred_channel'] = behavior_df['preferred_channel'].fillna('Unknown')
                            logger.info(f"Calculated preferred_channel for {len(preferred_channels)} customers")
                        else:
                            behavior_df['preferred_channel'] = 'Unknown'

                        # Calculate preferred category
                        preferred_categories = self._calculate_preferred_categories(transaction_df)
                        if not preferred_categories.empty:
                            behavior_df = behavior_df.merge(preferred_categories, on='customer_id', how='left')
                            behavior_df['preferred_category'] = behavior_df['preferred_category'].fillna('Unknown')
                            logger.info(f"Calculated preferred_category for {len(preferred_categories)} customers")
                        else:
                            behavior_df['preferred_category'] = 'Unknown'
                    else:
                        behavior_df['preferred_channel'] = 'Unknown'
                        behavior_df['preferred_category'] = 'Unknown'
                except Exception as e:
                    logger.warning(f"Could not calculate preferred fields: {e}")
                    behavior_df['preferred_channel'] = 'Unknown'
                    behavior_df['preferred_category'] = 'Unknown'

            return behavior_df

        except Exception as e:
            logger.error(f"Error getting behavior data: {e}")
            return pd.DataFrame()

    def _build_behavior_from_transactions(self, customers_df: pd.DataFrame, transactions_df: pd.DataFrame, loyalty_df: pd.DataFrame) -> pd.DataFrame:
        """Build behavior data from customers and transactions"""
        try:
            if transactions_df.empty or customers_df.empty:
                return pd.DataFrame()

            # Ensure date column exists and is datetime
            date_col = 'txn_date' if 'txn_date' in transactions_df.columns else 'transaction_date'
            if date_col in transactions_df.columns:
                transactions_df[date_col] = pd.to_datetime(transactions_df[date_col])

            # Group transactions by customer
            agg_dict = {
                'net_sales_amount': ['sum', 'mean', 'count']
            }

            # Add date columns if they exist
            if date_col in transactions_df.columns:
                agg_dict[date_col] = ['min', 'max']

            customer_stats = transactions_df.groupby('customer_id').agg(agg_dict).reset_index()

            # Flatten column names based on what was aggregated
            if date_col in transactions_df.columns:
                customer_stats.columns = ['customer_id', 'total_spend', 'avg_order_value', 'transaction_count', 'first_purchase', 'last_purchase_date']
            else:
                customer_stats.columns = ['customer_id', 'total_spend', 'avg_order_value', 'transaction_count']
                customer_stats['first_purchase'] = pd.Timestamp.now() - pd.Timedelta(days=180)
                customer_stats['last_purchase_date'] = pd.Timestamp.now() - pd.Timedelta(days=30)

            # Merge with customer data
            behavior_df = customers_df.merge(customer_stats, on='customer_id', how='left')

            # Fill missing values
            behavior_df['total_spend'] = behavior_df['total_spend'].fillna(0)
            behavior_df['avg_order_value'] = behavior_df['avg_order_value'].fillna(0)
            behavior_df['transaction_count'] = behavior_df['transaction_count'].fillna(0)

            # Add customer type and name
            if 'customer_name' not in behavior_df.columns:
                behavior_df['customer_name'] = behavior_df['customer_id'].apply(lambda x: f"Customer {x}")

            if 'customer_type' not in behavior_df.columns:
                behavior_df['customer_type'] = 'Regular'

            # Calculate additional metrics
            if 'first_purchase' in behavior_df.columns and 'last_purchase_date' in behavior_df.columns:
                behavior_df['days_since_first'] = (behavior_df['last_purchase_date'] - behavior_df['first_purchase']).dt.days
                behavior_df['avg_days_between_purchases'] = behavior_df.apply(
                    lambda row: row['days_since_first'] / row['transaction_count'] if row['transaction_count'] > 1 else 365,
                    axis=1
                )
            else:
                behavior_df['avg_days_between_purchases'] = 30  # Default

            # Add engagement score (simple calculation)
            behavior_df['engagement_score'] = behavior_df.apply(
                lambda row: min(1.0, (row['transaction_count'] / 50 + row['total_spend'] / 10000) / 2),
                axis=1
            )

            # Calculate preferred channel from transaction data using new method
            if not transactions_df.empty and 'customer_id' in transactions_df.columns:
                try:
                    preferred_channels = self._calculate_preferred_channels(transactions_df)
                    if not preferred_channels.empty:
                        behavior_df = behavior_df.merge(preferred_channels, on='customer_id', how='left')
                        behavior_df['preferred_channel'] = behavior_df['preferred_channel'].fillna('Unknown')
                        logger.info(f"Merged preferred_channel for {len(preferred_channels)} customers")
                    else:
                        behavior_df['preferred_channel'] = 'Unknown'
                except Exception as e:
                    logger.error(f"Error merging preferred channels: {e}")
                    behavior_df['preferred_channel'] = 'Unknown'
            else:
                behavior_df['preferred_channel'] = 'Unknown'

            # Calculate preferred category from transaction data using new method
            if not transactions_df.empty and 'customer_id' in transactions_df.columns:
                try:
                    preferred_categories = self._calculate_preferred_categories(transactions_df)
                    if not preferred_categories.empty:
                        behavior_df = behavior_df.merge(preferred_categories, on='customer_id', how='left')
                        behavior_df['preferred_category'] = behavior_df['preferred_category'].fillna('Unknown')
                        logger.info(f"Merged preferred_category for {len(preferred_categories)} customers")
                    else:
                        behavior_df['preferred_category'] = 'Unknown'
                except Exception as e:
                    logger.error(f"Error merging preferred categories: {e}")
                    behavior_df['preferred_category'] = 'Unknown'
            else:
                behavior_df['preferred_category'] = 'Unknown'

            # Calculate category diversity from actual transaction data if available
            if not transactions_df.empty and 'customer_id' in transactions_df.columns:
                try:
                    # Count unique categories per customer
                    if 'product_category' in transactions_df.columns:
                        category_counts = transactions_df.groupby('customer_id')['product_category'].nunique().to_dict()
                    elif 'item_number' in transactions_df.columns:
                        # Use first digit of item number as category proxy
                        transactions_df_temp = transactions_df.copy()
                        transactions_df_temp['category_proxy'] = transactions_df_temp['item_number'].astype(str).str[0]
                        category_counts = transactions_df_temp.groupby('customer_id')['category_proxy'].nunique().to_dict()
                    elif 'item_id' in transactions_df.columns:
                        # Use first digit of item_id as category proxy
                        transactions_df_temp = transactions_df.copy()
                        transactions_df_temp['category_proxy'] = transactions_df_temp['item_id'].astype(str).str[0]
                        category_counts = transactions_df_temp.groupby('customer_id')['category_proxy'].nunique().to_dict()
                    else:
                        category_counts = {}

                    behavior_df['category_diversity'] = behavior_df['customer_id'].map(category_counts).fillna(1)
                except Exception as e:
                    logger.debug(f"Could not calculate category diversity: {e}")
                    behavior_df['category_diversity'] = 1
            else:
                behavior_df['category_diversity'] = 1

            behavior_df['estimated_clv'] = behavior_df['total_spend'] * 1.5

            return behavior_df

        except Exception as e:
            logger.error(f"Error building behavior from transactions: {e}")
            return pd.DataFrame()

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_purchase_patterns(self, filters: Dict) -> Dict:
        """Analyze customer purchase patterns"""
        try:
            behavior_data = await self.get_behavior_data(filters)
            behavior_df = pd.DataFrame(behavior_data.get('rows', behavior_data.get('data', []))) if isinstance(behavior_data, dict) else behavior_data

            transaction_data = await self.data_service.get_transaction_details(filters)
            transaction_df = pd.DataFrame(transaction_data.get('rows', transaction_data.get('data', [])))

            return self._analyze_purchase_patterns_comprehensive(behavior_df, transaction_df)

        except Exception as e:
            logger.error(f"Error in get_purchase_patterns: {e}")
            return {}

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_product_preferences(self, filters: Dict) -> Dict:
        """Analyze product preferences"""
        try:
            behavior_data = await self.get_behavior_data(filters)
            behavior_df = pd.DataFrame(behavior_data.get('rows', behavior_data.get('data', []))) if isinstance(behavior_data, dict) else behavior_data

            transaction_data = await self.data_service.get_transaction_details(filters)
            transaction_df = pd.DataFrame(transaction_data.get('rows', transaction_data.get('data', [])))

            return self._analyze_product_preferences_comprehensive(behavior_df, transaction_df)

        except Exception as e:
            logger.error(f"Error in get_product_preferences: {e}")
            return {}

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_channel_usage(self, filters: Dict) -> Dict:
        """Analyze channel usage patterns"""
        try:
            behavior_data = await self.get_behavior_data(filters)
            behavior_df = pd.DataFrame(behavior_data.get('rows', behavior_data.get('data', []))) if isinstance(behavior_data, dict) else behavior_data

            transaction_data = await self.data_service.get_transaction_details(filters)
            transaction_df = pd.DataFrame(transaction_data.get('rows', transaction_data.get('data', [])))

            return self._analyze_channel_usage_comprehensive(behavior_df, transaction_df)

        except Exception as e:
            logger.error(f"Error in get_channel_usage: {e}")
            return {}

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_engagement_metrics(self, filters: Dict) -> Dict:
        """Calculate engagement metrics"""
        try:
            behavior_data = await self.get_behavior_data(filters)
            behavior_df = pd.DataFrame(behavior_data.get('rows', behavior_data.get('data', []))) if isinstance(behavior_data, dict) else behavior_data

            transaction_data = await self.data_service.get_transaction_details(filters)
            transaction_df = pd.DataFrame(transaction_data.get('rows', transaction_data.get('data', [])))

            return self._calculate_engagement_metrics_comprehensive(behavior_df, transaction_df)

        except Exception as e:
            logger.error(f"Error in get_engagement_metrics: {e}")
            return {}

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_customer_segments(self, filters: Dict) -> List[Dict]:
        """Get customer segmentation data"""
        try:
            behavior_data = await self.get_behavior_data(filters)
            behavior_df = pd.DataFrame(behavior_data.get('rows', behavior_data.get('data', []))) if isinstance(behavior_data, dict) else behavior_data

            return self._analyze_customer_segments(behavior_df)

        except Exception as e:
            logger.error(f"Error in get_customer_segments: {e}")
            return []

    @cache_dashboard_endpoint(dashboard_type='behavior', ttl=300)
    async def get_top_customers(self, filters: Dict, limit: int = 20) -> List[Dict]:
        """Get top customers by various metrics"""
        try:
            behavior_data = await self.get_behavior_data(filters)
            behavior_df = pd.DataFrame(behavior_data.get('rows', behavior_data.get('data', []))) if isinstance(behavior_data, dict) else behavior_data

            return self._get_top_customers_sync(behavior_df, filters, limit)

        except Exception as e:
            logger.error(f"Error in get_top_customers: {e}")
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
            logger.error(f"Error in export_data: {e}")
            return "" if format == "csv" else "[]"

    # === All comprehensive analysis methods from the fixed version ===

    def _calculate_comprehensive_kpis(self, behavior_df: pd.DataFrame, transaction_df: pd.DataFrame) -> Dict:
        """Calculate all KPI metrics"""

        # Calculate average frequency (days between purchases)
        avg_frequency = 0
        if 'avg_days_between_purchases' in behavior_df.columns:
            avg_frequency = float(behavior_df['avg_days_between_purchases'].mean())
        elif 'transaction_count' in behavior_df.columns and not behavior_df.empty:
            avg_counts = behavior_df['transaction_count'].mean()
            avg_frequency = 365 / avg_counts if avg_counts > 0 else 0

        # Calculate repeat purchase rate
        repeat_purchase_rate = 0
        if 'transaction_count' in behavior_df.columns:
            repeat_customers = len(behavior_df[behavior_df['transaction_count'] > 1])
            total_customers = len(behavior_df)
            repeat_purchase_rate = (repeat_customers / total_customers * 100) if total_customers > 0 else 0

        # Get top category - WITH NULL FILTERING
        top_category = 'N/A'
        if 'preferred_category' in behavior_df.columns:
            # Filter out null, None, and 'Unknown' values
            valid_categories = behavior_df[
                (behavior_df['preferred_category'].notna()) &
                (behavior_df['preferred_category'] != 'Unknown') &
                (behavior_df['preferred_category'] != '')
            ]['preferred_category']

            if not valid_categories.empty:
                mode_result = valid_categories.mode()
                if not mode_result.empty:
                    top_category = str(mode_result.iloc[0])

        # Get primary channel - WITH NULL FILTERING
        primary_channel = 'N/A'
        if 'preferred_channel' in behavior_df.columns:
            # Filter out null, None, and 'Unknown' values
            valid_channels = behavior_df[
                (behavior_df['preferred_channel'].notna()) &
                (behavior_df['preferred_channel'] != 'Unknown') &
                (behavior_df['preferred_channel'] != '')
            ]['preferred_channel']

            if not valid_channels.empty:
                mode_result = valid_channels.mode()
                if not mode_result.empty:
                    primary_channel = str(mode_result.iloc[0])

        return {
            'totalCustomers': len(behavior_df),
            'avgOrderValue': float(behavior_df['avg_order_value'].mean()) if 'avg_order_value' in behavior_df.columns else 0,
            'avgTransactionCount': float(behavior_df['transaction_count'].mean()) if 'transaction_count' in behavior_df.columns else 0,
            'customerRetentionRate': self._calculate_retention_rate(behavior_df),
            'categoryDiversity': float(behavior_df['category_diversity'].mean()) if 'category_diversity' in behavior_df.columns else 0,
            'avgDaysBetweenPurchases': avg_frequency,
            'repeatPurchaseRate': round(repeat_purchase_rate, 2),
            'avgEngagementScore': float(behavior_df['engagement_score'].mean()) if 'engagement_score' in behavior_df.columns and behavior_df['engagement_score'].notna().any() and behavior_df['engagement_score'].sum() > 0 else 0,
            'churnRiskPercentage': self._calculate_churn_risk_percentage(behavior_df),
            'topCategory': top_category,
            'primaryChannel': primary_channel
        }

    def _analyze_purchase_patterns_comprehensive(self, behavior_df: pd.DataFrame, transaction_df: pd.DataFrame) -> Dict:
        """Analyze purchase patterns with all required data"""

        patterns = {
            'frequency_distribution': {},
            'avg_days_between_purchases': 0,
            'avgDaysBetweenPurchases': 0,  # Duplicate for compatibility
            'spend_patterns': {},
            'time_series_data': [],
            'purchase_trends': {},
            'repeatPurchaseRate': 0,
            'avgDaysSinceLastPurchase': 0,
            'purchaseTrend': 0,
            'avgOrderValue': 0
        }

        try:
            if not behavior_df.empty:
                # Frequency distribution
                if 'transaction_count' in behavior_df.columns:
                    behavior_df['frequency_category'] = pd.cut(
                        behavior_df['transaction_count'].fillna(0),
                        bins=[0, 1, 5, 10, float('inf')],
                        labels=['One-time', 'Occasional', 'Regular', 'Frequent']
                    )
                    freq_dist = behavior_df['frequency_category'].value_counts()
                    patterns['frequency_distribution'] = {
                        str(k): int(v) for k, v in freq_dist.items()
                    }

                # Average days between purchases
                if 'avg_days_between_purchases' in behavior_df.columns:
                    avg_days = float(behavior_df['avg_days_between_purchases'].mean())
                    patterns['avg_days_between_purchases'] = avg_days
                    patterns['avgDaysBetweenPurchases'] = avg_days
                elif 'transaction_count' in behavior_df.columns:
                    avg_counts = behavior_df['transaction_count'].mean()
                    avg_days = 365 / avg_counts if avg_counts > 1 else 365
                    patterns['avg_days_between_purchases'] = avg_days
                    patterns['avgDaysBetweenPurchases'] = avg_days

                # Average order value
                if 'avg_order_value' in behavior_df.columns:
                    patterns['avgOrderValue'] = float(behavior_df['avg_order_value'].mean())

                # Spend patterns
                if 'total_spend' in behavior_df.columns and behavior_df['total_spend'].sum() > 0:
                    try:
                        # Only create bins if we have non-zero values
                        non_zero_spends = behavior_df[behavior_df['total_spend'] > 0]['total_spend']
                        if len(non_zero_spends) > 4:
                            spend_bins = pd.qcut(non_zero_spends, q=4, labels=['Low', 'Medium', 'High', 'Very High'])
                            spend_dist = spend_bins.value_counts()
                            patterns['spend_patterns'] = {
                                str(k): int(v) for k, v in spend_dist.items()
                            }
                    except Exception as e:
                        logger.debug(f"Could not create spend patterns: {e}")

                # Calculate repeat purchase rate
                if 'transaction_count' in behavior_df.columns:
                    repeat_customers = len(behavior_df[behavior_df['transaction_count'] > 1])
                    total_customers = len(behavior_df)
                    patterns['repeatPurchaseRate'] = round(repeat_customers / total_customers, 2) if total_customers > 0 else 0

                # Average days since last purchase
                if 'last_purchase_date' in behavior_df.columns:
                    try:
                        behavior_df['last_purchase_date'] = pd.to_datetime(behavior_df['last_purchase_date'])
                        current_date = pd.Timestamp('2021-12-31')
                        behavior_df['days_since_last'] = (current_date - behavior_df['last_purchase_date']).dt.days
                        patterns['avgDaysSinceLastPurchase'] = float(behavior_df['days_since_last'].mean())
                    except:
                        patterns['avgDaysSinceLastPurchase'] = 30

                # Purchase trend (calculate from transaction data if possible)
                # Calculate real trend by comparing first half vs second half of period
                # Support both txn_date and transaction_date field names
                date_col = 'txn_date' if 'txn_date' in transaction_df.columns else 'transaction_date'
                if not transaction_df.empty and date_col in transaction_df.columns:
                    try:
                        transaction_df_temp = transaction_df.copy()
                        transaction_df_temp[date_col] = pd.to_datetime(transaction_df_temp[date_col])
                        mid_date = transaction_df_temp[date_col].median()

                        first_half = transaction_df_temp[transaction_df_temp[date_col] <= mid_date]
                        second_half = transaction_df_temp[transaction_df_temp[date_col] > mid_date]

                        first_half_avg = first_half.groupby('customer_id').size().mean() if not first_half.empty else 0
                        second_half_avg = second_half.groupby('customer_id').size().mean() if not second_half.empty else 0

                        if first_half_avg > 0:
                            patterns['purchaseTrend'] = round(((second_half_avg - first_half_avg) / first_half_avg) * 100, 2)
                        else:
                            patterns['purchaseTrend'] = 0
                    except Exception as e:
                        logger.debug(f"Could not calculate purchase trend: {e}")
                        patterns['purchaseTrend'] = 0
                else:
                    patterns['purchaseTrend'] = 0

            # Generate time series data
            # Support both txn_date and transaction_date field names
            date_col = 'txn_date' if 'txn_date' in transaction_df.columns else 'transaction_date'
            if not transaction_df.empty and date_col in transaction_df.columns:
                try:
                    transaction_df_copy = transaction_df.copy()
                    transaction_df_copy['date'] = pd.to_datetime(transaction_df_copy[date_col]).dt.date

                    # Determine the sales amount column name
                    sales_col = 'net_sales_amount' if 'net_sales_amount' in transaction_df_copy.columns else 'sales_amount'

                    daily_stats = transaction_df_copy.groupby('date').agg({
                        'customer_id': 'count',
                        sales_col: 'mean'
                    }).reset_index()
                    daily_stats.columns = ['date', 'purchase_count', 'avg_order_value']

                    patterns['time_series_data'] = [
                        {
                            'date': str(row['date']),
                            'purchase_count': int(row['purchase_count']),
                            'avg_order_value': float(row['avg_order_value'])
                        }
                        for _, row in daily_stats.head(30).iterrows()
                    ]
                except Exception as e:
                    logger.debug(f"Could not generate time series data: {e}")
                    patterns['time_series_data'] = []

            # Leave empty if no real data available - frontend will show "no data" message

        except Exception as e:
            logger.error(f"Error in analyze_purchase_patterns: {e}")

        return patterns

    def _analyze_product_preferences_comprehensive(self, behavior_df: pd.DataFrame, transaction_df: pd.DataFrame) -> Dict:
        """Analyze product preferences with all required data"""

        preferences = {
            'topCategories': [],
            'top_categories': [],  # Duplicate for compatibility
            'top_products': [],
            'category_distribution': {},
            'product_diversity_score': 0,
            'trending_categories': []
        }

        try:
            # Get category distribution from transaction data using product_category field
            if not transaction_df.empty and 'product_category' in transaction_df.columns:
                # Use the actual product_category field
                # Format as "Category X"
                transaction_df['category'] = transaction_df['product_category'].apply(
                    lambda x: f"Category {int(x)}" if pd.notna(x) and str(x).replace('.','').replace('-','').isdigit() else "Other"
                )

                # Determine the sales amount column name
                sales_col = 'net_sales_amount' if 'net_sales_amount' in transaction_df.columns else 'sales_amount'

                # Calculate category statistics
                category_stats = transaction_df.groupby('category').agg({
                    'customer_id': 'nunique',
                    sales_col: ['sum', 'mean']
                }).reset_index()

                category_stats.columns = ['category', 'customers', 'total_sales', 'avg_sales']
                category_stats = category_stats.sort_values('total_sales', ascending=False).head(10)

                total_customers = transaction_df['customer_id'].nunique()

                # Create topCategories with proper structure
                top_cats = []
                for _, row in category_stats.iterrows():
                    cat_data = {
                        'category': str(row['category']),
                        'name': str(row['category']),
                        'customers': int(row['customers']),
                        'percentage': round(row['customers'] / total_customers * 100, 2) if total_customers > 0 else 0,
                        'avgSpend': float(row['avg_sales']),
                        'sales': float(row['total_sales'])
                    }
                    top_cats.append(cat_data)

                preferences['topCategories'] = top_cats
                preferences['top_categories'] = top_cats  # Duplicate for compatibility

                # Category distribution
                preferences['category_distribution'] = {
                    cat_data['category']: cat_data['percentage']
                    for cat_data in top_cats
                }

            # Generate top products from real transaction data
            # Support both item_number and item_id field names
            item_col = 'item_number' if 'item_number' in transaction_df.columns else 'item_id'
            if not transaction_df.empty and item_col in transaction_df.columns:
                try:
                    # Determine the sales amount column name
                    sales_col = 'net_sales_amount' if 'net_sales_amount' in transaction_df.columns else 'sales_amount'

                    product_counts = transaction_df.groupby(item_col).agg({
                        'customer_id': 'count',
                        sales_col: 'sum'
                    }).reset_index()
                    product_counts.columns = ['product_name', 'quantity', 'revenue']
                    product_counts = product_counts.nlargest(10, 'quantity')

                    preferences['top_products'] = [
                        {
                            'product_name': str(row['product_name']),
                            'quantity': int(row['quantity']),
                            'revenue': float(row['revenue'])
                        }
                        for _, row in product_counts.iterrows()
                    ]
                except Exception as e:
                    logger.debug(f"Could not generate top products: {e}")
                    preferences['top_products'] = []

            # Leave empty if no real data - frontend will show "no data" message

            # Calculate diversity score
            if 'category_diversity' in behavior_df.columns:
                preferences['product_diversity_score'] = float(behavior_df['category_diversity'].mean())
            else:
                preferences['product_diversity_score'] = 5.5

            # Trending categories - would need historical data to calculate real growth
            # Leaving empty for now as we don't have multi-period comparison
            preferences['trending_categories'] = []

        except Exception as e:
            logger.error(f"Error in analyze_product_preferences: {e}")

        return preferences

    def _analyze_channel_usage_comprehensive(self, behavior_df: pd.DataFrame, transaction_df: pd.DataFrame) -> Dict:
        """Analyze channel usage with all required data"""

        channel_data = {
            'channel_distribution': {},
            'channelDistribution': {},  # Duplicate for compatibility
            'channel_trends': [],
            'preferred_channels': [],
            'channel_effectiveness': {},
            'channel_performance': []  # For frontend Channel Performance graph
        }

        try:
            # Get channel distribution from real data
            if 'preferred_channel' in behavior_df.columns:
                channel_counts = behavior_df['preferred_channel'].value_counts()
                total = len(behavior_df)

                distribution = {
                    str(channel): round(count / total * 100, 2)
                    for channel, count in channel_counts.items()
                }

                channel_data['channel_distribution'] = distribution
                channel_data['channelDistribution'] = distribution

                # Calculate average order value by channel if possible
                if not transaction_df.empty and 'sales_channel' in transaction_df.columns:
                    try:
                        # Determine the sales amount column name
                        sales_col = 'net_sales_amount' if 'net_sales_amount' in transaction_df.columns else 'sales_amount'

                        channel_stats = transaction_df.groupby('sales_channel').agg({
                            sales_col: 'mean'
                        }).reset_index()
                        channel_aov_map = dict(zip(channel_stats['sales_channel'], channel_stats[sales_col]))
                    except:
                        channel_aov_map = {}
                else:
                    channel_aov_map = {}

                # Preferred channels with details
                channel_data['preferred_channels'] = [
                    {
                        'channel': str(channel),
                        'percentage': round(count / total * 100, 2),
                        'customers': int(count),
                        'avgOrderValue': float(channel_aov_map.get(channel, 0)) if channel_aov_map else 0
                    }
                    for channel, count in channel_counts.items()
                ]
            else:
                # No channel data available - return empty
                channel_data['channel_distribution'] = {}
                channel_data['channelDistribution'] = {}
                channel_data['preferred_channels'] = []

            # Channel effectiveness - calculate from transaction data if available
            if not transaction_df.empty and 'sales_channel' in transaction_df.columns:
                try:
                    # Determine the sales amount column name
                    sales_col = 'net_sales_amount' if 'net_sales_amount' in transaction_df.columns else 'sales_amount'

                    # Calculate conversion and average value by channel
                    channel_stats = transaction_df.groupby('sales_channel').agg({
                        'customer_id': 'nunique',
                        sales_col: 'mean'
                    }).reset_index()

                    total_customers = behavior_df['customer_id'].nunique() if 'customer_id' in behavior_df.columns else len(behavior_df)

                    channel_data['channel_effectiveness'] = {
                        str(row['sales_channel']): {
                            'conversion': round((row['customer_id'] / total_customers * 100), 2) if total_customers > 0 else 0,
                            'avgValue': float(row[sales_col])
                        }
                        for _, row in channel_stats.iterrows()
                    }
                except Exception as e:
                    logger.debug(f"Could not calculate channel effectiveness: {e}")
                    channel_data['channel_effectiveness'] = {}
            else:
                channel_data['channel_effectiveness'] = {}

            # Channel trends - would need time-series data by channel
            # Leaving empty as we don't have historical channel data
            channel_data['channel_trends'] = []

            # Channel performance - calculate conversion rate and avg order value by channel
            if not transaction_df.empty:
                # Support both sales_channel and line_type field names
                channel_field = 'sales_channel' if 'sales_channel' in transaction_df.columns else 'line_type'
                if channel_field in transaction_df.columns:
                    try:
                        # Determine the sales amount column name
                        sales_col = 'net_sales_amount' if 'net_sales_amount' in transaction_df.columns else 'sales_amount'

                        # Group by channel and calculate metrics
                        channel_perf = transaction_df.groupby(channel_field).agg({
                            'customer_id': 'nunique',  # Unique customers per channel
                            sales_col: ['mean', 'sum', 'count']  # AOV, total sales, transaction count
                        }).reset_index()

                        channel_perf.columns = [channel_field, 'unique_customers', 'avg_order_value', 'total_sales', 'transaction_count']

                        # Calculate conversion rate (customers in channel / total customers)
                        total_customers = transaction_df['customer_id'].nunique()

                        channel_data['channel_performance'] = [
                            {
                                'channel': str(row[channel_field]),
                                'conversion_rate': round(row['unique_customers'] / total_customers, 4) if total_customers > 0 else 0,
                                'avg_order_value': float(row['avg_order_value']),
                                'total_sales': float(row['total_sales']),
                                'transaction_count': int(row['transaction_count'])
                            }
                            for _, row in channel_perf.iterrows()
                        ]
                    except Exception as e:
                        logger.debug(f"Could not calculate channel performance: {e}")
                        channel_data['channel_performance'] = []

        except Exception as e:
            logger.error(f"Error in analyze_channel_usage: {e}")

        return channel_data

    def _calculate_engagement_metrics_comprehensive(self, behavior_df: pd.DataFrame, transaction_df: pd.DataFrame) -> Dict:
        """Calculate comprehensive engagement metrics"""

        metrics = {
            'recency_distribution': {},
            'engagement_distribution': {},
            'avg_engagement_score': 0,
            'churn_risk_percentage': 0,
            'engagement_trends': [],
            'engagement_by_segment': {}
        }

        try:
            # Engagement score
            if 'engagement_score' in behavior_df.columns:
                metrics['avg_engagement_score'] = float(behavior_df['engagement_score'].mean())

                # Engagement distribution
                behavior_df['engagement_level'] = pd.cut(
                    behavior_df['engagement_score'],
                    bins=[0, 0.3, 0.6, 1.0],
                    labels=['Low', 'Medium', 'High']
                )
                eng_dist = behavior_df['engagement_level'].value_counts()
                metrics['engagement_distribution'] = {
                    str(k): int(v) for k, v in eng_dist.items()
                }

                # Churn risk
                at_risk = len(behavior_df[behavior_df['engagement_score'] < 0.3])
                total = len(behavior_df)
                metrics['churn_risk_percentage'] = round(at_risk / total * 100, 2) if total > 0 else 0

            else:
                # Default values
                metrics['avg_engagement_score'] = 0.65
                metrics['engagement_distribution'] = {'High': 30, 'Medium': 50, 'Low': 20}
                metrics['churn_risk_percentage'] = 15.5

            # Recency distribution
            if 'last_purchase_date' in behavior_df.columns:
                try:
                    behavior_df['last_purchase_date'] = pd.to_datetime(behavior_df['last_purchase_date'])
                    current_date = pd.Timestamp('2021-12-31')
                    behavior_df['days_since_last'] = (current_date - behavior_df['last_purchase_date']).dt.days

                    behavior_df['recency_category'] = pd.cut(
                        behavior_df['days_since_last'],
                        bins=[0, 30, 60, 90, float('inf')],
                        labels=['<30 days', '30-60 days', '60-90 days', '90+ days']
                    )
                    rec_dist = behavior_df['recency_category'].value_counts()
                    metrics['recency_distribution'] = {
                        str(k): int(v) for k, v in rec_dist.items()
                    }
                except:
                    pass

            # Default recency if not calculated
            if not metrics['recency_distribution']:
                metrics['recency_distribution'] = {
                    '<30 days': 40,
                    '30-60 days': 30,
                    '60-90 days': 20,
                    '90+ days': 10
                }

            # Engagement trends - would need historical engagement data
            # Leaving empty as we don't have time-series engagement data
            metrics['engagement_trends'] = []

            # Engagement by segment
            if 'customer_type' in behavior_df.columns and 'engagement_score' in behavior_df.columns:
                seg_engagement = behavior_df.groupby('customer_type')['engagement_score'].mean()
                metrics['engagement_by_segment'] = {
                    str(seg): float(score)
                    for seg, score in seg_engagement.items()
                }
            else:
                metrics['engagement_by_segment'] = {
                    'Premium': 0.85,
                    'Regular': 0.65,
                    'Occasional': 0.45,
                    'New': 0.55
                }

            # CRITICAL FIX: Calculate engagement_scores for frontend radar chart
            # Since we don't have real email/web/mobile/social/support data, use reasonable approach
            base_engagement = metrics.get('avg_engagement_score', 0.5)

            engagement_scores = {
                'email': 0.0,     # No email tracking in dataset
                'web': 0.0,       # No web analytics integrated
                'mobile': 0.0,    # No mobile app data
                'social': 0.0,    # No social media integration
                'support': 0.0,   # No support ticket system
                'loyalty': base_engagement  # Use calculated engagement as loyalty proxy
            }

            metrics['engagement_scores'] = engagement_scores

            # CRITICAL FIX: Calculate engagement_segments for frontend pyramid chart
            engagement_segments = {}
            if 'customer_type' in behavior_df.columns and 'engagement_score' in behavior_df.columns:
                # Group by customer type and calculate segment metrics
                segment_stats = behavior_df.groupby('customer_type').agg({
                    'customer_id': 'count',
                    'engagement_score': 'mean',
                    'total_spend': 'mean'
                }).reset_index()

                for _, row in segment_stats.iterrows():
                    segment_key = str(row['customer_type']).lower().replace(' ', '_')
                    engagement_segments[segment_key] = {
                        'customer_count': int(row['customer_id']),
                        'score': float(row['engagement_score']),
                        'avg_value': float(row['total_spend']) if 'total_spend' in row else 0.0
                    }
            else:
                # Fallback: Create basic segments from engagement score distribution
                if 'engagement_score' in behavior_df.columns:
                    high_eng = behavior_df[behavior_df['engagement_score'] >= 0.7]
                    med_eng = behavior_df[(behavior_df['engagement_score'] >= 0.4) & (behavior_df['engagement_score'] < 0.7)]
                    low_eng = behavior_df[behavior_df['engagement_score'] < 0.4]

                    engagement_segments = {
                        'highly_engaged': {
                            'customer_count': len(high_eng),
                            'score': float(high_eng['engagement_score'].mean()) if not high_eng.empty else 0.75,
                            'avg_value': float(high_eng['total_spend'].mean()) if not high_eng.empty and 'total_spend' in high_eng.columns else 0.0
                        },
                        'moderately_engaged': {
                            'customer_count': len(med_eng),
                            'score': float(med_eng['engagement_score'].mean()) if not med_eng.empty else 0.55,
                            'avg_value': float(med_eng['total_spend'].mean()) if not med_eng.empty and 'total_spend' in med_eng.columns else 0.0
                        },
                        'low_engaged': {
                            'customer_count': len(low_eng),
                            'score': float(low_eng['engagement_score'].mean()) if not low_eng.empty else 0.25,
                            'avg_value': float(low_eng['total_spend'].mean()) if not low_eng.empty and 'total_spend' in low_eng.columns else 0.0
                        }
                    }

            metrics['engagement_segments'] = engagement_segments

        except Exception as e:
            logger.error(f"Error in calculate_engagement_metrics: {e}")

        return metrics

    def _calculate_behavioral_metrics_comprehensive(self, behavior_df: pd.DataFrame, transaction_df: pd.DataFrame) -> Dict:
        """Calculate comprehensive behavioral metrics"""

        return {
            'product_preferences': self._analyze_product_preferences_comprehensive(behavior_df, transaction_df),
            'channel_usage': self._analyze_channel_usage_comprehensive(behavior_df, transaction_df),
            'purchase_frequency': {
                'avg_days_between': self._calculate_avg_days_between_purchases(behavior_df),
                'frequency_segments': self._calculate_frequency_segments(behavior_df)
            },
            'spending_patterns': {
                'avg_order_value': float(behavior_df['avg_order_value'].mean()) if 'avg_order_value' in behavior_df.columns else 0,
                'total_spend_distribution': self._calculate_spend_distribution(behavior_df)
            }
        }

    def _get_top_customers_sync(self, behavior_df: pd.DataFrame, filters: Dict, limit: int = 20) -> List[Dict]:
        """Get top customers with all required fields"""

        try:
            if behavior_df.empty:
                return []

            # Filter out customers with no transactions, then sort by total spend
            if 'total_spend' in behavior_df.columns:
                # Only include customers who have made purchases (total_spend > 0)
                active_customers = behavior_df[behavior_df['total_spend'] > 0]
                top_customers = active_customers.nlargest(min(limit, len(active_customers)), 'total_spend') if not active_customers.empty else behavior_df.head(limit)
            else:
                top_customers = behavior_df.head(limit)

            results = []
            for _, row in top_customers.iterrows():
                # Calculate metrics
                avg_days = 365 / row.get('transaction_count', 1) if row.get('transaction_count', 0) > 1 else 365

                # Determine risk level based on engagement score
                engagement_score = row.get('engagement_score', 0.5)
                risk_level = 'High' if engagement_score < 0.3 else 'Medium' if engagement_score < 0.6 else 'Low'

                results.append({
                    'customerId': str(row.get('customer_id', '')),
                    'customerName': str(row.get('customer_name', f"Customer {row.get('customer_id', '')}")),
                    'customerType': str(row.get('customer_type', 'Regular')),
                    'segment': str(row.get('customer_type', 'Regular')),
                    'totalSpend': float(row.get('total_spend', 0)),
                    'transactionCount': int(row.get('transaction_count', 0)),
                    'avgOrderValue': float(row.get('avg_order_value', 0)),
                    'avgDaysBetweenPurchases': avg_days,
                    'lastPurchaseDate': str(row.get('last_purchase_date', '')) if pd.notna(row.get('last_purchase_date')) else None,
                    'preferredCategory': str(row.get('preferred_category', '')) if pd.notna(row.get('preferred_category')) else None,
                    'preferredChannel': str(row.get('preferred_channel', '')) if pd.notna(row.get('preferred_channel')) else None,
                    'estimatedClv': float(row.get('estimated_clv', 0)),
                    'engagementScore': float(engagement_score),
                    'engagement_score': float(engagement_score),
                    'frequencyCategory': str(row.get('frequency_category', 'Regular')),
                    'riskLevel': risk_level
                })

            return results

        except Exception as e:
            logger.error(f"Error in _get_top_customers_sync: {e}")
            return []

    def _analyze_customer_segments(self, behavior_df: pd.DataFrame) -> List[Dict]:
        """Analyze customer segments"""

        segments = []

        try:
            if 'customer_type' in behavior_df.columns:
                agg_dict = {'customer_id': 'count'}

                if 'total_spend' in behavior_df.columns:
                    agg_dict['total_spend'] = 'mean'

                if 'transaction_count' in behavior_df.columns:
                    agg_dict['transaction_count'] = 'mean'

                if 'engagement_score' in behavior_df.columns:
                    agg_dict['engagement_score'] = 'mean'

                if len(agg_dict) > 1:
                    segment_stats = behavior_df.groupby('customer_type').agg(agg_dict).reset_index()
                else:
                    # If only customer_id count available, create basic stats
                    segment_stats = behavior_df.groupby('customer_type').size().reset_index(name='customer_id')

                total_customers = len(behavior_df)

                for _, row in segment_stats.iterrows():
                    segments.append({
                        'segment': str(row['customer_type']),
                        'customerCount': int(row['customer_id']),
                        'percentage': round(row['customer_id'] / total_customers * 100, 2),
                        'avgSpend': float(row.get('total_spend', 0)),
                        'avgTransactions': float(row.get('transaction_count', 0)),
                        'avgEngagement': float(row.get('engagement_score', 0.5))
                    })

            # Provide default segments if empty
            if not segments:
                segments = [
                    {'segment': 'Premium', 'customerCount': 500, 'percentage': 25, 'avgSpend': 5000, 'avgTransactions': 20, 'avgEngagement': 0.85},
                    {'segment': 'Regular', 'customerCount': 800, 'percentage': 40, 'avgSpend': 2000, 'avgTransactions': 10, 'avgEngagement': 0.65},
                    {'segment': 'Occasional', 'customerCount': 500, 'percentage': 25, 'avgSpend': 500, 'avgTransactions': 3, 'avgEngagement': 0.45},
                    {'segment': 'New', 'customerCount': 200, 'percentage': 10, 'avgSpend': 250, 'avgTransactions': 1, 'avgEngagement': 0.55}
                ]

        except Exception as e:
            logger.error(f"Error in analyze_customer_segments: {e}")

        return segments

    # === Helper methods ===

    def _calculate_retention_rate(self, behavior_df: pd.DataFrame) -> float:
        """Calculate customer retention rate"""
        try:
            if 'transaction_count' in behavior_df.columns:
                returning_customers = len(behavior_df[behavior_df['transaction_count'] > 1])
                total_customers = len(behavior_df)
                return round(returning_customers / total_customers * 100, 2) if total_customers > 0 else 0
        except:
            pass
        return 65.5

    def _calculate_churn_risk_percentage(self, behavior_df: pd.DataFrame) -> float:
        """Calculate churn risk percentage"""
        try:
            if 'engagement_score' in behavior_df.columns:
                at_risk = len(behavior_df[behavior_df['engagement_score'] < 0.3])
                total = len(behavior_df)
                return round(at_risk / total * 100, 2) if total > 0 else 0
        except:
            pass
        return 15.0

    def _calculate_avg_days_between_purchases(self, behavior_df: pd.DataFrame) -> float:
        """Calculate average days between purchases"""
        if 'avg_days_between_purchases' in behavior_df.columns:
            return float(behavior_df['avg_days_between_purchases'].mean())
        elif 'transaction_count' in behavior_df.columns:
            avg_counts = behavior_df['transaction_count'].mean()
            return 365 / avg_counts if avg_counts > 1 else 365
        return 30.0

    def _calculate_frequency_segments(self, behavior_df: pd.DataFrame) -> Dict:
        """Calculate frequency segments"""
        if 'transaction_count' in behavior_df.columns:
            behavior_df['freq_segment'] = pd.cut(
                behavior_df['transaction_count'],
                bins=[0, 1, 5, 10, float('inf')],
                labels=['One-time', 'Occasional', 'Regular', 'Frequent']
            )
            freq_dist = behavior_df['freq_segment'].value_counts()
            return {str(k): int(v) for k, v in freq_dist.items()}
        return {'One-time': 200, 'Occasional': 400, 'Regular': 300, 'Frequent': 100}

    def _calculate_spend_distribution(self, behavior_df: pd.DataFrame) -> Dict:
        """Calculate spend distribution"""
        if 'total_spend' in behavior_df.columns:
            spend_bins = pd.qcut(behavior_df['total_spend'], q=4, labels=['Low', 'Medium', 'High', 'Very High'])
            spend_dist = spend_bins.value_counts()
            return {str(k): int(v) for k, v in spend_dist.items()}
        return {'Low': 250, 'Medium': 250, 'High': 250, 'Very High': 250}

    def _generate_behavior_insights(self, behavior_df: pd.DataFrame, transaction_df: pd.DataFrame) -> List[Dict]:
        """Generate behavioral insights with priority levels and actionable recommendations"""

        insights = []

        try:
            # Insight 1: High-frequency buyer analysis
            if 'transaction_count' in behavior_df.columns:
                high_freq = len(behavior_df[behavior_df['transaction_count'] > 10])
                total = len(behavior_df)
                high_freq_pct = (high_freq / total * 100) if total > 0 else 0

                if high_freq_pct > 25:
                    insights.append({
                        'type': 'positive',
                        'priority': 'HIGH',
                        'message': f'{high_freq:,} customers ({high_freq_pct:.1f}%) are frequent buyers (>10 transactions), representing core revenue base. **Action:** Launch VIP loyalty program within 30 days with exclusive benefits and early access. **Expected outcome:** 15-20% increase in repeat purchase rate, ${(high_freq * 500):,.0f}+ incremental annual revenue.'
                    })
                elif high_freq > 0:
                    insights.append({
                        'type': 'info',
                        'priority': 'MODERATE',
                        'message': f'{high_freq:,} customers show high purchase frequency. **Action:** Implement targeted retention campaigns with personalized product recommendations within 14 days. **Expected outcome:** 10-12% improvement in customer lifetime value.'
                    })

            # Insight 2: Category concentration risk
            if 'preferred_category' in behavior_df.columns:
                valid_categories = behavior_df[
                    (behavior_df['preferred_category'].notna()) &
                    (behavior_df['preferred_category'] != 'Unknown')
                ]['preferred_category']

                if not valid_categories.empty:
                    top_category = valid_categories.mode().iloc[0]
                    top_cat_count = (valid_categories == top_category).sum()
                    top_cat_pct = (top_cat_count / len(valid_categories) * 100)

                    if top_cat_pct > 50:
                        insights.append({
                            'type': 'warning',
                            'priority': 'CRITICAL',
                            'message': f'{top_cat_pct:.1f}% of customers prefer {top_category}, indicating severe category concentration risk. **Action:** Launch immediate cross-category promotion campaign with bundled discounts within 7 days. **Expected outcome:** 15-20% increase in category diversity score, reduced revenue volatility.'
                        })
                    elif top_cat_pct > 35:
                        insights.append({
                            'type': 'warning',
                            'priority': 'MODERATE',
                            'message': f'{top_cat_pct:.1f}% concentration in {top_category}. **Action:** Develop product discovery campaign highlighting complementary categories within 14 days. **Expected outcome:** 10-15% improvement in cross-category purchases.'
                        })

            # Insight 3: Channel distribution analysis
            if 'preferred_channel' in behavior_df.columns:
                valid_channels = behavior_df[
                    (behavior_df['preferred_channel'].notna()) &
                    (behavior_df['preferred_channel'] != 'Unknown')
                ]['preferred_channel']

                if not valid_channels.empty:
                    channel_dist = valid_channels.value_counts(normalize=True) * 100
                    dominant_channel = channel_dist.idxmax()
                    dominant_pct = channel_dist.max()

                    if dominant_pct > 85:
                        insights.append({
                            'type': 'warning',
                            'priority': 'CRITICAL',
                            'message': f'{dominant_pct:.1f}% of customers rely on {dominant_channel} as primary channel, creating single-point-of-failure risk. **Action:** Launch multi-channel engagement initiative (email, mobile app, social commerce) within 7 days. **Expected outcome:** 25-35% multi-channel adoption rate, improved business resilience.'
                        })

            # Insight 4: Low engagement alert
            if 'engagement_score' in behavior_df.columns:
                low_engagement = len(behavior_df[behavior_df['engagement_score'] < 0.3])
                total = len(behavior_df)

                if low_engagement > 0:
                    low_eng_pct = (low_engagement / total * 100)
                    if low_eng_pct > 15:
                        insights.append({
                            'type': 'warning',
                            'priority': 'HIGH',
                            'message': f'{low_engagement:,} customers ({low_eng_pct:.1f}%) show low engagement (score < 0.3), indicating high churn risk. **Action:** Deploy automated re-engagement campaign with personalized win-back offers within 48 hours. **Expected outcome:** 25-35% reactivation rate, ${(low_engagement * 200):,.0f} recovered revenue.'
                        })

            # Insight 5: Purchase frequency opportunities
            if 'avg_days_between_purchases' in behavior_df.columns:
                avg_days = behavior_df['avg_days_between_purchases'].mean()
                if avg_days > 60:
                    insights.append({
                        'type': 'info',
                        'priority': 'MODERATE',
                        'message': f'Average {avg_days:.0f} days between purchases presents opportunity for frequency optimization. **Action:** Implement subscription/auto-replenishment program for consumable products within 21 days. **Expected outcome:** 30-40% reduction in purchase cycle, 2x customer lifetime value for subscribers.'
                    })

            # Fallback if no specific insights generated
            if not insights:
                insights = [{
                    'type': 'info',
                    'priority': 'INFO',
                    'message': f'Dashboard analysis completed for {len(behavior_df):,} customers. Review individual segment performance metrics for targeted optimization opportunities.'
                }]

        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            insights = [{
                'type': 'info',
                'priority': 'INFO',
                'message': 'Customer behavior patterns are within expected ranges. Continue monitoring for trend changes.'
            }]

        return insights

    def _get_empty_response(self) -> Dict:
        """Return empty response structure"""

        return {
            'kpiMetrics': {
                'totalCustomers': 0,
                'avgOrderValue': 0,
                'avgTransactionCount': 0,
                'customerRetentionRate': 0,
                'categoryDiversity': 0,
                'avgDaysBetweenPurchases': 0,
                'repeatPurchaseRate': 0,
                'avgEngagementScore': 0,
                'churnRiskPercentage': 0
            },
            'mainData': {
                'purchasePatterns': {
                    'frequency_distribution': {},
                    'avg_days_between_purchases': 0,
                    'spend_patterns': {},
                    'time_series_data': [],
                    'repeatPurchaseRate': 0
                },
                'productPreferences': {
                    'topCategories': [],
                    'top_products': [],
                    'category_distribution': {}
                },
                'channelUsage': {
                    'channel_distribution': {},
                    'channelDistribution': {}
                },
                'engagementMetrics': {
                    'recency_distribution': {},
                    'engagement_distribution': {},
                    'avg_engagement_score': 0,
                    'churn_risk_percentage': 0
                },
                'customerSegments': [],
                'topCustomers': [],
                'behavioralMetrics': {}
            },
            'insights': [],
            'metadata': {}
        }

    @cache_dashboard_endpoint(dashboard_type="customer_behavior_ai_insights", ttl=1800)
    async def _get_cached_ai_insights(
        self,
        filters: Dict,
        kpis: Dict,
        purchase_patterns: List,
        product_preferences: List,
        engagement_metrics: Dict
    ) -> List[str]:
        """Get cached AI insights with 30-minute TTL"""
        try:
            ai_insights = await asyncio.to_thread(
                self._generate_ai_insights,
                kpis,
                purchase_patterns,
                product_preferences,
                engagement_metrics,
                filters
            )
            return ai_insights
        except Exception as e:
            logger.error(f"[CustomerBehaviorProcessingService] Error generating AI insights: {e}")
            return []

    def _generate_ai_insights(
        self,
        kpis: Dict,
        purchase_patterns: List,
        product_preferences: List,
        engagement_metrics: Dict,
        filters: Optional[Dict] = None
    ) -> List[str]:
        """Generate AI-powered insights using Gemini"""
        try:
            from lib.ai_insights_generator import generate_ai_insights

            # Prepare KPIs dict
            kpis_dict = {
                'avgPurchaseFrequency': kpis.get('avgFrequency', 0),
                'avgOrderValue': kpis.get('avgOrderValue', 0),
                'avgEngagementScore': kpis.get('avgEngagement', 0),
                'topCategory': kpis.get('topCategory', 'N/A'),
                'primaryChannel': kpis.get('primaryChannel', 'N/A')
            }

            # Prepare data summary
            data_summary = {
                'totalPatterns': len(purchase_patterns),
                'totalPreferences': len(product_preferences),
                'engagementMetrics': engagement_metrics,
                'topPurchasePattern': purchase_patterns[0] if purchase_patterns else {},
                'topProductPreference': product_preferences[0] if product_preferences else {}
            }

            # Call AI insights generator
            ai_insights = generate_ai_insights(
                dashboard_type='customer_behavior',
                kpis=kpis_dict,
                data_summary=data_summary,
                filters=filters
            )

            logger.info(f"[CustomerBehaviorProcessingService] Generated {len(ai_insights)} AI insights")
            return ai_insights

        except Exception as e:
            logger.error(f"[CustomerBehaviorProcessingService] Error in _generate_ai_insights: {e}")
            return []

    def _calculate_preferred_categories(self, transaction_df: pd.DataFrame) -> pd.DataFrame:
        """Calculate preferred category for each customer based on sales amount (from old implementation)"""

        if transaction_df.empty:
            return pd.DataFrame(columns=['customer_id', 'preferred_category'])

        # Determine the correct product category field name
        category_field = None
        for field in ['product_category', 'item_category', 'category']:
            if field in transaction_df.columns:
                category_field = field
                break

        if category_field is None or 'customer_id' not in transaction_df.columns:
            logger.debug("No product category field found in transaction data")
            return pd.DataFrame(columns=['customer_id', 'preferred_category'])

        try:
            # Remove null categories
            valid_transactions = transaction_df[transaction_df[category_field].notna()].copy()

            if valid_transactions.empty:
                return pd.DataFrame(columns=['customer_id', 'preferred_category'])

            # Determine the sales amount column name
            sales_col = 'net_sales_amount' if 'net_sales_amount' in valid_transactions.columns else 'sales_amount'

            # Group by customer and category, sum sales
            category_sales = valid_transactions.groupby(['customer_id', category_field]).agg({
                sales_col: 'sum'
            }).reset_index()

            # For each customer, find category with max sales
            idx_max = category_sales.groupby('customer_id')[sales_col].idxmax()
            preferred = category_sales.loc[idx_max, ['customer_id', category_field]]
            preferred = preferred.rename(columns={category_field: 'preferred_category'})

            # Format category names as "Category X"
            preferred['preferred_category'] = preferred['preferred_category'].apply(
                lambda x: f"Category {int(x)}" if pd.notna(x) and str(x).replace('.','').isdigit() else str(x)
            )

            logger.info(f"Calculated preferred categories for {len(preferred)} customers")
            return preferred

        except Exception as e:
            logger.error(f"Error calculating preferred categories: {e}")
            return pd.DataFrame(columns=['customer_id', 'preferred_category'])

    def _calculate_preferred_channels(self, transaction_df: pd.DataFrame) -> pd.DataFrame:
        """Calculate preferred channel for each customer based on transaction count (from old implementation)"""

        if transaction_df.empty:
            return pd.DataFrame(columns=['customer_id', 'preferred_channel'])

        # Determine the correct channel field name
        channel_field = None
        for field in ['sales_channel', 'line_type', 'channel']:
            if field in transaction_df.columns:
                channel_field = field
                break

        if channel_field is None or 'customer_id' not in transaction_df.columns:
            logger.debug("No channel field found in transaction data")
            return pd.DataFrame(columns=['customer_id', 'preferred_channel'])

        try:
            # Remove null channels
            valid_transactions = transaction_df[transaction_df[channel_field].notna()].copy()

            if valid_transactions.empty:
                return pd.DataFrame(columns=['customer_id', 'preferred_channel'])

            # Group by customer and channel, count transactions
            channel_counts = valid_transactions.groupby(['customer_id', channel_field]).size().reset_index(name='transaction_count')

            # For each customer, find channel with most transactions
            idx_max = channel_counts.groupby('customer_id')['transaction_count'].idxmax()
            preferred = channel_counts.loc[idx_max, ['customer_id', channel_field]]
            preferred = preferred.rename(columns={channel_field: 'preferred_channel'})

            logger.info(f"Calculated preferred channels for {len(preferred)} customers")
            return preferred

        except Exception as e:
            logger.error(f"Error calculating preferred channels: {e}")
            return pd.DataFrame(columns=['customer_id', 'preferred_channel'])