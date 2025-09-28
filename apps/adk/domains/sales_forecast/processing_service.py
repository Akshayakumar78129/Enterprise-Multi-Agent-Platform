"""Processing service for sales forecast analysis"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_percentage_error, mean_squared_error
import logging

from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import SalesForecastDataService
from .models import (
    ForecastKPI,
    ForecastData,
    SeasonalPattern,
    ForecastModel,
    ForecastScenario,
    SalesForecastResponse
)

logger = logging.getLogger(__name__)


class SalesForecastProcessingService:
    """Processing service for sales forecast analysis"""

    def __init__(self):
        self.data_service = SalesForecastDataService()
        self.models = {
            'linear': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42)
        }

    @cache_dashboard_endpoint("sales_forecast")
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete sales forecast dashboard data"""
        try:
            # Get forecast period from filters (default 30 days)
            forecast_period = filters.get('forecastPeriod', 30)
            
            # Get historical data
            historical_data = await self.data_service.get_time_series_features(filters)
            
            if historical_data.empty:
                logger.warning("No historical data available for forecasting")
                return self._empty_response(filters)
            
            # Generate forecast
            forecast_results = await self._generate_forecast(historical_data, forecast_period, filters)
            
            # Get KPIs
            kpis = await self._calculate_forecast_kpis(historical_data, forecast_results)
            
            # Get seasonal patterns
            seasonal_patterns = await self._get_seasonal_patterns(filters)
            
            # Get model information
            model_info = self._get_model_info(forecast_results.get('model', {}))
            
            # Generate scenarios
            scenarios = self._generate_scenarios(forecast_results)
            
            # Generate insights
            insights = self._generate_insights(kpis, forecast_results, seasonal_patterns)
            
            response = SalesForecastResponse(
                kpis=kpis,
                forecasts=forecast_results.get('forecasts', []),
                seasonalPatterns=seasonal_patterns,
                modelInfo=model_info,
                scenarios=scenarios,
                insights=insights,
                filters=filters
            )
            
            return response.dict()
            
        except Exception as e:
            logger.error(f"Error generating forecast dashboard: {str(e)}")
            raise

    async def _generate_forecast(self, historical_data: pd.DataFrame, forecast_period: int, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate sales forecast using time series analysis"""
        try:
            if len(historical_data) < 14:  # Need at least 2 weeks of data
                logger.warning("Insufficient historical data for forecasting")
                return {'forecasts': [], 'model': {}}
            
            # Prepare data for forecasting
            df = historical_data.copy()
            df = df.sort_values('date')
            
            # Create features for time series forecasting
            df['day_number'] = range(len(df))
            df['lag_1'] = df['revenue'].shift(1)
            df['lag_7'] = df['revenue'].shift(7)
            df['rolling_mean_7'] = df['revenue'].rolling(window=7).mean()
            df['rolling_std_7'] = df['revenue'].rolling(window=7).std()
            
            # Remove rows with NaN values
            df_clean = df.dropna()
            
            if len(df_clean) < 7:
                logger.warning("Insufficient clean data for forecasting")
                return {'forecasts': [], 'model': {}}
            
            # Features for modeling
            feature_cols = ['day_number', 'day_of_week', 'month', 'day_of_month', 
                          'lag_1', 'lag_7', 'rolling_mean_7', 'is_weekend']
            
            # Filter available features
            available_features = [col for col in feature_cols if col in df_clean.columns]
            
            X = df_clean[available_features]
            y = df_clean['revenue']
            
            # Train model (use random forest for better performance)
            model = self.models['random_forest']
            model.fit(X, y)
            
            # Calculate model accuracy
            y_pred = model.predict(X)
            mape = mean_absolute_percentage_error(y, y_pred) * 100
            rmse = np.sqrt(mean_squared_error(y, y_pred))
            
            # Generate future dates and features
            last_date = df['date'].max()
            future_dates = [last_date + timedelta(days=i) for i in range(1, forecast_period + 1)]
            
            forecasts = []
            last_revenue = df['revenue'].iloc[-1]
            
            for i, future_date in enumerate(future_dates):
                # Create features for future date
                future_features = {
                    'day_number': len(df) + i,
                    'day_of_week': future_date.weekday(),
                    'month': future_date.month,
                    'day_of_month': future_date.day,
                    'is_weekend': future_date.weekday() >= 5,
                    'lag_1': last_revenue,  # Use last known or predicted value
                    'lag_7': df['revenue'].iloc[-(7-i)] if i < 7 else forecasts[i-7]['revenue'],
                    'rolling_mean_7': df['revenue'].tail(7).mean()
                }
                
                # Filter to available features
                feature_vector = [future_features.get(col, 0) for col in available_features]
                
                # Predict
                predicted_revenue = model.predict([feature_vector])[0]
                
                # Calculate confidence bounds (simple approach)
                confidence_interval = 1.96 * rmse  # 95% confidence
                lower_bound = max(0, predicted_revenue - confidence_interval)
                upper_bound = predicted_revenue + confidence_interval
                
                forecast_point = ForecastData(
                    date=future_date.strftime('%Y-%m-%d'),
                    revenue=float(predicted_revenue),
                    quantity=int(predicted_revenue / 50),  # Estimate quantity based on avg price
                    lowerBound=float(lower_bound),
                    upperBound=float(upper_bound),
                    confidence=95.0
                )
                
                forecasts.append(forecast_point)
                last_revenue = predicted_revenue
            
            # Get feature importance
            feature_importance = {}
            if hasattr(model, 'feature_importances_'):
                for feature, importance in zip(available_features, model.feature_importances_):
                    feature_importance[feature] = float(importance)
            
            model_info = {
                'accuracy': float(100 - mape),
                'mape': float(mape),
                'rmse': float(rmse),
                'features': available_features,
                'importance': feature_importance
            }
            
            return {
                'forecasts': forecasts,
                'model': model_info
            }
            
        except Exception as e:
            logger.error(f"Error generating forecast: {str(e)}")
            raise

    async def _calculate_forecast_kpis(self, historical_data: pd.DataFrame, forecast_results: Dict[str, Any]) -> ForecastKPI:
        """Calculate forecast KPI metrics"""
        try:
            if historical_data.empty or not forecast_results.get('forecasts'):
                return ForecastKPI()
            
            # Current period metrics
            current_revenue = float(historical_data['revenue'].sum())
            
            # Forecast metrics
            forecast_revenue = sum(f.revenue for f in forecast_results['forecasts'])
            
            # Growth calculation
            recent_avg = float(historical_data['revenue'].tail(30).mean()) if len(historical_data) >= 30 else float(historical_data['revenue'].mean())
            forecast_avg = forecast_revenue / len(forecast_results['forecasts'])
            growth_rate = ((forecast_avg - recent_avg) / recent_avg * 100) if recent_avg > 0 else 0
            
            # Model metrics
            model_info = forecast_results.get('model', {})
            accuracy = model_info.get('accuracy', 0)
            variance = model_info.get('rmse', 0)
            
            return ForecastKPI(
                currentRevenue=current_revenue,
                forecastRevenue=forecast_revenue,
                growthRate=float(growth_rate),
                confidence=95.0,  # Default confidence level
                accuracy=accuracy,
                variance=variance
            )
            
        except Exception as e:
            logger.error(f"Error calculating forecast KPIs: {str(e)}")
            return ForecastKPI()

    async def _get_seasonal_patterns(self, filters: Dict[str, Any]) -> List[SeasonalPattern]:
        """Get seasonal patterns data"""
        try:
            seasonal_data = await self.data_service.get_seasonal_patterns(filters)
            
            patterns = []
            
            # Monthly patterns
            monthly_data = seasonal_data.get('monthly', {})
            for month, data in monthly_data.items():
                pattern = SeasonalPattern(
                    period=f"Month {month}",
                    avgRevenue=data.get('avg_revenue', 0),
                    growthRate=data.get('seasonal_index', 1) * 100 - 100,
                    volatility=data.get('volatility', 0)
                )
                patterns.append(pattern)
            
            # Quarterly patterns
            quarterly_data = seasonal_data.get('quarterly', {})
            for quarter, data in quarterly_data.items():
                pattern = SeasonalPattern(
                    period=f"Q{quarter}",
                    avgRevenue=data.get('avg_revenue', 0),
                    growthRate=data.get('seasonal_index', 1) * 100 - 100,
                    volatility=0
                )
                patterns.append(pattern)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error getting seasonal patterns: {str(e)}")
            return []

    def _get_model_info(self, model_data: Dict[str, Any]) -> ForecastModel:
        """Get forecast model information"""
        return ForecastModel(
            modelType="Random Forest",
            accuracy=model_data.get('accuracy', 0),
            mape=model_data.get('mape', 0),
            rmse=model_data.get('rmse', 0),
            features=model_data.get('features', []),
            importance=model_data.get('importance', {})
        )

    def _generate_scenarios(self, forecast_results: Dict[str, Any]) -> List[ForecastScenario]:
        """Generate forecast scenarios"""
        forecasts = forecast_results.get('forecasts', [])
        if not forecasts:
            return []
        
        base_revenue = sum(f.revenue for f in forecasts)
        
        scenarios = [
            ForecastScenario(
                scenario="Realistic",
                revenue=base_revenue,
                probability=60.0,
                assumptions=["Current trends continue", "No major market disruptions"]
            ),
            ForecastScenario(
                scenario="Optimistic",
                revenue=base_revenue * 1.15,
                probability=20.0,
                assumptions=["Increased marketing effectiveness", "Market expansion"]
            ),
            ForecastScenario(
                scenario="Pessimistic",
                revenue=base_revenue * 0.85,
                probability=20.0,
                assumptions=["Economic downturn", "Increased competition"]
            )
        ]
        
        return scenarios

    def _generate_insights(self, kpis: ForecastKPI, forecast_results: Dict[str, Any], 
                         seasonal_patterns: List[SeasonalPattern]) -> List[str]:
        """Generate forecast insights"""
        insights = []
        
        # Growth insights
        if kpis.growthRate > 10:
            insights.append(f"Strong growth forecast: {kpis.growthRate:.1f}% increase expected")
        elif kpis.growthRate < -5:
            insights.append(f"Revenue decline forecast: {abs(kpis.growthRate):.1f}% decrease expected")
        else:
            insights.append(f"Stable revenue forecast: {kpis.growthRate:.1f}% change expected")
        
        # Model confidence
        if kpis.accuracy > 85:
            insights.append(f"High model confidence: {kpis.accuracy:.1f}% accuracy")
        elif kpis.accuracy < 70:
            insights.append(f"Low model confidence: {kpis.accuracy:.1f}% accuracy - use with caution")
        
        # Seasonal insights
        if seasonal_patterns:
            best_month = max(seasonal_patterns, key=lambda x: x.avgRevenue if 'Month' in x.period else 0)
            if 'Month' in best_month.period:
                insights.append(f"Best performing period: {best_month.period}")
        
        return insights

    def _empty_response(self, filters: Dict[str, Any]) -> Dict:
        """Return empty response when no data available"""
        return SalesForecastResponse(
            kpis=ForecastKPI(),
            forecasts=[],
            seasonalPatterns=[],
            modelInfo=ForecastModel(modelType="None"),
            scenarios=[],
            insights=["No historical data available for forecasting"],
            filters=filters
        ).dict()
