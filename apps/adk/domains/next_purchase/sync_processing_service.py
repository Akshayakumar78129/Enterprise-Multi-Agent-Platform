"""Sync wrapper for NextPurchaseService to support agent framework"""

import asyncio
from typing import Dict, List, Any, Optional
from .processing_service import NextPurchaseService


class SyncNextPurchaseService:
    """Sync wrapper that converts async NextPurchaseService to sync for agent framework"""

    def __init__(self):
        self.async_service = NextPurchaseService()
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

    def get_dashboard_summary(self, filters: Dict) -> Dict:
        """Sync wrapper for dashboard summary"""
        return self._run_async(self.async_service.get_dashboard_summary(filters))

    def perform_analysis(self, filters: Dict) -> Dict:
        """Sync wrapper for performing ML analysis"""
        # Get dashboard data and run analysis
        result = self.get_dashboard_summary(filters)
        return result

    def get_ml_predictions(self, filters: Dict) -> Dict:
        """Sync wrapper for getting ML predictions"""
        result = self.get_dashboard_summary(filters)
        return result.get('mlResults', {})

    def get_insights(self, filters: Dict) -> List[str]:
        """Sync wrapper for getting insights"""
        result = self.get_dashboard_summary(filters)
        return result.get('insights', [])

    def export_data(self, filters: Dict, format: str = "csv") -> str:
        """Sync wrapper for exporting data"""
        result = self.get_dashboard_summary(filters)

        # Format data for export
        if format == "csv":
            import csv
            import io

            output = io.StringIO()
            if result.get('mlResults', {}).get('predictions'):
                predictions = result['mlResults']['predictions']
                if predictions:
                    writer = csv.DictWriter(output, fieldnames=predictions[0].keys())
                    writer.writeheader()
                    writer.writerows(predictions)

            return output.getvalue()

        return str(result)
