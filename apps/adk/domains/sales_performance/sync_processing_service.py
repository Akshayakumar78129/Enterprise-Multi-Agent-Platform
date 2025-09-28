"""Synchronous wrapper for sales performance processing service"""

import asyncio
from typing import Dict, Any
from .processing_service import SalesPerformanceProcessingService


class SyncSalesPerformanceProcessingService:
    """Synchronous wrapper for sales performance processing"""

    def __init__(self):
        self.async_service = SalesPerformanceProcessingService()

    def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for get_dashboard_data"""
        return asyncio.run(self.async_service.get_dashboard_data(filters))

    def analyze_sales_performance(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for analyze_sales_performance"""
        return asyncio.run(self.async_service.analyze_sales_performance(filters))

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