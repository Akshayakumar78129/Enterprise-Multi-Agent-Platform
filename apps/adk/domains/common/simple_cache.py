"""
Simplified caching implementation to avoid circular imports.
This is a standalone cache module for dashboard endpoints.
"""

import json
import hashlib
import functools
import time
import threading
from typing import Any, Dict, Optional, Callable, List
from datetime import datetime
import asyncio
import pickle
from pathlib import Path


class SimpleMemoryCache:
    """Simple in-memory LRU cache implementation"""

    # CACHE VERSION - increment to invalidate all caches
    CACHE_VERSION = "v18_20251104_1920"  # Revenue Forecast: named parameters dict

    def __init__(self, max_size: int = 100 * 1024 * 1024, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        with self._lock:
            if key not in self._cache:
                return None

            entry = self._cache[key]

            # Check expiration
            if entry['expires_at'] and time.time() > entry['expires_at']:
                del self._cache[key]
                return None

            return entry['value']

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        with self._lock:
            ttl = ttl or self.default_ttl
            expires_at = time.time() + ttl if ttl > 0 else None

            # Store in cache
            self._cache[key] = {
                'value': value,
                'expires_at': expires_at,
                'created_at': time.time()
            }

            # Simple eviction - remove oldest entries if cache too large
            if len(self._cache) > 1000:  # Max 1000 entries
                # Remove oldest 100 entries
                sorted_keys = sorted(
                    self._cache.keys(),
                    key=lambda k: self._cache[k]['created_at']
                )
                for key_to_remove in sorted_keys[:100]:
                    del self._cache[key_to_remove]

            return True

    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> bool:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()
            return True

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            return {
                'entries': len(self._cache),
                'max_entries': 1000
            }


# Global cache instance
simple_cache = SimpleMemoryCache()


def generate_cache_key(dashboard_type: str, endpoint: str, filters: Dict[str, Any]) -> str:
    """Generate a unique cache key"""
    # Normalize filters
    normalized_filters = {}
    for key, value in filters.items():
        if value is not None:
            if isinstance(value, list):
                normalized_filters[key] = sorted(value)
            else:
                normalized_filters[key] = value

    key_data = {
        'version': SimpleMemoryCache.CACHE_VERSION,
        'dashboard': dashboard_type,
        'endpoint': endpoint,
        'filters': normalized_filters
    }

    key_string = json.dumps(key_data, sort_keys=True, default=str)
    return f"dash:{dashboard_type}:{endpoint}:{hashlib.md5(key_string.encode()).hexdigest()}"


def cache_dashboard_endpoint(dashboard_type: str = 'default', ttl: Optional[int] = None):
    """
    Simplified decorator for caching dashboard endpoints.

    Args:
        dashboard_type: Type of dashboard
        ttl: Time to live in seconds (default 300)
    """
    def decorator(func: Callable) -> Callable:
        is_async = asyncio.iscoroutinefunction(func)
        cache_ttl = ttl or 300  # Default 5 minutes

        if is_async:
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Extract filters
                filters = {}
                if args and isinstance(args[0], dict):
                    filters = args[0]
                elif 'filters' in kwargs:
                    filters = kwargs['filters']
                elif len(args) > 1 and isinstance(args[1], dict):
                    filters = args[1]

                # Generate cache key
                cache_key = generate_cache_key(dashboard_type, func.__name__, filters)

                # Try cache
                cached_result = simple_cache.get(cache_key)
                if cached_result is not None:
                    print(f"[Cache] Hit for {dashboard_type}.{func.__name__}")
                    return cached_result

                # Execute function
                print(f"[Cache] Miss for {dashboard_type}.{func.__name__} - computing...")
                result = await func(*args, **kwargs)

                # Cache result
                if result is not None:
                    simple_cache.set(cache_key, result, cache_ttl)

                return result

            return async_wrapper
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                # Extract filters
                filters = {}
                if args and isinstance(args[0], dict):
                    filters = args[0]
                elif 'filters' in kwargs:
                    filters = kwargs['filters']
                elif len(args) > 1 and isinstance(args[1], dict):
                    filters = args[1]

                # Generate cache key
                cache_key = generate_cache_key(dashboard_type, func.__name__, filters)

                # Try cache
                cached_result = simple_cache.get(cache_key)
                if cached_result is not None:
                    print(f"[Cache] Hit for {dashboard_type}.{func.__name__}")
                    return cached_result

                # Execute function
                print(f"[Cache] Miss for {dashboard_type}.{func.__name__} - computing...")
                result = func(*args, **kwargs)

                # Cache result
                if result is not None:
                    simple_cache.set(cache_key, result, cache_ttl)

                return result

            return sync_wrapper

    return decorator


class SimpleCacheManager:
    """Simple cache manager"""

    def __init__(self):
        self.enabled = True

    def enable(self):
        """Enable caching"""
        self.enabled = True
        print("[SimpleCache] Caching enabled")

    def disable(self):
        """Disable caching"""
        self.enabled = False
        print("[SimpleCache] Caching disabled")

    def clear(self):
        """Clear all caches"""
        simple_cache.clear()
        print("[SimpleCache] Cache cleared")

    def get_stats(self):
        """Get cache statistics"""
        return simple_cache.get_stats()


# Global manager
dashboard_cache_manager = SimpleCacheManager()