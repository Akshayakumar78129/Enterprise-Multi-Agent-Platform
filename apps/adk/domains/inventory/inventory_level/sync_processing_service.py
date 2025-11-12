"""Synchronous wrapper for inventory level processing service"""

import asyncio
from typing import Dict, Any, List
from .processing_service import InventoryLevelProcessingService


class SyncInventoryLevelProcessingService:
    """Synchronous wrapper for inventory level processing"""

    def __init__(self):
        self.async_service = InventoryLevelProcessingService()

    def _run_async(self, coro):
        """Helper to run async methods synchronously"""
        try:
            # Try to get existing event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running, create a new loop in a thread
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

    def analyze_inventory_health(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for analyze_inventory_health"""
        return self._run_async(self.async_service.analyze_inventory_health(filters))

    def get_inventory_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get inventory KPIs"""
        data = self.get_dashboard_data(filters)
        return data.get('kpis', {})

    def get_stock_levels(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get stock levels"""
        data = self.get_dashboard_data(filters)
        return data.get('stockLevels', [])

    def get_inventory_movements(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get inventory movements"""
        data = self.get_dashboard_data(filters)
        return data.get('movements', [])

    def get_alerts(self, filters: Dict[str, Any] = {}) -> List[str]:
        """Get inventory alerts"""
        data = self.get_dashboard_data(filters)
        return data.get('alerts', [])

    def get_insights(self, filters: Dict[str, Any] = {}) -> List[str]:
        """Get inventory insights"""
        data = self.get_dashboard_data(filters)
        return data.get('insights', [])