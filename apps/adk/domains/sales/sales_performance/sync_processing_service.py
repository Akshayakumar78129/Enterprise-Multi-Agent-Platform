"""Synchronous wrapper for sales performance processing service"""

import asyncio
from typing import Dict, Any
from .processing_service import SalesPerformanceProcessingService


class SyncSalesPerformanceProcessingService:
    """Synchronous wrapper for sales performance processing"""

    def __init__(self):
        self.async_service = SalesPerformanceProcessingService()

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

    def analyze_sales_performance(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for analyze_sales_performance"""
        return self._run_async(self.async_service.analyze_sales_performance(filters))

    def get_sales_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get sales summary KPIs"""
        data = self.get_dashboard_data(filters)
        return data.get('kpis', {})

    def get_product_performance(self, filters: Dict[str, Any] = {}) -> list:
        """Get product performance data"""
        data = self.get_dashboard_data(filters)
        return data.get('productPerformance', [])

    def get_regional_performance(self, filters: Dict[str, Any] = {}) -> list:
        """Get regional performance data"""
        data = self.get_dashboard_data(filters)
        return data.get('regionPerformance', [])

    def get_sales_trends(self, filters: Dict[str, Any] = {}) -> list:
        """Get sales trends"""
        data = self.get_dashboard_data(filters)
        return data.get('salesTrends', [])

    def get_category_performance(self, filters: Dict[str, Any] = {}) -> list:
        """Get category performance"""
        data = self.get_dashboard_data(filters)
        return data.get('categoryPerformance', [])

    def get_top_customers(self, filters: Dict[str, Any] = {}) -> list:
        """Get top customers"""
        data = self.get_dashboard_data(filters)
        return data.get('topCustomers', [])