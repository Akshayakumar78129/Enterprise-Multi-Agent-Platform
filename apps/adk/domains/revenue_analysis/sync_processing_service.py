"""Sync processing service for revenue analysis - Multi-agent integration"""

import asyncio
from typing import Dict, Any
from .processing_service import RevenueAnalysisProcessingService

class RevenueAnalysisSyncService:
    """Synchronous wrapper for revenue analysis processing service"""
    
    def __init__(self):
        self.async_service = RevenueAnalysisProcessingService()
    
    def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Synchronous wrapper for get_dashboard_data"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.async_service.get_dashboard_data(filters))
        finally:
            loop.close()
    
    def analyze_revenue(self, filters: Dict[str, Any] = {}) -> Dict:
        """Analyze revenue data"""
        return self.get_dashboard_data(filters)
