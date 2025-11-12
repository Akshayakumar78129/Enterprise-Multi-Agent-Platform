"""Sync wrapper for AnomalyProcessingService to support agent framework"""

import asyncio
from typing import Dict, List, Any, Optional
from .processing_service import AnomalyProcessingService


class SyncAnomalyProcessingService:
    """Sync wrapper that converts async AnomalyProcessingService to sync for agent framework"""

    def __init__(self):
        self.async_service = AnomalyProcessingService()
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

    def _train_ml_model(self):
        """Sync wrapper for training ML model"""
        return self._run_async(self.async_service._train_ml_model())

    def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Sync wrapper for dashboard summary"""
        return self._run_async(self.async_service.get_dashboard_summary(filters))

    def get_customer_anomalies(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for customer anomalies"""
        return self._run_async(self.async_service.get_customer_anomalies(filters))

    def get_segment_distribution(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for segment distribution"""
        return self._run_async(self.async_service.get_segment_distribution(filters))

    def get_region_distribution(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for region distribution"""
        return self._run_async(self.async_service.get_region_distribution(filters))

    def get_severity_distribution(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for severity distribution"""
        return self._run_async(self.async_service.get_severity_distribution(filters))

    def get_feature_importance(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for feature importance"""
        return self._run_async(self.async_service.get_feature_importance(filters))

    def get_time_series_anomalies(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for time series anomalies"""
        return self._run_async(self.async_service.get_time_series_anomalies(filters))

    def get_customers(self, filters: Dict) -> List[Dict]:
        """Sync wrapper for getting customers"""
        return self._run_async(self.async_service.get_customers(filters))

    def export_data(self, filters: Dict, format: str = "csv") -> str:
        """Sync wrapper for exporting data"""
        return self._run_async(self.async_service.export_data(filters, format))