"""Processing service for supplier performance analysis"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
from domains.common.simple_cache import cache_dashboard_endpoint
from .data_service import SupplierPerformanceDataService
from .models import *

logger = logging.getLogger(__name__)


class SupplierPerformanceProcessingService:
    """Processing service for supplier performance operations"""

    def __init__(self):
        self.data_service = SupplierPerformanceDataService()
        logger.info("SupplierPerformanceService initialized")

    @cache_dashboard_endpoint("supplier_performance.get_dashboard_data")
    async def get_dashboard_data(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get complete dashboard data"""
        try:
            # Get all data components
            kpis = await self.get_kpis(filters)
            detailed_data = await self.get_detailed_data(filters)
            insights = await self.get_insights(filters)

            return {
                'kpis': kpis,
                'data': detailed_data,
                'insights': insights,
                'filters': filters
            }

        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return {
                'kpis': {'onTimeDelivery': 0, 'qualityScore': 0, 'leadTime': 0, 'costVariance': 0, 'reliabilityScore': 0, 'defectRate': 0},
                'data': [],
                'insights': [],
                'filters': filters
            }

    @cache_dashboard_endpoint("supplier_performance.get_kpis")
    async def get_kpis(self, filters: Dict[str, Any] = {}) -> Dict:
        """Get supplier performance KPIs"""
        try:
            return await self.data_service.get_kpis(filters)
        except Exception as e:
            logger.error(f"Error getting KPIs: {e}")
            return {'onTimeDelivery': 0, 'qualityScore': 0, 'leadTime': 0, 'costVariance': 0, 'reliabilityScore': 0, 'defectRate': 0}

    @cache_dashboard_endpoint("supplier_performance.get_detailed_data")
    async def get_detailed_data(self, filters: Dict[str, Any] = {}) -> List[Dict]:
        """Get detailed data"""
        try:
            return await self.data_service.get_detailed_data(filters)
        except Exception as e:
            logger.error(f"Error getting detailed data: {e}")
            return []

    async def get_insights(self, filters: Dict[str, Any] = {}) -> List[str]:
        """Generate insights"""
        try:
            insights = []
            kpis = await self.get_kpis(filters)

            # Generate domain-specific insights
            insights.append(f"📊 Supplier Performance analysis complete")

            return insights[:5]

        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return []
