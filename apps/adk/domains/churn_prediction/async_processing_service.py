"""Async wrapper for ChurnProcessingService to support FastAPI while keeping sync for agents"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Any, Optional
from .processing_service import ChurnProcessingService


class AsyncChurnProcessingService:
    """Async wrapper that provides async interface for FastAPI while using sync service internally"""

    def __init__(self):
        self.sync_service = ChurnProcessingService()
        self.executor = ThreadPoolExecutor(max_workers=3)

    async def _train_ml_model(self):
        """Async wrapper for training ML model"""
        # Note: _train_ml_model is now sync in the base service
        loop = asyncio.get_event_loop()
        # Check if it's a coroutine and handle accordingly
        train_method = self.sync_service._train_ml_model
        if asyncio.iscoroutinefunction(train_method):
            # If it's still async somehow, await it
            return await train_method()
        else:
            # If it's sync, run in executor
            return await loop.run_in_executor(
                self.executor,
                train_method
            )

    async def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Async wrapper for dashboard summary"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.sync_service.get_dashboard_summary,
            filters
        )

    async def get_customer_stats(self, filters: Dict) -> List[Dict]:
        """Async wrapper for customer stats"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.sync_service.get_customer_stats,
            filters
        )

    async def get_segment_risk(self, filters: Dict) -> List[Dict]:
        """Async wrapper for segment risk"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.sync_service.get_segment_risk,
            filters
        )

    async def get_monthly_risk(self, filters: Dict) -> List[Dict]:
        """Async wrapper for monthly risk"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.sync_service.get_monthly_risk,
            filters
        )

    async def get_probability_distribution(self, filters: Dict) -> List[Dict]:
        """Async wrapper for probability distribution"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.sync_service.get_probability_distribution,
            filters
        )

    async def get_feature_importance(self, filters: Dict) -> List[Dict]:
        """Async wrapper for feature importance"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.sync_service.get_feature_importance,
            filters
        )

    async def get_customers(self, filters: Dict) -> List[Dict]:
        """Async wrapper for getting customers"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.sync_service.get_customers,
            filters
        )

    async def export_data(self, filters: Dict, format: str = "csv") -> str:
        """Async wrapper for exporting data"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.sync_service.export_data,
            filters,
            format
        )

    def __del__(self):
        """Cleanup executor on deletion"""
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=False)