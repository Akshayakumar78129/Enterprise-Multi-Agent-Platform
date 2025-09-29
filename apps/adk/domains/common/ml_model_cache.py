"""
ML Model Caching System
Caches trained models based on filter combinations to avoid retraining
"""

import hashlib
import json
import pickle
import time
import threading
from typing import Any, Dict, Optional, Tuple
from pathlib import Path
import numpy as np


class MLModelCache:
    """Cache trained ML models based on filter combinations"""

    def __init__(self, cache_dir: Optional[Path] = None, ttl: int = 3600):
        """
        Initialize ML Model Cache

        Args:
            cache_dir: Directory to store cached models (uses memory if None)
            ttl: Time to live in seconds (default 1 hour)
        """
        self.cache_dir = cache_dir
        self.ttl = ttl
        self._memory_cache: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()

        # Create cache directory if specified
        if self.cache_dir:
            self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _generate_model_key(self, model_type: str, filters: Dict[str, Any], data_hash: Optional[str] = None) -> str:
        """
        Generate unique key for model based on type and filters

        Args:
            model_type: Type of ML model (e.g., 'churn', 'ltv', 'anomaly')
            filters: Filter dictionary including date ranges
            data_hash: Optional hash of training data

        Returns:
            Unique cache key for the model
        """
        # Normalize filters - especially important for date ranges
        normalized = {
            'model_type': model_type,
            'filters': {}
        }

        # Extract and normalize date filters (these affect training data)
        date_keys = ['dateFrom', 'dateTo', 'date_from', 'date_to', 'datefrom', 'dateto']
        for key in date_keys:
            if key in filters and filters[key]:
                normalized['filters'][key] = filters[key]

        # Include other relevant filters that affect training data
        relevant_keys = ['segment', 'segments', 'customer_segments', 'risk_levels', 'product_categories']
        for key in relevant_keys:
            if key in filters and filters[key]:
                if isinstance(filters[key], list):
                    normalized['filters'][key] = sorted(filters[key])
                else:
                    normalized['filters'][key] = filters[key]

        # Add data hash if provided
        if data_hash:
            normalized['data_hash'] = data_hash

        # Generate hash key
        key_string = json.dumps(normalized, sort_keys=True, default=str)
        return f"ml_model:{model_type}:{hashlib.sha256(key_string.encode()).hexdigest()}"

    def get_model(self, model_type: str, filters: Dict[str, Any], data_hash: Optional[str] = None) -> Optional[Tuple[Any, Any, Dict]]:
        """
        Get cached model if available

        Args:
            model_type: Type of ML model
            filters: Current filter settings
            data_hash: Optional hash of training data

        Returns:
            Tuple of (model, scaler, metadata) or None if not cached
        """
        key = self._generate_model_key(model_type, filters, data_hash)

        with self._lock:
            # Check memory cache first
            if key in self._memory_cache:
                entry = self._memory_cache[key]

                # Check if expired
                if time.time() - entry['timestamp'] < self.ttl:
                    print(f"[MLCache] Model cache HIT for {model_type} with filters: {self._get_filter_summary(filters)}")
                    return entry['model'], entry['scaler'], entry['metadata']
                else:
                    # Expired, remove from cache
                    del self._memory_cache[key]

            # Check disk cache if enabled
            if self.cache_dir:
                cache_file = self.cache_dir / f"{key}.pkl"
                if cache_file.exists():
                    try:
                        with open(cache_file, 'rb') as f:
                            entry = pickle.load(f)

                        # Check if expired
                        if time.time() - entry['timestamp'] < self.ttl:
                            # Load into memory cache
                            self._memory_cache[key] = entry
                            print(f"[MLCache] Model cache HIT (disk) for {model_type} with filters: {self._get_filter_summary(filters)}")
                            return entry['model'], entry['scaler'], entry['metadata']
                        else:
                            # Expired, remove from disk
                            cache_file.unlink()
                    except Exception as e:
                        print(f"[MLCache] Error loading cached model: {e}")
                        if cache_file.exists():
                            cache_file.unlink()

        print(f"[MLCache] Model cache MISS for {model_type} with filters: {self._get_filter_summary(filters)}")
        return None

    def set_model(self, model_type: str, filters: Dict[str, Any], model: Any, scaler: Any = None,
                  metadata: Dict[str, Any] = None, data_hash: Optional[str] = None) -> bool:
        """
        Cache a trained model

        Args:
            model_type: Type of ML model
            filters: Current filter settings
            model: Trained model object
            scaler: Optional scaler object
            metadata: Optional metadata (accuracy, training time, etc.)
            data_hash: Optional hash of training data

        Returns:
            True if successfully cached
        """
        key = self._generate_model_key(model_type, filters, data_hash)

        entry = {
            'model': model,
            'scaler': scaler,
            'metadata': metadata or {},
            'timestamp': time.time(),
            'filters': filters.copy()
        }

        with self._lock:
            # Store in memory cache
            self._memory_cache[key] = entry

            # Store on disk if enabled
            if self.cache_dir:
                cache_file = self.cache_dir / f"{key}.pkl"
                try:
                    with open(cache_file, 'wb') as f:
                        pickle.dump(entry, f)
                except Exception as e:
                    print(f"[MLCache] Error saving model to disk: {e}")
                    return False

        print(f"[MLCache] Cached model for {model_type} with filters: {self._get_filter_summary(filters)}")
        return True

    def invalidate(self, model_type: Optional[str] = None, filters: Optional[Dict[str, Any]] = None):
        """
        Invalidate cached models

        Args:
            model_type: If specified, only invalidate this model type
            filters: If specified, only invalidate models with these filters
        """
        with self._lock:
            if model_type and filters:
                # Invalidate specific model
                key = self._generate_model_key(model_type, filters)
                if key in self._memory_cache:
                    del self._memory_cache[key]
                if self.cache_dir:
                    cache_file = self.cache_dir / f"{key}.pkl"
                    if cache_file.exists():
                        cache_file.unlink()
                print(f"[MLCache] Invalidated model {model_type} with specific filters")

            elif model_type:
                # Invalidate all models of this type
                keys_to_remove = [k for k in self._memory_cache.keys() if k.startswith(f"ml_model:{model_type}:")]
                for key in keys_to_remove:
                    del self._memory_cache[key]

                if self.cache_dir:
                    for cache_file in self.cache_dir.glob(f"ml_model:{model_type}:*.pkl"):
                        cache_file.unlink()

                print(f"[MLCache] Invalidated all {model_type} models")

            else:
                # Clear all cache
                self._memory_cache.clear()
                if self.cache_dir:
                    for cache_file in self.cache_dir.glob("ml_model:*.pkl"):
                        cache_file.unlink()
                print("[MLCache] Cleared all model cache")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            memory_models = len(self._memory_cache)
            disk_models = 0
            if self.cache_dir:
                disk_models = len(list(self.cache_dir.glob("ml_model:*.pkl")))

            model_types = {}
            for key in self._memory_cache.keys():
                model_type = key.split(':')[1] if ':' in key else 'unknown'
                model_types[model_type] = model_types.get(model_type, 0) + 1

            return {
                'memory_models': memory_models,
                'disk_models': disk_models,
                'model_types': model_types,
                'ttl': self.ttl
            }

    def _get_filter_summary(self, filters: Dict[str, Any]) -> str:
        """Get a human-readable summary of filters for logging"""
        summary = []

        # Date range
        date_from = filters.get('dateFrom') or filters.get('date_from') or filters.get('datefrom')
        date_to = filters.get('dateTo') or filters.get('date_to') or filters.get('dateto')
        if date_from and date_to:
            summary.append(f"dates:{date_from} to {date_to}")

        # Segments
        segments = filters.get('segments') or filters.get('segment')
        if segments:
            if isinstance(segments, list):
                summary.append(f"segments:{','.join(segments[:2])}")
            else:
                summary.append(f"segment:{segments}")

        return ' | '.join(summary) if summary else 'no filters'


# Global ML model cache instance
ml_model_cache = MLModelCache(ttl=3600)  # 1 hour TTL


def hash_training_data(data: Any) -> str:
    """
    Generate a hash of training data to detect when retraining is needed

    Args:
        data: Training data (DataFrame, array, etc.)

    Returns:
        Hash string of the data
    """
    try:
        if hasattr(data, 'values'):  # DataFrame
            data_str = str(data.shape) + str(data.values.sum())
        elif isinstance(data, np.ndarray):
            data_str = str(data.shape) + str(data.sum())
        elif isinstance(data, (list, tuple)):
            data_str = str(len(data)) + str(sum(hash(str(x)) for x in data[:100]))
        else:
            data_str = str(data)

        return hashlib.md5(data_str.encode()).hexdigest()
    except:
        return "unknown"