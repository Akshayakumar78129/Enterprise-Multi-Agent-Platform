"""
ML predictor for Purchase Frequency
Following the same pattern as ChurnMLPredictor
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)


class PurchaseFrequencyMLPredictor:
    """ML predictor for Purchase frequency analysis and prediction"""

    def __init__(self):
        """Initialize the ML predictor"""
        self.model = None
        self.scaler = StandardScaler()
        self.feature_cols = ['days_between_purchases', 'transaction_count', 'seasonal_factor', 'product_diversity']
        self.is_trained = False
        self.model_type = 'time_series'
        self.num_segments = 5

        # Initialize appropriate model based on type
        if self.model_type == 'classification':
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        elif self.model_type == 'regression':
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        elif self.model_type == 'clustering':
            self.model = KMeans(n_clusters=5, random_state=42, n_init=10)

    
    def analyze_data(self, df: pd.DataFrame) -> Dict:
        """Perform analysis using appropriate ML techniques"""

        if df.empty:
            return self._get_empty_analysis()

        # Prepare features
        features_df = self._prepare_features(df)

        # Scale features
        X_scaled = self.scaler.fit_transform(features_df)

        # Perform analysis based on model type
        if self.model_type == 'clustering':
            results = self._perform_clustering(X_scaled, df)
        elif self.model_type == 'classification':
            results = self._perform_classification(X_scaled, df)
        elif self.model_type == 'regression':
            results = self._perform_regression(X_scaled, df)
        else:
            results = self._perform_general_analysis(X_scaled, df)

        return results

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for analysis"""

        features_df = pd.DataFrame()

        # Extract numerical features
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            if col not in ['customer_id']:
                features_df[col] = df[col].fillna(0)

        return features_df

    def _find_optimal_clusters(self, X: np.ndarray, max_k: int = 10) -> int:
        """Find optimal number of clusters using elbow method"""

        if len(X) < max_k:
            return min(3, len(X))

        inertias = []
        for k in range(2, min(max_k + 1, len(X))):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(X)
            inertias.append(kmeans.inertia_)

        # Simple elbow detection
        if len(inertias) > 2:
            deltas = np.diff(inertias)
            optimal_k = np.argmin(deltas) + 3  # +3 because we start from k=2
            return min(optimal_k, 8)  # Cap at 8 segments

        return 5  # Default

    def _analyze_segments(self, df: pd.DataFrame, features_df: pd.DataFrame) -> List[Dict]:
        """Analyze characteristics of each segment"""

        segments = []

        for segment_id in df['segment'].unique():
            segment_data = df[df['segment'] == segment_id]
            segment_features = features_df[df['segment'] == segment_id]

            segment_info = {
                'segment_id': int(segment_id),
                'size': len(segment_data),
                'percentage': len(segment_data) / len(df) * 100,
                'avg_revenue': float(segment_data.get('total_revenue', 0).mean()),
                'avg_transactions': float(segment_data.get('transaction_count', 0).mean()),
                'characteristics': {
                    col: float(segment_features[col].mean())
                    for col in segment_features.columns
                }
            }

            segments.append(segment_info)

        return segments

    def _get_feature_importance(self, features_df: pd.DataFrame = None) -> List[Dict]:
        """Get feature importance for the model"""

        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            feature_names = features_df.columns if features_df is not None else self.feature_cols

            return [
                {'feature': name, 'importance': float(imp)}
                for name, imp in zip(feature_names, importances)
            ]

        # For models without feature importance, return equal weights
        feature_names = features_df.columns if features_df is not None else self.feature_cols
        return [
            {'feature': name, 'importance': 1.0 / len(feature_names)}
            for name in feature_names
        ]

    def _get_segment_distribution(self, df: pd.DataFrame) -> Dict:
        """Get distribution of customers across segments"""

        if 'segment' not in df.columns:
            return {}

        distribution = df['segment'].value_counts().to_dict()
        return {
            f"Segment {k}": int(v)
            for k, v in distribution.items()
        }

    def _get_segment_characteristics(self, df: pd.DataFrame, features_df: pd.DataFrame) -> Dict:
        """Get detailed characteristics of each segment"""

        characteristics = {}

        for segment_id in df['segment'].unique():
            segment_features = features_df[df['segment'] == segment_id]

            characteristics[f"segment_{segment_id}"] = {
                'mean_values': segment_features.mean().to_dict(),
                'std_values': segment_features.std().to_dict(),
                'min_values': segment_features.min().to_dict(),
                'max_values': segment_features.max().to_dict(),
            }

        return characteristics

    def _get_empty_segments(self) -> Dict:
        """Return empty segment structure"""
        return {
            'segments': [],
            'feature_importance': [],
            'segment_distribution': {},
            'segment_characteristics': {}
        }

    def _get_empty_predictions(self) -> Dict:
        """Return empty predictions structure"""
        return {
            'predictions': [],
            'feature_importance': [],
            'distribution': {},
            'metrics': {}
        }

    def _get_empty_analysis(self) -> Dict:
        """Return empty analysis structure"""
        return {
            'results': [],
            'metrics': {},
            'insights': []
        }

    def _get_empty_classification(self) -> Dict:
        """Return empty classification structure"""
        return {
            'classifications': [],
            'distribution': {},
            'feature_importance': [],
            'at_risk': []
        }
