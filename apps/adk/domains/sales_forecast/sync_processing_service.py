"""Sync processing service for sales forecast analysis - Multi-agent integration"""

import asyncio
from typing import Dict, Any
from .processing_service import SalesForecastProcessingService


class SalesForecastSyncService:
    """Synchronous wrapper for sales forecast processing service"""
    
    def __init__(self):
        self.async_service = SalesForecastProcessingService()
    
    def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for get_dashboard_data"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.async_service.get_dashboard_data(filters))
        finally:
            loop.close()
    
    def generate_forecast(self, forecast_period: int = 30, filters: Dict[str, Any] = {}) -> Dict:
        """Generate sales forecast"""
        forecast_filters = filters.copy()
        forecast_filters['forecastPeriod'] = forecast_period
        return self.get_dashboard_data(forecast_filters)
    
    def analyze_trends(self, filters: Dict[str, Any] = {}) -> Dict:
        """Analyze sales trends for forecasting"""
        return self.get_dashboard_data(filters)
