"""Synchronous wrapper for demand forecast processing service"""

import asyncio
from typing import Dict, Any, List
from .processing_service import DemandForecastProcessingService


class SyncDemandForecastProcessingService:
    """Synchronous wrapper for demand forecast processing"""

    def __init__(self):
        self.async_service = DemandForecastProcessingService()

    def _run_async(self, coro):
        """Helper to run async methods synchronously"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, coro)
                    return future.result()
            else:
                return asyncio.run(coro)
        except RuntimeError:
            return asyncio.run(coro)

    def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for get_dashboard_data"""
        return self._run_async(self.async_service.get_dashboard_data(filters))

    def get_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get KPIs"""
        return self._run_async(self.async_service.get_kpis(filters))

    def get_detailed_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get detailed data"""
        return self._run_async(self.async_service.get_detailed_data(filters))
