"""Synchronous wrapper for product performance processing service"""

import asyncio
from typing import Dict, Any
from .processing_service import ProductPerformanceProcessingService


class SyncProductPerformanceProcessingService:
    """Synchronous wrapper for product performance processing - used by orchestration agent"""

    def __init__(self):
        self.async_service = ProductPerformanceProcessingService()

    def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for get_dashboard_summary"""
        return asyncio.run(self.async_service.get_dashboard_summary(filters))

    def get_product_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get product summary KPIs"""
        data = self.get_dashboard_data(filters)
        return data.get('kpiMetrics', {})

    def get_top_products(self, filters: Dict[str, Any] = {}) -> list:
        """Get top performing products"""
        data = self.get_dashboard_data(filters)
        main_data = data.get('mainData', {})
        return main_data.get('topProducts', [])

    def get_category_performance(self, filters: Dict[str, Any] = {}) -> list:
        """Get category performance data"""
        data = self.get_dashboard_data(filters)
        main_data = data.get('mainData', {})
        return main_data.get('categoryPerformance', [])

    def get_margin_analysis(self, filters: Dict[str, Any] = {}) -> list:
        """Get margin analysis"""
        data = self.get_dashboard_data(filters)
        main_data = data.get('mainData', {})
        return main_data.get('marginAnalysis', [])

    def get_price_bands(self, filters: Dict[str, Any] = {}) -> list:
        """Get price band distribution"""
        data = self.get_dashboard_data(filters)
        main_data = data.get('mainData', {})
        return main_data.get('priceBandDistribution', [])
