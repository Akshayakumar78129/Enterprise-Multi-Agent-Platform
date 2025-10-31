"""Synchronous wrapper for sales trends processing service"""

import asyncio
from typing import Dict, Any
from .processing_service import SalesTrendsProcessingService


class SyncSalesTrendsProcessingService:
    """Synchronous wrapper for sales trends processing - used by orchestration agent"""

    def __init__(self):
        self.async_service = SalesTrendsProcessingService()

    def _run_async(self, coro):
        """Helper to run async methods synchronously"""
        try:
            # Try to get existing event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running, run in separate thread
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, coro)
                    return future.result()
            else:
                # No running loop, we can use asyncio.run
                return asyncio.run(coro)
        except RuntimeError:
            # No event loop exists, create one
            return asyncio.run(coro)

    def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for get_dashboard_data"""
        return self._run_async(self.async_service.get_dashboard_data(filters))

    def get_sales_trends_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get sales trends summary with KPIs"""
        data = self.get_dashboard_data(filters)
        return {
            'kpis': data.get('kpiMetrics', {}),
            'mainData': data.get('mainData', {}),
            'insights': data.get('insights', []),
            'metadata': data.get('metadata', {})
        }

    def get_time_series(self, filters: Dict[str, Any] = {}) -> list:
        """Get time series data"""
        data = self.get_dashboard_data(filters)
        return data.get('mainData', {}).get('timeSeries', [])

    def get_seasonality(self, filters: Dict[str, Any] = {}) -> list:
        """Get seasonality patterns"""
        data = self.get_dashboard_data(filters)
        return data.get('mainData', {}).get('seasonality', [])

    def get_growth_rates(self, filters: Dict[str, Any] = {}) -> list:
        """Get growth rate data"""
        data = self.get_dashboard_data(filters)
        return data.get('mainData', {}).get('growthRates', [])

    def get_top_performers(self, filters: Dict[str, Any] = {}) -> list:
        """Get top performing products/categories"""
        data = self.get_dashboard_data(filters)
        return data.get('mainData', {}).get('topPerformers', [])

