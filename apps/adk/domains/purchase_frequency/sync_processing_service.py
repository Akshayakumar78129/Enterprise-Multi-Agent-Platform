"""Synchronous wrapper for Purchase Frequency Processing Service
Used by orchestration agent to avoid event loop conflicts.
"""

import asyncio
from typing import Dict, Any
from .processing_service import PurchaseFrequencyProcessingService


class SyncPurchaseFrequencyProcessingService:
    """Synchronous wrapper around async PurchaseFrequencyProcessingService"""

    def __init__(self):
        self.async_service = PurchaseFrequencyProcessingService()
        self._loop = None

    def _run_async(self, coro):
        """Helper to run async methods synchronously"""
        try:
            # Try to get existing event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running (agent context)
                # Run in a separate thread to avoid conflicts
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

    def get_dashboard_summary(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Synchronous wrapper for get_dashboard_summary

        Args:
            filters: Filter parameters

        Returns:
            Dashboard summary data
        """
        return self._run_async(self.async_service.get_dashboard_summary(filters))
