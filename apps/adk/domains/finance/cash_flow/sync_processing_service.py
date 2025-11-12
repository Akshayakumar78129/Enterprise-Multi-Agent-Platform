"""Synchronous wrapper for cash flow processing service"""

import asyncio
from typing import Dict, Any
from .processing_service import CashFlowProcessingService


class SyncCashFlowProcessingService:
    """Synchronous wrapper for cash flow processing"""

    def __init__(self):
        self.async_service = CashFlowProcessingService()

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

    def analyze_cash_flow(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for analyze_cash_flow"""
        return self._run_async(self.async_service.analyze_cash_flow(filters))
