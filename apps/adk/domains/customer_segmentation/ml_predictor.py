"""
ML predictor for Customer Segmentation
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


class CustomerSegmentationMLPredictor:
    """ML predictor for Customer segmentation using RFM analysis and clustering"""

    def __init__(self):
        """Initialize the ML predictor"""
        self.model = None
        self.scaler = StandardScaler()
        self.feature_cols = ['recency', 'frequency', 'monetary_value', 'avg_order_value', 'customer_lifetime_days']
        self.is_trained = False
        self.model_type = 'clustering'
        self.num_segments = 8

        # Initialize appropriate model based on type
        if self.model_type == 'classification':
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        elif self.model_type == 'regression':
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        elif self.model_type == 'clustering':
            self.model = KMeans(n_clusters=8, random_state=42, n_init=10)

    
    def perform_segmentation(self, df: pd.DataFrame) -> Dict:
        """RFM-based segmentation using KMeans - matches web folder logic"""

        if df.empty:
            return {'segments': [], 'feature_importance': []}

        # Prepare RFM features (same as web folder)
        features_df = pd.DataFrame()
        features_df['recency'] = df['recency'].fillna(999)
        features_df['frequency'] = df['frequency'].fillna(0)
        features_df['monetary'] = df['monetary_value'].fillna(0)
        features_df['avg_order_value'] = df['avg_order_value'].fillna(0)
        features_df['customer_lifetime_days'] = df['customer_lifetime_days'].fillna(0)

        # Handle infinite values
        features_df = features_df.replace([np.inf, -np.inf], np.nan)
        features_df = features_df.fillna(0)

        # Check for zero variance columns
        non_zero_var_cols = features_df.columns[features_df.var() != 0]
        if len(non_zero_var_cols) == 0:
            logger.warning("All features have zero variance")
            return {'segments': [], 'feature_importance': []}

        # Scale features
        X_scaled = self.scaler.fit_transform(features_df[non_zero_var_cols])

        # Determine optimal clusters if not specified
        n_clusters = self.num_segments or self._determine_optimal_clusters(X_scaled)

        # KMeans clustering
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        cluster_labels = self.model.fit_predict(X_scaled)

        # Add cluster labels
        df['segment'] = cluster_labels

        # Analyze segments and assign proper names based on RFM characteristics
        segments = []

        # Sort segments by their characteristics to assign appropriate names
        segment_stats = []
        for segment_id in df['segment'].unique():
            segment_data = df[df['segment'] == segment_id]
            if not segment_data.empty:
                avg_recency = float(segment_data['recency'].mean())
                avg_frequency = float(segment_data['frequency'].mean())
                avg_monetary = float(segment_data['monetary_value'].mean())

                # Normalize to 0-100 scale
                recency_score = max(0, 100 - (avg_recency / df['recency'].max() * 100)) if df['recency'].max() > 0 else 50
                frequency_score = (avg_frequency / df['frequency'].max() * 100) if df['frequency'].max() > 0 else 50
                monetary_score = (avg_monetary / df['monetary_value'].max() * 100) if df['monetary_value'].max() > 0 else 50

                # Calculate weighted RFM score
                rfm_score = recency_score * 0.3 + frequency_score * 0.3 + monetary_score * 0.4

                segment_stats.append({
                    'segment_id': int(segment_id),
                    'rfm_score': rfm_score,
                    'data': segment_data,
                    'avg_recency': avg_recency,
                    'avg_frequency': avg_frequency,
                    'avg_monetary': avg_monetary
                })

        # Sort by RFM score to assign names
        segment_stats = sorted(segment_stats, key=lambda x: x['rfm_score'], reverse=True)

        # All 8 segment names matching the filter dropdown
        segment_names = [
            'Champions',
            'Loyal Customers',
            'Potential Loyalists',
            'New Customers',
            'At Risk',
            "Can't Lose Them",
            'Hibernating',
            'Lost'
        ]

        # Ensure we have exactly 8 segments by padding or truncating
        while len(segment_stats) < 8:
            # Add empty segments if we have fewer than 8
            segment_stats.append({
                'segment_id': len(segment_stats),
                'rfm_score': 0,
                'data': pd.DataFrame(),
                'avg_recency': 0,
                'avg_frequency': 0,
                'avg_monetary': 0
            })

        # Only take first 8 segments if we have more
        segment_stats = segment_stats[:8]

        for idx, stat in enumerate(segment_stats):
            segment_data = stat['data']
            # Always use the predefined segment name based on position
            segment_name = segment_names[idx]

            # Handle empty segments (padding segments)
            if isinstance(segment_data, pd.DataFrame) and not segment_data.empty:
                segments.append({
                    'segment_id': stat['segment_id'],
                    'segment_name': segment_name,
                    'name': segment_name,
                    'size': len(segment_data),
                    'percentage': len(segment_data) / len(df) * 100,
                    'avg_revenue': float(segment_data['monetary_value'].mean()),
                    'avg_transactions': float(segment_data['frequency'].mean()),
                    'avg_recency': stat['avg_recency'],
                    'avg_rfm_score': stat['rfm_score'],
                    'avg_order_value': float(segment_data['avg_order_value'].mean()),
                    'customer_lifetime_days': float(segment_data['customer_lifetime_days'].mean()),
                    'total_revenue': float(segment_data['monetary_value'].sum()),
                    'total_transactions': float(segment_data['frequency'].sum())
                })
            else:
                # Empty segment (for padding to 8)
                segments.append({
                    'segment_id': stat['segment_id'],
                    'segment_name': segment_name,
                    'name': segment_name,
                    'size': 0,
                    'percentage': 0,
                    'avg_revenue': 0,
                    'avg_transactions': 0,
                    'avg_recency': 0,
                    'avg_rfm_score': 0,
                    'avg_order_value': 0,
                    'customer_lifetime_days': 0,
                    'total_revenue': 0,
                    'total_transactions': 0
                })

        # CRITICAL: Assign segment names back to the original dataframe
        # Create mapping from segment_id to segment_name
        segment_id_to_name = {}
        for idx, stat in enumerate(segment_stats[:8]):  # Only first 8 segments
            segment_name = segment_names[idx]
            segment_id_to_name[stat['segment_id']] = segment_name

        # Apply segment names to all customers in the dataframe
        df['segment_name'] = df['segment'].map(segment_id_to_name).fillna('Unknown')

        # Log segment assignment for debugging
        logger.info(f"Segment assignment completed. Segments: {df['segment_name'].value_counts().to_dict()}")

        return {
            'segments': segments,
            'feature_importance': self._calculate_feature_importance(),
            'cluster_centers': self.model.cluster_centers_.tolist() if hasattr(self.model, 'cluster_centers_') else [],
            'total_customers': len(df),
            'segmentation_method': 'RFM_KMeans'
        }

    def _determine_optimal_clusters(self, data: np.ndarray, max_clusters: int = 10) -> int:
        """Determine optimal number of clusters using elbow method"""

        # Handle edge cases
        if data.shape[0] < 10:
            return min(2, data.shape[0])

        inertias = []
        for k in range(2, min(11, max_clusters + 1, data.shape[0] + 1)):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(data)
            inertias.append(kmeans.inertia_)

        if len(inertias) < 2:
            return 2

        # Calculate rate of change
        inertia_changes = np.diff(inertias) / np.array(inertias[:-1])

        # Find elbow point
        median_change = np.median(inertia_changes)
        elbow_point = np.where(inertia_changes < median_change)[0]

        if len(elbow_point) == 0:
            return min(3, data.shape[0])

        return elbow_point[0] + 2

    def _calculate_feature_importance(self) -> List[Dict]:
        """Calculate feature importance for the model"""

        # For clustering models, return equal weights
        feature_names = ['recency', 'frequency', 'monetary', 'avg_order_value', 'customer_lifetime_days']
        return [
            {'feature': name, 'importance': 1.0 / len(feature_names)}
            for name in feature_names
        ]

    def _prepare_rfm_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare RFM (Recency, Frequency, Monetary) features"""

        # Calculate recency (days since last transaction)
        if 'last_transaction_date' in df.columns:
            df['recency'] = (pd.Timestamp.now() - pd.to_datetime(df['last_transaction_date'])).dt.days
        else:
            df['recency'] = df.get('days_since_last_activity', 999)

        # Frequency (number of transactions)
        df['frequency'] = df.get('transaction_count', 0)

        # Monetary (total revenue)
        df['monetary'] = df.get('total_revenue', 0).fillna(0)

        # Additional features
        df['avg_order_value'] = df.get('avg_transaction_value', 0).fillna(0)
        df['customer_lifetime_days'] = (pd.Timestamp.now() - pd.to_datetime(df.get('first_transaction_date', pd.Timestamp.now()))).dt.days

        features_df = df[['recency', 'frequency', 'monetary', 'avg_order_value', 'customer_lifetime_days']].fillna(0)

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
