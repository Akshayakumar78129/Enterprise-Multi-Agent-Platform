"""Synchronous wrapper for AR Aging Processing Service

This wrapper allows agent tools to call async processing methods synchronously
"""

import asyncio
import logging
from typing import Dict, Any
from .processing_service import ARAgingProcessingService
from .models import ARAgingFilters

logger = logging.getLogger(__name__)


class ARAgingSyncProcessingService:
    """Synchronous wrapper for processing service"""

    def __init__(self):
        self.async_service = ARAgingProcessingService()
        self._loop = None

    def _get_or_create_event_loop(self):
        """Get or create an event loop for sync execution"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            return loop
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            return loop

    def _run_async(self, coro):
        """Run an async coroutine synchronously"""
        try:
            loop = self._get_or_create_event_loop()
            return loop.run_until_complete(coro)
        except Exception as e:
            logger.error(f"Error running async operation: {str(e)}")
            raise

    def get_ar_aging_summary(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get AR aging summary synchronously

        Args:
            filters: Dictionary of filters or ARAgingFilters instance

        Returns:
            Complete AR aging summary data
        """
        try:
            # Convert dict to ARAgingFilters if needed
            if isinstance(filters, dict):
                filters = ARAgingFilters(**filters)

            return self._run_async(
                self.async_service.get_ar_aging_summary(filters)
            )
        except Exception as e:
            logger.error(f"Error in get_ar_aging_summary: {str(e)}")
            raise

    def get_customer_details(self, customer_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get detailed AR information for a specific customer

        Args:
            customer_id: Customer identifier
            filters: Optional additional filters

        Returns:
            Customer AR details
        """
        try:
            if filters is None:
                filters = {}

            # Add customer filter
            filters['customer_id'] = customer_id

            summary = self.get_ar_aging_summary(filters)

            # Find specific customer in results
            customer_insights = summary.get('mainData', {}).get('customerInsights', [])
            customer = next(
                (c for c in customer_insights if c['customerId'] == customer_id),
                None
            )

            if not customer:
                return {
                    'error': f'Customer {customer_id} not found',
                    'customerId': customer_id
                }

            return customer

        except Exception as e:
            logger.error(f"Error in get_customer_details: {str(e)}")
            raise


# Create singleton instance
_sync_service_instance = None


def get_sync_processing_service() -> ARAgingSyncProcessingService:
    """Get singleton instance of sync processing service"""
    global _sync_service_instance
    if _sync_service_instance is None:
        _sync_service_instance = ARAgingSyncProcessingService()
    return _sync_service_instance
