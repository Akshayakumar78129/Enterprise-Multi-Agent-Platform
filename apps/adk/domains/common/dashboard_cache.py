"""
Centralized dashboard caching system for all current and future dashboard APIs.
This module provides intelligent caching with automatic invalidation and TTL management.
"""

import json
import hashlib
import functools
from typing import Any, Dict, Optional, Callable, List
from datetime import datetime, timedelta
import asyncio
import sys
import os
# Add parent directory to path to import caching directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from orchestration_agent.utils.caching import multi_cache, CacheConfig


class DashboardCacheConfig:
    """Configuration for dashboard-specific caching"""

    # CACHE VERSION - increment to invalidate all caches
    CACHE_VERSION = "v3_20251102_2200"

    # Default TTLs for different dashboard types (in seconds)
    DEFAULT_TTL = 300  # 5 minutes default

    DASHBOARD_TTL = {
        'churn': 300,      # 5 minutes for churn predictions
        'sales': 180,      # 3 minutes for sales data
        'inventory': 120,  # 2 minutes for inventory (changes frequently)
        'financial': 600,  # 10 minutes for financial (computed daily)
        'customer': 300,   # 5 minutes for customer insights
        'default': 300     # 5 minutes fallback
    }

    # Cache invalidation triggers
    INVALIDATE_ON_DATA_CHANGE = True
    INVALIDATE_PATTERNS = {
        'transaction': ['sales', 'financial', 'churn'],
        'customer': ['customer', 'churn'],
        'inventory': ['inventory'],
        'loyalty': ['customer', 'churn']
    }


def generate_dashboard_cache_key(
    dashboard_type: str,
    endpoint: str,
    filters: Dict[str, Any]
) -> str:
    """
    Generate a unique cache key for dashboard requests.

    Args:
        dashboard_type: Type of dashboard (e.g., 'churn', 'sales')
        endpoint: API endpoint name
        filters: Request filters/parameters

    Returns:
        Unique cache key string
    """
    # Normalize filters by sorting and removing None values
    normalized_filters = {}
    for key, value in filters.items():
        if value is not None:
            # Handle lists by sorting them
            if isinstance(value, list):
                normalized_filters[key] = sorted(value)
            else:
                normalized_filters[key] = value

    # Create cache key components
    key_data = {
        'dashboard': dashboard_type,
        'endpoint': endpoint,
        'filters': normalized_filters,
        'version': DashboardCacheConfig.CACHE_VERSION  # Version for cache invalidation on schema changes
    }

    # Generate hash for the key
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()

    # Return readable prefix with hash
    return f"dashboard:{dashboard_type}:{endpoint}:{key_hash}"


def cache_dashboard_endpoint(
    dashboard_type: str = 'default',
    ttl: Optional[int] = None,
    invalidate_on: Optional[List[str]] = None
):
    """
    Decorator for caching dashboard endpoint results.

    This decorator provides intelligent caching for dashboard APIs with:
    - Automatic cache key generation from request parameters
    - Configurable TTL per dashboard type
    - Support for async and sync functions
    - Automatic cache invalidation triggers

    Args:
        dashboard_type: Type of dashboard for TTL configuration
        ttl: Override TTL in seconds (uses dashboard default if None)
        invalidate_on: List of data types that trigger cache invalidation

    Example:
        @cache_dashboard_endpoint(dashboard_type='churn', ttl=300)
        async def get_dashboard_summary(filters: Dict):
            # Expensive computation
            return result
    """
    def decorator(func: Callable) -> Callable:
        # Determine if function is async
        is_async = asyncio.iscoroutinefunction(func)

        # Get TTL for this dashboard type
        cache_ttl = ttl or DashboardCacheConfig.DASHBOARD_TTL.get(
            dashboard_type,
            DashboardCacheConfig.DEFAULT_TTL
        )

        if is_async:
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Extract filters from arguments
                filters = {}

                # Handle different argument patterns
                if args and isinstance(args[0], dict):
                    filters = args[0]
                elif 'filters' in kwargs:
                    filters = kwargs['filters']
                elif len(args) > 1 and isinstance(args[1], dict):
                    # Second argument might be filters (first could be self)
                    filters = args[1]

                # Generate cache key
                endpoint_name = func.__name__
                cache_key = generate_dashboard_cache_key(
                    dashboard_type,
                    endpoint_name,
                    filters
                )

                # Try to get from cache
                cached_result = multi_cache.get(cache_key)
                if cached_result is not None:
                    # Add metadata to indicate cache hit
                    if isinstance(cached_result, dict):
                        cached_result['_cached'] = True
                        cached_result['_cache_timestamp'] = datetime.now().isoformat()
                    return cached_result

                # Execute function and cache result
                result = await func(*args, **kwargs)

                # Only cache successful results
                if result is not None:
                    multi_cache.set(cache_key, result, cache_ttl)

                # Add metadata to indicate fresh data
                if isinstance(result, dict):
                    result['_cached'] = False
                    result['_timestamp'] = datetime.now().isoformat()

                return result

            return async_wrapper
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                # Extract filters from arguments
                filters = {}

                # Handle different argument patterns
                if args and isinstance(args[0], dict):
                    filters = args[0]
                elif 'filters' in kwargs:
                    filters = kwargs['filters']
                elif len(args) > 1 and isinstance(args[1], dict):
                    filters = args[1]

                # Generate cache key
                endpoint_name = func.__name__
                cache_key = generate_dashboard_cache_key(
                    dashboard_type,
                    endpoint_name,
                    filters
                )

                # Try to get from cache
                cached_result = multi_cache.get(cache_key)
                if cached_result is not None:
                    # Add metadata to indicate cache hit
                    if isinstance(cached_result, dict):
                        cached_result['_cached'] = True
                        cached_result['_cache_timestamp'] = datetime.now().isoformat()
                    return cached_result

                # Execute function and cache result
                result = func(*args, **kwargs)

                # Only cache successful results
                if result is not None:
                    multi_cache.set(cache_key, result, cache_ttl)

                # Add metadata to indicate fresh data
                if isinstance(result, dict):
                    result['_cached'] = False
                    result['_timestamp'] = datetime.now().isoformat()

                return result

            return sync_wrapper

    return decorator


