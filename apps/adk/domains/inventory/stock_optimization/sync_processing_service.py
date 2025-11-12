"""Synchronous wrapper for stock optimization processing service"""

import asyncio
import logging
from typing import Dict, Any, List
from .processing_service import StockOptimizationProcessingService

logger = logging.getLogger(__name__)


class SyncStockOptimizationProcessingService:
    """Synchronous wrapper for stock optimization processing"""

    def __init__(self):
        self.async_service = StockOptimizationProcessingService()
        logger.info("SyncStockOptimizationProcessingService initialized")

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

    def get_dashboard_summary(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete dashboard summary with all components

        Args:
            filters: Filter parameters (dateFrom, dateTo, categories, etc.)

        Returns:
            Dictionary containing:
                - kpiMetrics: Key performance indicators
                - recommendations: Stock optimization recommendations
                - metrics: Before/after optimization metrics
                - reorderAnalysis: Reorder point analysis
                - insights: Strategic insights
                - filters: Applied filters
        """
        try:
            result = self._run_async(self.async_service.get_dashboard_summary(filters))
            return result
        except Exception as e:
            logger.error(f"Error in sync get_dashboard_summary: {e}", exc_info=True)
            return {
                'kpiMetrics': self.async_service._get_default_kpis(),
                'recommendations': [],
                'metrics': [],
                'reorderAnalysis': [],
                'insights': ["Unable to load stock optimization data. Please try again."],
                'filters': filters
            }
