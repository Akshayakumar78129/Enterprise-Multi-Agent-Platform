"""ML predictor for churn risk - Shared between agent tool and dashboard"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from domains.common.ml_model_cache import ml_model_cache, hash_training_data


class ChurnMLPredictor:
    """ML-based churn predictor - Single source of truth for predictions"""

    def __init__(self):
        """Initialize the ChurnMLPredictor."""
        self.model = LogisticRegression(
            penalty='l1',
            solver='liblinear',
            random_state=42,
            class_weight='balanced'
        )
        self.scaler = StandardScaler()
        self.feature_cols = []
        self.is_trained = False

    def prepare_features_from_service_data(
        self,
        transactions: List[Dict],
        loyalty: List[Dict],
        customers: List[Dict]
    ) -> Tuple[pd.DataFrame, np.ndarray]:
        """Prepare features from data service results.

        Args:
            transactions: Transaction data from data service
            loyalty: Loyalty data from data service
            customers: Customer data from data service

        Returns:
            Tuple of (customer_df with features, feature array for ML)
        """
        # Convert to DataFrames
        txn_df = pd.DataFrame(transactions) if transactions else pd.DataFrame()
        loyalty_df = pd.DataFrame(loyalty) if loyalty else pd.DataFrame()
        customer_df = pd.DataFrame(customers) if customers else pd.DataFrame()

        # Create customer feature DataFrame
        customer_features = []

        # Process each customer
        unique_customers = set()
        if not txn_df.empty:
            unique_customers.update(txn_df['customer_id'].unique())
        if not loyalty_df.empty:
            unique_customers.update(loyalty_df['customer_id'].unique())
        if not customer_df.empty:
            unique_customers.update(customer_df['customer_id'].unique())

        for customer_id in unique_customers:
            # Get customer transactions
            cust_txns = txn_df[txn_df['customer_id'] == customer_id] if not txn_df.empty else pd.DataFrame()

            # Get loyalty info
            cust_loyalty = loyalty_df[loyalty_df['customer_id'] == customer_id]
            loyalty_row = cust_loyalty.iloc[0] if not cust_loyalty.empty else {}

            # Get customer info
            cust_info = customer_df[customer_df['customer_id'] == customer_id]
            info_row = cust_info.iloc[0] if not cust_info.empty else {}

            # Calculate features with proper NaN handling
            avg_value = float(cust_txns['net_sales_amount'].mean()) if not cust_txns.empty else 0.0
            if pd.isna(avg_value):
                avg_value = 0.0

            total_sales = float(cust_txns['net_sales_amount'].sum()) if not cust_txns.empty else 0.0

            # Add time-based features to make predictions time-aware
            if not cust_txns.empty and 'transaction_date' in cust_txns.columns:
                # Convert transaction dates to datetime if they're strings
                cust_txns['transaction_date'] = pd.to_datetime(cust_txns['transaction_date'])

                # Extract year and quarter from transactions
                avg_year = cust_txns['transaction_date'].dt.year.mean() if not cust_txns.empty else 2021
                avg_quarter = cust_txns['transaction_date'].dt.quarter.mean() if not cust_txns.empty else 2
            else:
                avg_year = 2021
                avg_quarter = 2
            if pd.isna(total_sales):
                total_sales = 0.0

            features = {
                'customer_id': customer_id,
                'customer_name': info_row.get('customer_name', f'Customer {customer_id}'),
                'days_since_last_activity': float(loyalty_row.get('days_since_last_activity', 999) or 999),
                'transaction_count': len(cust_txns),
                'avg_transaction_value': avg_value,
                'total_sales': total_sales,
                'rfm_score': float(loyalty_row.get('rfm_score', 0) or 0),
                'lifetime_sales': float(loyalty_row.get('lifetime_sales', 0) or 0),
                'loyalty_status': loyalty_row.get('loyalty_status', 'Unknown'),
                'last_purchase_date': cust_txns['txn_date'].max() if not cust_txns.empty else None,
                'avg_year': avg_year,  # Time-based feature
                'avg_quarter': avg_quarter  # Time-based feature
            }

            customer_features.append(features)

        # Convert to DataFrame
        result_df = pd.DataFrame(customer_features)

        # Prepare feature array for ML model (including time features)
        self.feature_cols = [
            'days_since_last_activity',
            'transaction_count',
            'avg_transaction_value',
            'rfm_score',
            'lifetime_sales',
            'avg_year',  # Add time features
            'avg_quarter'
        ]

        # Create feature array with proper handling of missing values
        feature_array = []
        for col in self.feature_cols:
            if col in result_df.columns:
                values = result_df[col].fillna(0).values
            else:
                values = np.zeros(len(result_df))
            feature_array.append(values)

        features = np.column_stack(feature_array)
        features = np.nan_to_num(features, nan=0.0)

        return result_df, features

    def generate_labels(self, customer_df: pd.DataFrame) -> np.ndarray:
        """Generate churn labels based on business rules.

        Args:
            customer_df: DataFrame with customer data

        Returns:
            Array of churn labels (1 = churned, 0 = active)
        """
        labels = []
        for _, row in customer_df.iterrows():
            # Business rules for churn:
            # 1. Lost customers (loyalty status)
            # 2. Inactive for > 180 days
            # 3. Very low engagement (< 2 transactions and > 90 days since last)

            if row.get('loyalty_status') == 'Lost':
                labels.append(1)
            elif row.get('days_since_last_activity', 0) > 180:
                labels.append(1)
            elif (row.get('transaction_count', 0) < 2 and
                  row.get('days_since_last_activity', 0) > 90):
                labels.append(1)
            else:
                labels.append(0)

        return np.array(labels)

    def train_model(self, features: np.ndarray, labels: np.ndarray, filters: Dict[str, Any] = None) -> Dict:
        """Train the churn prediction model with caching support.

        Args:
            features: Feature array
            labels: Label array
            filters: Optional filters for cache key generation

        Returns:
            Dictionary with training metrics
        """
        if len(features) == 0:
            return {'roc_auc': 0.5, 'accuracy': 0}

        # Handle case where all labels are same
        if len(np.unique(labels)) == 1:
            self.is_trained = False
            return {'roc_auc': 0.5, 'accuracy': 1.0}

        # Generate data hash for cache validation
        data_hash = hash_training_data((features, labels))

        # Try to get cached model if filters provided
        if filters:
            cached = ml_model_cache.get_model('churn', filters, data_hash)
            if cached:
                self.model, self.scaler, metadata = cached
                self.is_trained = True
                print(f"[ChurnMLPredictor] Using cached model (accuracy: {metadata.get('accuracy', 0):.2f})")
                return metadata.get('metrics', {'roc_auc': 0.5, 'accuracy': 0})

        print("[ChurnMLPredictor] Training new model...")

        # Scale features
        features_scaled = self.scaler.fit_transform(features)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features_scaled, labels,
            test_size=0.2,
            random_state=42,
            stratify=labels
        )

        # Train model
        self.model.fit(X_train, y_train)
        self.is_trained = True

        # Evaluate
        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)[:, 1]

        # Calculate metrics
        metrics = {
            'roc_auc': roc_auc_score(y_test, y_proba) if len(np.unique(y_test)) > 1 else 0.5,
            'accuracy': (y_pred == y_test).mean()
        }

        # Cache the trained model if filters provided
        if filters:
            metadata = {
                'metrics': metrics,
                'accuracy': metrics['accuracy'],
                'roc_auc': metrics['roc_auc'],
                'training_samples': len(features),
                'trained_at': datetime.now().isoformat()
            }
            ml_model_cache.set_model('churn', filters, self.model, self.scaler, metadata, data_hash)
            print(f"[ChurnMLPredictor] Model cached for future use")

        return metrics

    def predict_churn_probability(self, features: np.ndarray) -> np.ndarray:
        """Predict churn probability for given features.

        Args:
            features: Feature array

        Returns:
            Array of churn probabilities
        """
        if not self.is_trained:
            # Return heuristic based on days since last activity
            if features.shape[1] > 0:
                days_since = features[:, 0]  # First feature is days_since_last_activity
                # Simple heuristic: probability increases with days inactive
                probabilities = np.clip(days_since / 365.0, 0, 0.9)
                return probabilities
            return np.full(len(features), 0.5)

        # Replace NaN values with 0 before scaling
        features = np.nan_to_num(features, nan=0.0)
        features_scaled = self.scaler.transform(features)
        return self.model.predict_proba(features_scaled)[:, 1]

    def get_risk_level(self, probability: float) -> str:
        """Convert churn probability to risk level using consistent thresholds.

        Args:
            probability: Churn probability (0-1)

        Returns:
            Risk level string
        """
        # Unified thresholds for consistency
        if probability < 0.3:
            return "Low"
        elif probability < 0.5:
            return "Medium"
        elif probability < 0.7:
            return "High"
        else:
            return "Very High"

    def get_feature_importance(self) -> List[Dict]:
        """Get feature importance from trained model.

        Returns:
            List of feature importance dictionaries (without icons)
        """
        if not self.is_trained or not hasattr(self.model, 'coef_'):
            # Return empty if model not trained (no misleading hardcoded values)
            return []

        # Get actual feature importance from model coefficients
        importance = np.abs(self.model.coef_[0])

        # Map features to display names (no icons)
        feature_map = {
            'days_since_last_activity': {'name': 'Recency', 'color': '#ef4444'},
            'transaction_count': {'name': 'Frequency', 'color': '#f59e0b'},
            'avg_transaction_value': {'name': 'Monetary', 'color': '#eab308'},
            'rfm_score': {'name': 'RFM Score', 'color': '#10b981'},
            'lifetime_sales': {'name': 'Lifetime Value', 'color': '#6366f1'}
        }

        result = []
        total_importance = importance.sum()

        for feat, imp in zip(self.feature_cols, importance):
            if feat in feature_map:
                importance_pct = (imp / total_importance) * 100 if total_importance > 0 else 0
                result.append({
                    'name': feature_map[feat]['name'],
                    'importance': round(importance_pct, 1),
                    'impact': round(importance_pct, 1),
                    'color': feature_map[feat]['color']
                })

        # Sort by importance
        result.sort(key=lambda x: x['importance'], reverse=True)
        return result[:5]  # Top 5 features

    def predict_from_service_data(
        self,
        transactions: List[Dict],
        loyalty: List[Dict],
        customers: List[Dict]
    ) -> pd.DataFrame:
        """Make predictions directly from service data.

        Args:
            transactions: Transaction data from data service
            loyalty: Loyalty data from data service
            customers: Customer data from data service

        Returns:
            DataFrame with predictions
        """
        # Prepare features
        customer_df, features = self.prepare_features_from_service_data(
            transactions, loyalty, customers
        )

        if len(customer_df) == 0:
            return pd.DataFrame()

        # Get predictions
        probabilities = self.predict_churn_probability(features)

        # Add predictions to dataframe
        customer_df['churn_probability'] = probabilities
        customer_df['risk_level'] = [self.get_risk_level(p) for p in probabilities]
        customer_df['risk_percentage'] = (probabilities * 100).astype(int)

        return customer_df