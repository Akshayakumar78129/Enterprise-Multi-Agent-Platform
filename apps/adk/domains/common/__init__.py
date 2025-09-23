"""Common utilities and services for all domain modules"""

from .simple_cache import (
    cache_dashboard_endpoint,
    dashboard_cache_manager
)

__all__ = [
    'cache_dashboard_endpoint',
    'dashboard_cache_manager'
]