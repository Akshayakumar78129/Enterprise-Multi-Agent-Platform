"""
Multi-level caching framework for the multi-agent system.
Provides memory cache, disk cache, and Redis distributed cache.
"""

import json
import hashlib
import pickle
import logging
import time
import threading
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Union, Callable, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
import functools
import os

logger = logging.getLogger(__name__)


@dataclass
class CacheConfig:
    """Configuration for cache settings."""
    default_ttl: int = 3600  # 1 hour
    max_memory_size: int = 100 * 1024 * 1024  # 100MB
    disk_cache_dir: str = "./cache"
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    enable_memory_cache: bool = True
    enable_disk_cache: bool = True
    enable_redis_cache: bool = False


class CacheBackend(ABC):
    """Abstract base class for cache backends."""

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete value from cache."""
        pass

    @abstractmethod
    def clear(self) -> bool:
        """Clear all cache entries."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        pass


class MemoryCache(CacheBackend):
    """In-memory cache implementation with LRU eviction."""

    def __init__(self, max_size: int = 100 * 1024 * 1024, default_ttl: int = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_times: Dict[str, float] = {}
        self._current_size = 0
        self._lock = threading.RLock()

    def get(self, key: str) -> Optional[Any]:
        """Get value from memory cache."""
        with self._lock:
            if key not in self._cache:
                return None

            entry = self._cache[key]
            
            # Check expiration
            if entry['expires_at'] and time.time() > entry['expires_at']:
                self.delete(key)
                return None

            # Update access time for LRU
            self._access_times[key] = time.time()
            return entry['value']

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in memory cache."""
        with self._lock:
            ttl = ttl or self.default_ttl
            expires_at = time.time() + ttl if ttl > 0 else None

            # Calculate size of the new entry
            entry_size = self._calculate_size(value)
            
            # Remove old entry if exists
            if key in self._cache:
                old_size = self._cache[key]['size']
                self._current_size -= old_size

            # Evict entries if necessary
            while self._current_size + entry_size > self.max_size and self._cache:
                self._evict_lru()

            # Add new entry
            self._cache[key] = {
                'value': value,
                'expires_at': expires_at,
                'size': entry_size,
                'created_at': time.time()
            }
            self._access_times[key] = time.time()
            self._current_size += entry_size
            
            logger.debug(f"Cached entry {key} (size: {entry_size} bytes)")
            return True

    def delete(self, key: str) -> bool:
        """Delete value from memory cache."""
        with self._lock:
            if key in self._cache:
                entry_size = self._cache[key]['size']
                del self._cache[key]
                del self._access_times[key]
                self._current_size -= entry_size
                return True
            return False

    def clear(self) -> bool:
        """Clear all cache entries."""
        with self._lock:
            self._cache.clear()
            self._access_times.clear()
            self._current_size = 0
            return True

    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        return self.get(key) is not None

    def _calculate_size(self, value: Any) -> int:
        """Calculate the size of a value in bytes."""
        try:
            return len(pickle.dumps(value))
        except Exception:
            return len(str(value).encode('utf-8'))

    def _evict_lru(self):
        """Evict least recently used entry."""
        if not self._access_times:
            return
            
        lru_key = min(self._access_times, key=self._access_times.get)
        self.delete(lru_key)
        logger.debug(f"Evicted LRU entry: {lru_key}")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            return {
                'entries': len(self._cache),
                'current_size': self._current_size,
                'max_size': self.max_size,
                'size_utilization': self._current_size / self.max_size if self.max_size > 0 else 0
            }


class DiskCache(CacheBackend):
    """Disk-based cache implementation."""

    def __init__(self, cache_dir: str = "./cache", default_ttl: int = 3600):
        self.cache_dir = Path(cache_dir)
        self.default_ttl = default_ttl
        self._lock = threading.RLock()
        
        # Create cache directory if it doesn't exist
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def get(self, key: str) -> Optional[Any]:
        """Get value from disk cache."""
        with self._lock:
            cache_file = self._get_cache_file(key)
            
            if not cache_file.exists():
                return None

            try:
                with open(cache_file, 'rb') as f:
                    entry = pickle.load(f)
                
                # Check expiration
                if entry['expires_at'] and time.time() > entry['expires_at']:
                    self.delete(key)
                    return None

                return entry['value']
            except Exception as e:
                logger.warning(f"Error reading cache file {cache_file}: {e}")
                return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in disk cache."""
        with self._lock:
            ttl = ttl or self.default_ttl
            expires_at = time.time() + ttl if ttl > 0 else None

            entry = {
                'value': value,
                'expires_at': expires_at,
                'created_at': time.time()
            }

            cache_file = self._get_cache_file(key)
            
            try:
                with open(cache_file, 'wb') as f:
                    pickle.dump(entry, f)
                
                logger.debug(f"Cached entry to disk: {key}")
                return True
            except Exception as e:
                logger.error(f"Error writing cache file {cache_file}: {e}")
                return False

    def delete(self, key: str) -> bool:
        """Delete value from disk cache."""
        with self._lock:
            cache_file = self._get_cache_file(key)
            
            if cache_file.exists():
                try:
                    cache_file.unlink()
                    return True
                except Exception as e:
                    logger.error(f"Error deleting cache file {cache_file}: {e}")
                    return False
            return False

    def clear(self) -> bool:
        """Clear all cache entries."""
        with self._lock:
            try:
                for cache_file in self.cache_dir.glob("*.cache"):
                    cache_file.unlink()
                return True
            except Exception as e:
                logger.error(f"Error clearing disk cache: {e}")
                return False

    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        return self.get(key) is not None

    def _get_cache_file(self, key: str) -> Path:
        """Get cache file path for a key."""
        # Create a safe filename from the key
        safe_key = hashlib.md5(key.encode()).hexdigest()
        return self.cache_dir / f"{safe_key}.cache"

    def cleanup_expired(self):
        """Remove expired cache files."""
        with self._lock:
            current_time = time.time()
            for cache_file in self.cache_dir.glob("*.cache"):
                try:
                    with open(cache_file, 'rb') as f:
                        entry = pickle.load(f)
                    
                    if entry['expires_at'] and current_time > entry['expires_at']:
                        cache_file.unlink()
                        logger.debug(f"Cleaned up expired cache file: {cache_file}")
                except Exception as e:
                    logger.warning(f"Error checking cache file {cache_file}: {e}")


class RedisCache(CacheBackend):
    """Redis-based distributed cache implementation."""

    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0, default_ttl: int = 3600):
        self.host = host
        self.port = port
        self.db = db
        self.default_ttl = default_ttl
        self._redis = None
        self._connection_attempts = 0
        self._max_connection_attempts = 3

    def _get_redis(self):
        """Get Redis connection with retry logic."""
        if self._redis is None and self._connection_attempts < self._max_connection_attempts:
            try:
                import redis
                self._redis = redis.Redis(host=self.host, port=self.port, db=self.db, decode_responses=False)
                # Test connection
                self._redis.ping()
                logger.info(f"Connected to Redis at {self.host}:{self.port}")
            except ImportError:
                logger.warning("Redis not available - install redis-py to enable Redis caching")
                self._connection_attempts = self._max_connection_attempts
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}")
                self._connection_attempts += 1
                self._redis = None
        
        return self._redis

    def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache."""
        redis_client = self._get_redis()
        if not redis_client:
            return None

        try:
            data = redis_client.get(key)
            if data:
                return pickle.loads(data)
            return None
        except Exception as e:
            logger.warning(f"Error getting from Redis cache: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in Redis cache."""
        redis_client = self._get_redis()
        if not redis_client:
            return False

        try:
            ttl = ttl or self.default_ttl
            data = pickle.dumps(value)
            
            if ttl > 0:
                return bool(redis_client.setex(key, ttl, data))
            else:
                return bool(redis_client.set(key, data))
        except Exception as e:
            logger.warning(f"Error setting Redis cache: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete value from Redis cache."""
        redis_client = self._get_redis()
        if not redis_client:
            return False

        try:
            return bool(redis_client.delete(key))
        except Exception as e:
            logger.warning(f"Error deleting from Redis cache: {e}")
            return False

    def clear(self) -> bool:
        """Clear all cache entries."""
        redis_client = self._get_redis()
        if not redis_client:
            return False

        try:
            return bool(redis_client.flushdb())
        except Exception as e:
            logger.warning(f"Error clearing Redis cache: {e}")
            return False

    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        redis_client = self._get_redis()
        if not redis_client:
            return False

        try:
            return bool(redis_client.exists(key))
        except Exception as e:
            logger.warning(f"Error checking Redis cache: {e}")
            return False


class MultiLevelCache:
    """
    Multi-level cache that combines memory, disk, and Redis caches.
    Provides automatic fallback and promotion between cache levels.
    """

    def __init__(self, config: Optional[CacheConfig] = None):
        self.config = config or CacheConfig()
        self.caches: List[CacheBackend] = []
        
        # Initialize cache backends based on configuration
        if self.config.enable_memory_cache:
            self.caches.append(MemoryCache(
                max_size=self.config.max_memory_size,
                default_ttl=self.config.default_ttl
            ))
            logger.info("Memory cache enabled")

        if self.config.enable_disk_cache:
            self.caches.append(DiskCache(
                cache_dir=self.config.disk_cache_dir,
                default_ttl=self.config.default_ttl
            ))
            logger.info("Disk cache enabled")

        if self.config.enable_redis_cache:
            self.caches.append(RedisCache(
                host=self.config.redis_host,
                port=self.config.redis_port,
                db=self.config.redis_db,
                default_ttl=self.config.default_ttl
            ))
            logger.info("Redis cache enabled")

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache with promotion to faster levels."""
        for i, cache in enumerate(self.caches):
            value = cache.get(key)
            if value is not None:
                # Promote to faster cache levels
                for j in range(i):
                    self.caches[j].set(key, value)
                return value
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in all cache levels."""
        success = True
        for cache in self.caches:
            if not cache.set(key, value, ttl):
                success = False
        return success

    def delete(self, key: str) -> bool:
        """Delete value from all cache levels."""
        success = True
        for cache in self.caches:
            if not cache.delete(key):
                success = False
        return success

    def clear(self) -> bool:
        """Clear all cache levels."""
        success = True
        for cache in self.caches:
            if not cache.clear():
                success = False
        return success

    def exists(self, key: str) -> bool:
        """Check if key exists in any cache level."""
        return any(cache.exists(key) for cache in self.caches)


# Global cache instance
cache_config = CacheConfig()
multi_cache = MultiLevelCache(cache_config)


def cache_result(key_generator: Optional[Callable] = None, ttl: Optional[int] = None, cache_instance: Optional[MultiLevelCache] = None):
    """
    Decorator for caching function results.
    
    Args:
        key_generator: Function to generate cache key from arguments
        ttl: Time to live for cached result
        cache_instance: Cache instance to use (defaults to global cache)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            cache = cache_instance or multi_cache
            
            # Generate cache key
            if key_generator:
                cache_key = key_generator(*args, **kwargs)
            else:
                cache_key = _generate_default_key(func.__name__, args, kwargs)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__}: {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            logger.debug(f"Cached result for {func.__name__}: {cache_key}")
            
            return result
        return wrapper
    return decorator


def _generate_default_key(func_name: str, args: tuple, kwargs: dict) -> str:
    """Generate a default cache key from function name and arguments."""
    key_data = {
        'function': func_name,
        'args': args,
        'kwargs': sorted(kwargs.items())
    }
    key_string = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(key_string.encode()).hexdigest()


def cache_agent_result(agent_name: str, ttl: int = 3600):
    """
    Decorator for caching agent results.
    
    Args:
        agent_name: Name of the agent
        ttl: Time to live for cached result
    """
    def key_generator(*args, **kwargs):
        return f"agent:{agent_name}:{_generate_default_key('execute', args, kwargs)}"
    
    return cache_result(key_generator=key_generator, ttl=ttl)


def cache_tool_result(tool_name: str, ttl: int = 1800):
    """
    Decorator for caching tool results.
    
    Args:
        tool_name: Name of the tool
        ttl: Time to live for cached result
    """
    def key_generator(*args, **kwargs):
        return f"tool:{tool_name}:{_generate_default_key('execute', args, kwargs)}"
    
    return cache_result(key_generator=key_generator, ttl=ttl)


def invalidate_cache_pattern(pattern: str):
    """
    Invalidate cache entries matching a pattern.
    
    Args:
        pattern: Pattern to match cache keys (supports wildcards)
    """
    # This would require Redis SCAN for pattern matching
    # For now, we'll just clear the entire cache
    multi_cache.clear()
    logger.info(f"Invalidated cache entries matching pattern: {pattern}")