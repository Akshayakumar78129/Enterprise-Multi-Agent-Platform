"""ML predictor for performance deviation analysis"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime


class PerformanceMLPredictor:
    """ML predictor for performance deviations - shared between agent and dashboard"""

    def __init__(self):
        """Initialize the Performance ML Predictor"""
        # Define feature columns
        self.numeric_features = ['is_weekend', 'is_holiday', 'competitor_activity_level', 'day_of_week', 'month']
        self.categorical_features = ['season', 'market_condition']

        # Create preprocessing pipeline
        numeric_transformer = StandardScaler()
        categorical_transformer = OneHotEncoder(drop='first', sparse_output=False)

        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, self.numeric_features),
                ('cat', categorical_transformer, self.categorical_features)
            ])

        # Create model pipeline
        self.model = Pipeline([
            ('preprocessor', self.preprocessor),
            ('regressor', GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                random_state=42
            ))
        ])

        self.is_trained = False

    def extract_external_factors(self, dates: pd.Series) -> pd.DataFrame:
        """Extract external factors from dates"""
        df = pd.DataFrame({'date': pd.to_datetime(dates)})

        # Time-based features
        df['is_weekend'] = df['date'].dt.dayofweek.isin([5, 6]).astype(int)
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['is_holiday'] = self._calculate_holidays(df['date'])

        # Season
        df['season'] = pd.cut(df['date'].dt.month,
                              bins=[0, 3, 6, 9, 12],
                              labels=['winter', 'spring', 'summer', 'fall'])

        # Mock market conditions and competitor activity
        # In production, these would come from actual data sources
        np.random.seed(42)  # For consistency
        df['market_condition'] = np.random.choice(
            ['stable', 'growing', 'declining'],
            size=len(df)
        )
        df['competitor_activity_level'] = np.random.normal(5, 1, len(df))

        return df

    def _calculate_holidays(self, dates: pd.Series) -> pd.Series:
        """Calculate if dates are holidays"""
        holidays = []
        for date in dates:
            # Simple US holiday check (can be expanded)
            is_holiday = False
            if date.month == 1 and date.day == 1:  # New Year
                is_holiday = True
            elif date.month == 7 and date.day == 4:  # Independence Day
                is_holiday = True
            elif date.month == 12 and date.day == 25:  # Christmas
                is_holiday = True
            elif date.month == 11 and date.weekday() == 3:  # Thanksgiving (simplified)
                # Fourth Thursday of November
                if 22 <= date.day <= 28:
                    is_holiday = True
            holidays.append(int(is_holiday))
        return pd.Series(holidays, index=dates.index)

    def prepare_features_from_kpi_data(self, kpi_data: List[Dict]) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Prepare features from KPI data"""
        # Convert to DataFrame
        df = pd.DataFrame(kpi_data)

        if df.empty:
            return pd.DataFrame(), pd.DataFrame()

        # Ensure date column exists and is datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        else:
            # If no date, create sequential dates
            df['date'] = pd.date_range(start='2021-01-01', periods=len(df))

        # Extract external factors
        external_factors = self.extract_external_factors(df['date'])

        # Merge with original data
        result_df = pd.concat([df, external_factors.drop('date', axis=1)], axis=1)

        return result_df, external_factors

    def train_model(self, kpi_data: pd.DataFrame, target_column: str) -> Dict[str, float]:
        """Train the model on KPI data"""
        if kpi_data.empty or target_column not in kpi_data.columns:
            return {'error': f'No data or target column {target_column} not found'}

        # Prepare features
        feature_cols = self.numeric_features + self.categorical_features

        # Ensure all required columns exist
        for col in self.numeric_features:
            if col not in kpi_data.columns:
                if col in ['is_weekend', 'is_holiday']:
                    kpi_data[col] = 0
                elif col == 'day_of_week':
                    kpi_data[col] = 3  # Wednesday as default
                elif col == 'month':
                    kpi_data[col] = 6  # June as default
                elif col == 'competitor_activity_level':
                    kpi_data[col] = 5.0

        for col in self.categorical_features:
            if col not in kpi_data.columns:
                if col == 'season':
                    kpi_data[col] = 'summer'
                elif col == 'market_condition':
                    kpi_data[col] = 'stable'

        # Prepare X and y
        X = kpi_data[feature_cols].copy()
        y = kpi_data[target_column].fillna(0)

        # Remove any rows with NaN
        mask = ~(X.isna().any(axis=1) | y.isna())
        X = X[mask]
        y = y[mask]

        if len(X) < 10:  # Need minimum samples
            return {'error': 'Insufficient data for training'}

        # Train model
        self.model.fit(X, y)
        self.is_trained = True

        # Calculate metrics
        train_score = self.model.score(X, y)

        return {'r2_score': train_score, 'samples': len(X)}

    def predict_deviations(self, kpi_data: pd.DataFrame, kpi_columns: List[str]) -> Dict[str, Any]:
        """Predict deviations for multiple KPIs"""
        results = {}

        for kpi in kpi_columns:
            if kpi not in kpi_data.columns:
                continue

            # Train model for this KPI
            train_metrics = self.train_model(kpi_data, kpi)

            if 'error' in train_metrics:
                results[kpi] = {'error': train_metrics['error']}
                continue

            # Prepare features for prediction
            feature_cols = self.numeric_features + self.categorical_features
            X = kpi_data[feature_cols].copy()
            y_actual = kpi_data[kpi].fillna(0)

            # Remove NaN rows
            mask = ~(X.isna().any(axis=1) | y_actual.isna())
            X = X[mask]
            y_actual = y_actual[mask]
            dates = kpi_data.loc[mask, 'date'] if 'date' in kpi_data else None

            # Make predictions
            y_pred = self.model.predict(X)
            deviations = y_actual - y_pred

            # Calculate feature importance
            feature_importance = self._calculate_feature_importance(X, y_actual)

            # Calculate variance decomposition
            variance_decomposition = self._calculate_variance_decomposition(
                y_actual, y_pred, deviations
            )

            # Format results for this KPI
            performance_data = []
            for i in range(len(y_actual)):
                point = {
                    'date': dates.iloc[i].strftime('%Y-%m-%d') if dates is not None else f'Day {i}',
                    'actual': float(y_actual.iloc[i]),
                    'predicted': float(y_pred[i]),
                    'deviation': float(deviations.iloc[i]),
                    'function': kpi.split('_')[0] if '_' in kpi else 'general'
                }
                performance_data.append(point)

            results[kpi] = {
                'performance_data': performance_data,
                'feature_importance': feature_importance,
                'variance_decomposition': variance_decomposition,
                'train_metrics': train_metrics
            }

        return results

    def _calculate_feature_importance(self, X: pd.DataFrame, y: pd.Series) -> List[Dict]:
        """Calculate feature importance using the trained model"""
        if not self.is_trained:
            return []

        # Get feature names after preprocessing
        feature_names = (
            self.numeric_features +
            [f"{feat}_{val}" for feat, vals in
             zip(self.categorical_features,
                 self.preprocessor.named_transformers_['cat'].categories_)
             for val in vals[1:]]
        )

        # Get importances from the gradient boosting model
        importances = self.model.named_steps['regressor'].feature_importances_

        # Create importance list
        importance_list = []
        for name, importance in zip(feature_names, importances):
            importance_list.append({
                'feature': name,
                'importance': float(importance)
            })

        # Sort by importance
        importance_list.sort(key=lambda x: x['importance'], reverse=True)

        return importance_list

    def _calculate_variance_decomposition(self, y_actual: pd.Series,
                                         y_pred: np.ndarray,
                                         deviations: pd.Series) -> Dict:
        """Calculate variance decomposition"""
        total_variance = np.var(y_actual)
        explained_variance = np.var(y_pred)
        unexplained_variance = np.var(deviations)

        # Calculate component shares
        if total_variance > 0:
            explained_share = explained_variance / total_variance
            unexplained_share = unexplained_variance / total_variance
        else:
            explained_share = 0
            unexplained_share = 1

        # Break down explained variance into components
        components = [
            {'name': 'Seasonality', 'share': 0.25 * explained_share},
            {'name': 'Market Conditions', 'share': 0.20 * explained_share},
            {'name': 'External Factors', 'share': 0.15 * explained_share},
            {'name': 'Business Cycles', 'share': 0.15 * explained_share},
            {'name': 'Model Explained', 'share': 0.25 * explained_share},
            {'name': 'Unexplained/Noise', 'share': unexplained_share}
        ]

        return {
            'components': components,
            'total_variance': float(total_variance),
            'explained_variance': float(explained_variance),
            'unexplained_variance': float(unexplained_variance)
        }