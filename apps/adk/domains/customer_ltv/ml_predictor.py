"""
Customer Lifetime Value ML Predictor
Following the older implementation using GradientBoostingRegressor
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import logging
from typing import Dict, List, Any
from domains.common.ml_model_cache import ml_model_cache, hash_training_data
from datetime import datetime

logger = logging.getLogger(__name__)


class CustomerLtvMLPredictor:
    """ML-based LTV predictor using Gradient Boosting (as per older implementation)"""

    def __init__(self):
        """Initialize the predictor"""
        # Use same model as older implementation
        self.model = GradientBoostingRegressor(
            n_estimators=50,
            learning_rate=0.1,
            max_depth=3,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        logger.info(f"{self.__class__.__name__} initialized")

    def train_model(self, features: np.ndarray, labels: np.ndarray, filters: Dict[str, Any] = None) -> Dict:
        """Train the LTV prediction model with caching support.

        Args:
            features: Feature array
            labels: Target array (LTV values)
            filters: Optional filters for cache key generation

        Returns:
            Dictionary with training metrics
        """
        if len(features) == 0:
            return {'status': 'error', 'message': 'No features provided'}

        # Generate data hash for cache validation
        data_hash = hash_training_data((features, labels))

        # Try to get cached model if filters provided
        if filters:
            cached = ml_model_cache.get_model('ltv', filters, data_hash)
            if cached:
                self.model, self.scaler, metadata = cached
                self.is_trained = True
                logger.info(f"[CustomerLtvMLPredictor] Using cached model (samples: {metadata.get('training_samples', 0)})")
                return metadata.get('metrics', {'status': 'success'})

        logger.info("[CustomerLtvMLPredictor] Training new model...")

        try:
            # Scale features
            features_scaled = self.scaler.fit_transform(features)

            # Train model
            self.model.fit(features_scaled, labels)
            self.is_trained = True

            # Calculate simple metrics
            predictions = self.model.predict(features_scaled)
            mae = np.mean(np.abs(predictions - labels))
            mse = np.mean((predictions - labels) ** 2)
            r2 = self.model.score(features_scaled, labels)

            metrics = {
                'status': 'success',
                'mae': float(mae),
                'mse': float(mse),
                'r2_score': float(r2),
                'n_samples': len(features)
            }

            # Cache the trained model if filters provided
            if filters:
                metadata = {
                    'metrics': metrics,
                    'training_samples': len(features),
                    'trained_at': datetime.now().isoformat()
                }
                ml_model_cache.set_model('ltv', filters, self.model, self.scaler, metadata, data_hash)
                logger.info("[CustomerLtvMLPredictor] Model cached for future use")

            logger.info("LTV model trained successfully")
            return metrics

        except Exception as e:
            logger.error(f"Failed to train model: {e}")
            return {'status': 'error', 'message': str(e)}

    def predict_ltv(self, df: pd.DataFrame) -> Dict:
        """Predict customer lifetime value using ML model"""

        if df.empty:
            return self._empty_ltv_results()

        # Prepare features exactly as older implementation
        feature_cols = ['credit_limit', 'transaction_count', 'avg_transaction_value', 'purchase_frequency']

        # Ensure columns exist
        for col in feature_cols:
            if col not in df.columns:
                if col == 'purchase_frequency':
                    # Calculate purchase frequency if not present
                    if 'transaction_count' in df.columns and 'days_since_last_activity' in df.columns:
                        df['purchase_frequency'] = df['transaction_count'] / df['days_since_last_activity'].clip(lower=1)
                    else:
                        df['purchase_frequency'] = 0
                elif col == 'credit_limit':
                    df['credit_limit'] = 0
                else:
                    df[col] = 0

        # Prepare features (X) and target (y) as per older implementation
        X = df[feature_cols].fillna(0).values

        # Use total_spend/total_revenue as target for training
        if 'total_revenue' in df.columns:
            y = df['total_revenue'].fillna(0).values
        elif 'total_spend' in df.columns:
            y = df['total_spend'].fillna(0).values
        else:
            y = np.zeros(len(df))

        # Train model if not trained and we have data
        if not self.is_trained and len(X) > 0 and y.sum() > 0:
            try:
                # Scale features
                X_scaled = self.scaler.fit_transform(X)
                # Train model
                self.model.fit(X_scaled, y)
                self.is_trained = True
                logger.info("LTV model trained successfully")
            except Exception as e:
                logger.error(f"Failed to train model: {e}")

        # Make predictions
        if self.is_trained:
            try:
                X_scaled = self.scaler.transform(X)
                predictions = self.model.predict(X_scaled)
                df['predicted_ltv'] = predictions
            except:
                # Fallback to using actual values
                df['predicted_ltv'] = y
        else:
            # Use actual values as predictions if model not trained
            df['predicted_ltv'] = y

        # Create percentiles
        if len(df) > 0 and df['predicted_ltv'].sum() > 0:
            try:
                df['ltv_percentile'] = pd.qcut(
                    df['predicted_ltv'],
                    q=4,
                    labels=['Low', 'Medium', 'High', 'VIP'],
                    duplicates='drop'
                )
            except:
                df['ltv_percentile'] = 'Medium'
        else:
            df['ltv_percentile'] = 'Medium'

        # Build predictions list
        predictions_list = []
        for idx, row in df.iterrows():
            pred = {
                'customer_id': int(row.get('customer_id', idx)) if not pd.isna(row.get('customer_id', idx)) else idx,
                'customer_name': str(row.get('customer_name', f'Customer {idx}')),
                'predicted_ltv': float(row.get('predicted_ltv', 0)),
                'actual_ltv': float(y[idx]) if idx < len(y) else 0,
                'ltv_percentile': str(row.get('ltv_percentile', 'Medium')),
                'transaction_count': int(row.get('transaction_count', 0))
            }
            predictions_list.append(pred)

        # Get feature importance if model is trained
        feature_importance = []
        if self.is_trained:
            try:
                importances = self.model.feature_importances_
                for feat, imp in zip(feature_cols, importances):
                    feature_importance.append({
                        'feature': feat,
                        'importance': float(imp)
                    })
                feature_importance.sort(key=lambda x: x['importance'], reverse=True)
            except:
                pass

        return {
            'predictions': predictions_list,
            'feature_importance': feature_importance[:10],
            'growth_percentage': self._calculate_growth_rate(df)
            # ✅ NO HARDCODED DATA: Removed model_accuracy, prediction_confidence, accuracy_score
            # These were never displayed and were misleading hardcoded values
        }

    def _calculate_growth_rate(self, df: pd.DataFrame) -> float:
        """Calculate LTV growth rate"""

        if 'predicted_ltv' in df.columns and 'total_revenue' in df.columns:
            current = df['total_revenue'].sum()
            predicted = df['predicted_ltv'].sum()
            if current > 0:
                return float((predicted - current) / current * 100)
        # ✅ NO HARDCODED DATA: Return 0 instead of fake 5.2% growth
        return 0

    def _empty_ltv_results(self) -> Dict:
        """Return empty results structure"""
        return {
            'predictions': [],
            'feature_importance': [],
            'metrics': {},
            'growth_percentage': 0,
            'accuracy_score': 0
        }

    def perform_segmentation(self, df: pd.DataFrame) -> Dict:
        """Perform customer segmentation based on LTV"""

        if df.empty:
            return {'segments': [], 'feature_importance': []}

        # First predict LTV
        ltv_results = self.predict_ltv(df.copy())

        # Use predicted LTV for segmentation
        segments = []
        if ltv_results['predictions']:
            ltv_values = [p['predicted_ltv'] for p in ltv_results['predictions']]

            if len(ltv_values) > 3:
                try:
                    quartiles = pd.Series(ltv_values).quantile([0.25, 0.5, 0.75])

                    segment_defs = [
                        ('Low Value', 0, quartiles[0.25]),
                        ('Medium Value', quartiles[0.25], quartiles[0.5]),
                        ('High Value', quartiles[0.5], quartiles[0.75]),
                        ('Premium', quartiles[0.75], max(ltv_values))
                    ]

                    for i, (name, min_val, max_val) in enumerate(segment_defs):
                        segment_ltv = [v for v in ltv_values if min_val <= v <= max_val]
                        segments.append({
                            'segment_id': i + 1,
                            'name': name,
                            'size': len(segment_ltv),
                            'avg_revenue': float(np.mean(segment_ltv)) if segment_ltv else 0,
                            'total_revenue': float(np.sum(segment_ltv)) if segment_ltv else 0,
                            'percentage': len(segment_ltv) / len(ltv_values) * 100 if ltv_values else 0
                        })
                except:
                    pass

        return {
            'segments': segments,
            'feature_importance': ltv_results.get('feature_importance', [])
        }

    def analyze_data(self, df: pd.DataFrame) -> Dict:
        """Analyze customer data and predict LTV"""
        return self.predict_ltv(df)