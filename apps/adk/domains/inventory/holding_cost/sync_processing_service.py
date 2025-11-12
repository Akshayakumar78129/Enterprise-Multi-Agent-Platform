"""Sync wrapper for HoldingCostProcessingService to support agent framework"""

import asyncio
from typing import Dict, List, Any
from .processing_service import HoldingCostProcessingService


class SyncHoldingCostProcessingService:
    """Sync wrapper that converts async HoldingCostProcessingService to sync for agent framework

    Agent tools must be synchronous, but our processing services use async/await.
    This wrapper runs async methods synchronously using asyncio.run().
    """

    def __init__(self):
        self.async_service = HoldingCostProcessingService()

    def _run_async(self, coro):
        """Helper to run async methods synchronously

        Args:
            coro: Async coroutine to execute

        Returns:
            Result of the coroutine execution
        """
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

    def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Sync wrapper for dashboard summary

        Args:
            filters: Filter dictionary (dateFrom, dateTo, category, etc.)

        Returns:
            Complete dashboard summary with KPIs, analysis, and insights
        """
        return self._run_async(self.async_service.get_dashboard_summary(filters))

    def get_inventory_data(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for getting raw inventory data

        Args:
            filters: Filter dictionary

        Returns:
            List of inventory records
        """
        return self._run_async(
            self.async_service.data_service.get_inventory_data(filters)
        )

    def get_category_summary(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for category summary

        Args:
            filters: Filter dictionary

        Returns:
            Category-level summary data
        """
        return self._run_async(
            self.async_service.data_service.get_category_summary(filters)
        )

    def get_warehouse_summary(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for warehouse summary

        Args:
            filters: Filter dictionary

        Returns:
            Warehouse-level summary data
        """
        return self._run_async(
            self.async_service.data_service.get_warehouse_summary(filters)
        )

    def get_high_cost_items(self, filters: Dict, limit: int = 50) -> List[Dict]:
        """Sync wrapper for high-cost items

        Args:
            filters: Filter dictionary
            limit: Maximum number of items to return

        Returns:
            List of high-cost items
        """
        return self._run_async(
            self.async_service.data_service.get_high_cost_items(filters, limit)
        )
