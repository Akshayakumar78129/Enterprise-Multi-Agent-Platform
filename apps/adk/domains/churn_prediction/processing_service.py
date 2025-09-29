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
                print(f"[ChurnProcessingService] ML model trained/cached. ROC AUC: {metrics.get('roc_auc', 0):.3f}")
            else:
                print(f"[ChurnProcessingService] No data available for training with filters: {training_filters}")
        except Exception as e:
            print(f"[ChurnProcessingService] Failed to train ML model: {e}")

    @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
    async def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Main dashboard endpoint - combines SQL and ML

        Returns data matching Express getDashboardSummary format
        """
        try:
            # Get all metrics in parallel for better performance
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

            # Return in Express format
            return {
                "customerStats": customer_stats or [],
                "segmentRisk": segment_risk or [],
                "monthlyRisk": monthly_risk or [],
                "probabilityDistribution": probability_dist or [],
                "featureImportance": feature_importance or []
            }
        except Exception as e:
            import traceback
            print(f"[ChurnProcessingService] Error in getDashboardSummary: {e}")
            print(f"[ChurnProcessingService] Full traceback: {traceback.format_exc()}")
            # Return empty structure on error (matching Express)
            return {
                "customerStats": [],
                "segmentRisk": [],
                "monthlyRisk": [],
                "probabilityDistribution": [],
                "featureImportance": []
            }

    @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
    async def get_customer_stats(self, filters: Dict) -> List[Dict]:
        """Port of Express getCustomerStats - uses ML predictor with service data"""
        try:
            # Log the incoming filters to debug
            print(f"[ChurnProcessingService] get_customer_stats filters: {filters}")

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
            # Return default values without icons
            return [
                {"name": "Recency", "importance": 35.0, "impact": 35.0, "color": "#ef4444"},
                {"name": "Frequency", "importance": 25.0, "impact": 25.0, "color": "#f59e0b"},
                {"name": "Monetary", "importance": 20.0, "impact": 20.0, "color": "#eab308"},
                {"name": "RFM Score", "importance": 12.0, "impact": 12.0, "color": "#10b981"},
                {"name": "Product Diversity", "importance": 8.0, "impact": 8.0, "color": "#8b5cf6"}
            ]

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