def invalidate_dashboard_cache(dashboard_type: str = None, data_type: str = None):
    """
    Invalidate cached dashboard data.

    Args:
        dashboard_type: Specific dashboard to invalidate (None for all)
        data_type: Data type that changed (triggers related invalidations)
    """
    if data_type and DashboardCacheConfig.INVALIDATE_ON_DATA_CHANGE:
        # Invalidate all dashboards affected by this data type
        affected_dashboards = DashboardCacheConfig.INVALIDATE_PATTERNS.get(
            data_type, []
        )
        for dashboard in affected_dashboards:
            pattern = f"dashboard:{dashboard}:*"
            # Note: This would need Redis SCAN for pattern matching
            # For now, we clear specific dashboard types
            print(f"[DashboardCache] Invalidating cache for {dashboard} due to {data_type} change")

    elif dashboard_type:
        # Invalidate specific dashboard type
        pattern = f"dashboard:{dashboard_type}:*"
        print(f"[DashboardCache] Invalidating cache for {dashboard_type}")

    else:
        # Clear all dashboard caches
        print("[DashboardCache] Invalidating all dashboard caches")

    # For now, we'll clear the entire cache
    # In production with Redis, we'd use SCAN to match patterns
    multi_cache.clear()


class DashboardCacheManager:
    """
    Manager class for dashboard caching operations.
    Provides centralized control over cache behavior.
    """

    def __init__(self):
        self.cache_hits = 0
        self.cache_misses = 0
        self.enabled = True

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        hit_rate = (
            self.cache_hits / (self.cache_hits + self.cache_misses)
            if (self.cache_hits + self.cache_misses) > 0
            else 0
        )

        return {
            'enabled': self.enabled,
            'hits': self.cache_hits,
            'misses': self.cache_misses,
            'hit_rate': hit_rate,
            'backend_stats': multi_cache.caches[0].get_stats() if multi_cache.caches else {}
        }

    def enable(self):
        """Enable caching"""
        self.enabled = True
        print("[DashboardCache] Caching enabled")

    def disable(self):
        """Disable caching (for debugging)"""
        self.enabled = False
        print("[DashboardCache] Caching disabled")

    def clear(self):
        """Clear all caches"""
        multi_cache.clear()
        self.cache_hits = 0
        self.cache_misses = 0
        print("[DashboardCache] All caches cleared")


# Global cache manager instance
dashboard_cache_manager = DashboardCacheManager()


# Helper function for batch caching
async def cache_batch_results(
    dashboard_type: str,
    results: Dict[str, Any],
    ttl: Optional[int] = None
):
    """
    Cache multiple related results at once.
    Useful for endpoints that compute multiple metrics.

    Args:
        dashboard_type: Type of dashboard
        results: Dictionary of endpoint_name -> result
        ttl: Override TTL
    """
    cache_ttl = ttl or DashboardCacheConfig.DASHBOARD_TTL.get(
        dashboard_type,
        DashboardCacheConfig.DEFAULT_TTL
    )

    for endpoint_name, result in results.items():
        cache_key = generate_dashboard_cache_key(
            dashboard_type,
            endpoint_name,
            {}  # Empty filters for batch caching
        )
        multi_cache.set(cache_key, result, cache_ttl)

    print(f"[DashboardCache] Batch cached {len(results)} results for {dashboard_type}")