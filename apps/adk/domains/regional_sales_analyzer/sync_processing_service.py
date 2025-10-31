"""Synchronous wrapper for regional sales analyzer processing service"""

import asyncio
from typing import Dict, Any
from .processing_service import RegionalSalesAnalyzerProcessingService


class SyncRegionalSalesAnalyzerProcessingService:
    """Synchronous wrapper for regional sales analyzer - used by orchestration agent"""

    def __init__(self):
        self.async_service = RegionalSalesAnalyzerProcessingService()

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
        """Synchronous wrapper for get_dashboard_summary"""
        return self._run_async(self.async_service.get_dashboard_summary(filters))

    def get_regional_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get regional sales summary with KPIs and insights"""
        data = self.get_dashboard_data(filters)
        return {
            'kpis': data.get('kpiMetrics', {}),
            'mainData': data.get('mainData', {}),
            'insights': data.get('insights', []),  # Includes AI insights!
            'metadata': data.get('metadata', {})
        }

    def get_regional_trends(self, filters: Dict[str, Any] = {}) -> list:
        """Get regional sales trends"""
        data = self.get_dashboard_data(filters)
        return data.get('mainData', {}).get('regionalTrends', [])

    def get_regional_performance(self, filters: Dict[str, Any] = {}) -> list:
        """Get regional performance comparison"""
        data = self.get_dashboard_data(filters)
        return data.get('mainData', {}).get('regionalPerformance', [])

    def get_growth_opportunities(self, filters: Dict[str, Any] = {}) -> list:
        """Get growth opportunities by region"""
        data = self.get_dashboard_data(filters)
        return data.get('mainData', {}).get('growthOpportunities', [])

    def get_market_share(self, filters: Dict[str, Any] = {}) -> list:
        """Get market share by region"""
        data = self.get_dashboard_data(filters)
        return data.get('mainData', {}).get('marketShare', [])

