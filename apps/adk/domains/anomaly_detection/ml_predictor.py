"""ML Predictor for anomaly detection using Isolation Forest"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Tuple, Any
import logging
from domains.common.ml_model_cache import ml_model_cache, hash_training_data
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnomalyMLPredictor:
    """ML model for anomaly detection using Isolation Forest"""

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.model_trained = False

    def prepare_features_from_service_data(
        self,
        transactions: List[Dict],
        loyalty: List[Dict],
        customers: List[Dict]
    ) -> Tuple[pd.DataFrame, np.ndarray]:
        """Prepare features from service data for anomaly detection

        Args:
            transactions: Transaction data from service
            loyalty: Loyalty data from service
            customers: Customer data from service

        Returns:
            Tuple of (customer_df with metadata, feature matrix)
        """
        try:
            # Convert to DataFrames
            txn_df = pd.DataFrame(transactions) if transactions else pd.DataFrame()
            loyalty_df = pd.DataFrame(loyalty) if loyalty else pd.DataFrame()
            customer_df = pd.DataFrame(customers) if customers else pd.DataFrame()

            if txn_df.empty or customer_df.empty:
                logger.warning("No transaction or customer data available")
                return pd.DataFrame(), np.array([])

            # Calculate transaction aggregates per customer
            txn_aggregates = txn_df.groupby('customer_id').agg({
                'txn_id': 'count',
                'net_sales_amount': ['mean', 'max', 'min', 'std', 'sum'],
                'sales_amount': ['mean', 'sum'],
                'return_amount': ['sum', 'count'],
                'item_number': 'nunique',
                'txn_date': lambda x: pd.to_datetime(x).nunique()
            }).reset_index()

            # Flatten column names
            txn_aggregates.columns = [
                'customer_id', 'transaction_count',
                'avg_net_amount', 'max_net_amount', 'min_net_amount', 'std_net_amount', 'total_net_amount',
                'avg_gross_amount', 'total_gross_amount',
                'total_returns', 'return_count',
                'unique_items', 'unique_transaction_days'
            ]

            # Calculate time-based features
            txn_df['txn_date'] = pd.to_datetime(txn_df['txn_date'])
            latest_date = txn_df['txn_date'].max()

            time_features = txn_df.groupby('customer_id').agg({
                'txn_date': [
                    lambda x: (latest_date - x.max()).days,  # Days since last transaction
                    lambda x: (x.max() - x.min()).days,  # Customer lifetime in days
                    lambda x: len(x) / ((x.max() - x.min()).days + 1) if (x.max() - x.min()).days > 0 else len(x)  # Frequency
                ]
            }).reset_index()

            time_features.columns = ['customer_id', 'days_since_last_txn', 'customer_lifetime_days', 'purchase_frequency']

            # Merge with customer data
            result_df = customer_df[['customer_id', 'customer_name', 'region', 'customer_type', 'customer_status', 'credit_limit']].copy()
            result_df = result_df.merge(txn_aggregates, on='customer_id', how='left')
            result_df = result_df.merge(time_features, on='customer_id', how='left')

            # Add loyalty data if available
            if not loyalty_df.empty:
                loyalty_features = loyalty_df[['customer_id', 'rfm_score', 'days_since_last_activity', 'lifetime_sales']].copy()
                result_df = result_df.merge(loyalty_features, on='customer_id', how='left')


            # Calculate derived anomaly features
            result_df['return_rate'] = result_df['total_returns'] / (result_df['total_net_amount'] + 0.01)
            result_df['price_variability'] = result_df['std_net_amount'] / (result_df['avg_net_amount'] + 0.01)
            result_df['order_size_ratio'] = result_df['max_net_amount'] / (result_df['avg_net_amount'] + 0.01)
            result_df['activity_intensity'] = result_df['transaction_count'] / (result_df['unique_transaction_days'] + 1)

            # Define feature columns for the model
            self.feature_columns = [
                'transaction_count', 'avg_net_amount', 'max_net_amount', 'min_net_amount',
                'std_net_amount', 'total_net_amount', 'total_returns', 'return_count',
                'unique_items', 'unique_transaction_days',
                'days_since_last_txn', 'customer_lifetime_days', 'purchase_frequency',
                'return_rate', 'price_variability', 'order_size_ratio',
                'activity_intensity'
            ]

            # Add optional features if they exist
            optional_features = ['rfm_score', 'lifetime_sales']
            for feature in optional_features:
                if feature in result_df.columns:
                    self.feature_columns.append(feature)

            # Fill NaN values
            result_df[self.feature_columns] = result_df[self.feature_columns].fillna(0)

            # Replace infinite values
            result_df[self.feature_columns] = result_df[self.feature_columns].replace([np.inf, -np.inf], 0)

            # Extract feature matrix
            features = result_df[self.feature_columns].values

            return result_df, features

        except Exception as e:
            logger.error(f"Error preparing features: {str(e)}")
            return pd.DataFrame(), np.array([])

    def train_model(self, features: np.ndarray, contamination: float = 0.1, filters: Dict[str, Any] = None) -> Dict:
        """Train Isolation Forest model for anomaly detection with caching support

        Args:
            features: Feature matrix
            contamination: Expected proportion of anomalies (default 0.1 = 10%)
            filters: Optional filters for cache key generation

        Returns:
            Dictionary with training metrics
        """
        try:
            if len(features) == 0:
                logger.error("No features provided for training")
                return {'status': 'error', 'message': 'No features provided'}

            # Generate data hash for cache validation
            data_hash = hash_training_data((features, contamination))

            # Try to get cached model if filters provided
            if filters:
                cached = ml_model_cache.get_model('anomaly', filters, data_hash)
                if cached:
                    self.model, self.scaler, metadata = cached
                    self.model_trained = True
                    return metadata.get('metrics', {'status': 'success'})

            # Scale features
            features_scaled = self.scaler.fit_transform(features)

            # Train Isolation Forest
            self.model = IsolationForest(
                n_estimators=100,
                max_samples='auto',
                contamination=contamination,
                random_state=42,
                n_jobs=-1
            )

            self.model.fit(features_scaled)
            self.model_trained = True

            # Calculate training metrics
            scores = self.model.score_samples(features_scaled)
            predictions = self.model.predict(features_scaled)

            n_anomalies = np.sum(predictions == -1)
            n_normal = np.sum(predictions == 1)

            metrics = {
                'status': 'success',
                'n_samples': len(features),
                'n_features': features.shape[1],
                'n_anomalies': int(n_anomalies),
                'n_normal': int(n_normal),
                'anomaly_ratio': float(n_anomalies / len(features)),
                'avg_anomaly_score': float(np.mean(scores)),
                'std_anomaly_score': float(np.std(scores))
            }

            # Cache the trained model if filters provided
            if filters:
                metadata = {
                    'metrics': metrics,
                    'n_samples': len(features),
                    'n_anomalies': int(n_anomalies),
                    'training_samples': len(features),
                    'trained_at': datetime.now().isoformat()
                }
                ml_model_cache.set_model('anomaly', filters, self.model, self.scaler, metadata, data_hash)

            return metrics

        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    def predict_from_service_data(
        self,
        transactions: List[Dict],
        loyalty: List[Dict],
        customers: List[Dict]
    ) -> pd.DataFrame:
        """Predict anomalies from service data

        Returns DataFrame with customer info and anomaly scores
        """
        try:
            # Prepare features
            customer_df, features = self.prepare_features_from_service_data(
                transactions, loyalty, customers
            )

            if customer_df.empty or not self.model_trained:
                logger.warning("No data or model not trained")
                return pd.DataFrame()

            # Scale features
            features_scaled = self.scaler.transform(features)

            # Get anomaly scores and predictions
            anomaly_scores = self.model.score_samples(features_scaled)
            predictions = self.model.predict(features_scaled)

            # Add to customer DataFrame
            customer_df['anomaly_score'] = anomaly_scores
            customer_df['is_anomaly'] = predictions == -1

            # Calculate anomaly severity (1-5 scale)
            # Normalize scores to 0-1 range (lower score = more anomalous)
            score_min = anomaly_scores.min()
            score_max = anomaly_scores.max()
            normalized_scores = (anomaly_scores - score_min) / (score_max - score_min + 1e-10)

            # Invert so higher values mean more anomalous
            severity_scores = 1 - normalized_scores

            # Convert to 1-5 scale
            customer_df['severity_level'] = np.ceil(severity_scores * 5).astype(int)
            customer_df['severity_level'] = customer_df['severity_level'].clip(1, 5)

            # Calculate feature-specific anomaly indicators
            for feature in self.feature_columns:
                if feature in customer_df.columns:
                    z_scores = np.abs((customer_df[feature] - customer_df[feature].mean()) /
                                     (customer_df[feature].std() + 1e-10))
                    customer_df[f'{feature}_zscore'] = z_scores
                    customer_df[f'{feature}_is_anomalous'] = z_scores > 2.5

            return customer_df

        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            return pd.DataFrame()

    def get_feature_importance(self) -> List[Dict]:
        """Calculate pseudo feature importance based on variance and correlation

        Returns list of features with importance scores
        """
        if not self.model_trained:
            return []

        # For Isolation Forest, we can use feature variance as a proxy for importance
        # Features with high variance tend to create better splits
        importance_scores = []

        try:
            feature_vars = np.var(self.scaler.transform(np.ones((1, len(self.feature_columns)))), axis=0)
            total_var = np.sum(feature_vars)

            for i, feature in enumerate(self.feature_columns):
                importance_scores.append({
                    'name': feature.replace('_', ' ').title(),
                    'feature': feature,
                    'importance': float(feature_vars[i] / total_var * 100) if total_var > 0 else 0
                })

            # Sort by importance
            importance_scores.sort(key=lambda x: x['importance'], reverse=True)

        except Exception as e:
            logger.error(f"Error calculating feature importance: {str(e)}")

        return importance_scores