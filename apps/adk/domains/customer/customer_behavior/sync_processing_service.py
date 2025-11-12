"""Sync wrapper for CustomerBehaviorProcessingService to support agent framework"""

import asyncio
from typing import Dict, List, Any, Optional
from .processing_service import CustomerBehaviorProcessingService


class SyncCustomerBehaviorProcessingService:
    """Sync wrapper that converts async CustomerBehaviorProcessingService to sync for agent framework"""

    def __init__(self):
        self.async_service = CustomerBehaviorProcessingService()
        self._loop = None

    def _run_async(self, coro):
        """Helper to run async methods synchronously"""
        try:
            # Try to get existing event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running (shouldn't happen in agent context)
                # Create a new loop in a thread
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

    def get_behavior_summary(self, filters: Dict) -> Dict:
        """Sync wrapper for behavior summary"""
        return self._run_async(self.async_service.get_behavior_summary(filters))

    def get_purchase_patterns(self, filters: Dict) -> Dict:
        """Sync wrapper for purchase patterns"""
        return self._run_async(self.async_service.get_purchase_patterns(filters))

    def get_product_preferences(self, filters: Dict) -> Dict:
        """Sync wrapper for product preferences"""
        return self._run_async(self.async_service.get_product_preferences(filters))

    def get_channel_usage(self, filters: Dict) -> Dict:
        """Sync wrapper for channel usage"""
        return self._run_async(self.async_service.get_channel_usage(filters))

    def get_engagement_metrics(self, filters: Dict) -> Dict:
        """Sync wrapper for engagement metrics"""
        return self._run_async(self.async_service.get_engagement_metrics(filters))

    def get_customer_segments(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for customer segments"""
        return self._run_async(self.async_service.get_customer_segments(filters))

    def get_top_customers(self, filters: Dict, limit: int = 20) -> List[Dict]:
        """Sync wrapper for top customers"""
        return self._run_async(self.async_service.get_top_customers(filters, limit))

    def export_data(self, filters: Dict, format: str = "csv") -> str:
        """Sync wrapper for exporting data"""
        return self._run_async(self.async_service.export_data(filters, format))