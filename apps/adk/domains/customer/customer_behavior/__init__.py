"""Customer behavior domain package"""

from .processing_service import CustomerBehaviorProcessingService
from .sync_processing_service import SyncCustomerBehaviorProcessingService
from .data_service import CustomerBehaviorDataService
from .schema import CustomerBehaviorSchema
from .models import (
    CustomerBehaviorFilters,
    CustomerBehaviorDetail,
    PurchasePattern,
    ProductPreference,
    ChannelUsage,
    EngagementMetric,
    CustomerSegment,
    BehaviorSummaryResponse
)

__all__ = [
    'CustomerBehaviorProcessingService',
    'SyncCustomerBehaviorProcessingService',
    'CustomerBehaviorDataService',
    'CustomerBehaviorSchema',
    'CustomerBehaviorFilters',
    'CustomerBehaviorDetail',
    'PurchasePattern',
    'ProductPreference',
    'ChannelUsage',
    'EngagementMetric',
    'CustomerSegment',
    'BehaviorSummaryResponse'
]