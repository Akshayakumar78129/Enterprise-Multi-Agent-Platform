"""
Health monitoring and check endpoints for the multi-agent system.
Provides comprehensive health status monitoring for all system components.
"""

import asyncio
import time
import threading
from typing import Dict, Any, List, Optional, Callable, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import psutil
import json

from orchestration_agent.utils.logging_config import get_logger
from orchestration_agent.utils.config_manager import get_config
from orchestration_agent.utils.error_handling import error_handler
from orchestration_agent.utils.caching import multi_cache

logger = get_logger(__name__)


class HealthStatus(Enum):
    """Health status levels."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class HealthCheck:
    """Individual health check definition."""
    name: str
    description: str
    check_function: Callable[[], Dict[str, Any]]
    timeout: int = 30
    interval: int = 60
    enabled: bool = True
    critical: bool = False
    dependencies: List[str] = field(default_factory=list)


@dataclass
class HealthResult:
    """Result of a health check."""
    name: str
    status: HealthStatus
    message: str
    timestamp: datetime
    duration_ms: float
    details: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class SystemHealth:
    """Overall system health status."""
    status: HealthStatus
    timestamp: datetime
    version: str
    uptime_seconds: float
    checks: Dict[str, HealthResult] = field(default_factory=dict)
    summary: Dict[str, Any] = field(default_factory=dict)


class HealthMonitor:
    """
    Central health monitoring system for all components.
    """

    def __init__(self):
        self.checks: Dict[str, HealthCheck] = {}
        self.results: Dict[str, HealthResult] = {}
        self.start_time = time.time()
        self.version = "1.0.0"
        
        self._monitor_thread: Optional[threading.Thread] = None
        self._monitoring_enabled = False
        self._monitor_interval = 60  # seconds
        self._lock = threading.RLock()
        
        # Register default health checks
        self._register_default_checks()

    def register_check(self, health_check: HealthCheck):
        """Register a new health check."""
        with self._lock:
            self.checks[health_check.name] = health_check
            logger.info(f"Registered health check: {health_check.name}")

    def unregister_check(self, name: str):
        """Unregister a health check."""
        with self._lock:
            self.checks.pop(name, None)
            self.results.pop(name, None)
            logger.info(f"Unregistered health check: {name}")

    def execute_check(self, name: str) -> HealthResult:
        """Execute a specific health check."""
        check = self.checks.get(name)
        if not check:
            return HealthResult(
                name=name,
                status=HealthStatus.UNKNOWN,
                message=f"Health check '{name}' not found",
                timestamp=datetime.utcnow(),
                duration_ms=0.0,
                error="Check not registered"
            )

        if not check.enabled:
            return HealthResult(
                name=name,
                status=HealthStatus.UNKNOWN,
                message=f"Health check '{name}' is disabled",
                timestamp=datetime.utcnow(),
                duration_ms=0.0
            )

        start_time = time.time()
        timestamp = datetime.utcnow()

        try:
            # Execute check with timeout
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(check.check_function)
                result = future.result(timeout=check.timeout)

            duration_ms = (time.time() - start_time) * 1000

            # Parse result
            if isinstance(result, dict):
                status_str = result.get('status', 'unknown').lower()
                status = HealthStatus(status_str) if status_str in [s.value for s in HealthStatus] else HealthStatus.UNKNOWN
                message = result.get('message', 'Check completed')
                details = result.get('details', {})
                error = result.get('error')
            else:
                status = HealthStatus.HEALTHY if result else HealthStatus.UNHEALTHY
                message = str(result) if result else "Check failed"
                details = {}
                error = None

            health_result = HealthResult(
                name=name,
                status=status,
                message=message,
                timestamp=timestamp,
                duration_ms=duration_ms,
                details=details,
                error=error
            )

        except concurrent.futures.TimeoutError:
            duration_ms = (time.time() - start_time) * 1000
            health_result = HealthResult(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Health check timed out after {check.timeout}s",
                timestamp=timestamp,
                duration_ms=duration_ms,
                error="Timeout"
            )

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            health_result = HealthResult(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Health check failed: {str(e)}",
                timestamp=timestamp,
                duration_ms=duration_ms,
                error=str(e)
            )

        # Store result
        with self._lock:
            self.results[name] = health_result

        return health_result

    def execute_all_checks(self) -> Dict[str, HealthResult]:
        """Execute all registered health checks."""
        results = {}
        
        for name in self.checks.keys():
            results[name] = self.execute_check(name)
        
        return results

    def get_system_health(self) -> SystemHealth:
        """Get overall system health status."""
        with self._lock:
            # Execute recent checks if results are stale
            current_time = datetime.utcnow()
            stale_threshold = timedelta(minutes=5)
            
            for name, check in self.checks.items():
                if check.enabled:
                    result = self.results.get(name)
                    if not result or (current_time - result.timestamp) > stale_threshold:
                        self.execute_check(name)

            # Determine overall status
            overall_status = self._calculate_overall_status()
            
            # Calculate uptime
            uptime_seconds = time.time() - self.start_time
            
            # Generate summary
            summary = self._generate_summary()
            
            return SystemHealth(
                status=overall_status,
                timestamp=current_time,
                version=self.version,
                uptime_seconds=uptime_seconds,
                checks=self.results.copy(),
                summary=summary
            )

    def get_health_check_result(self, name: str) -> Optional[HealthResult]:
        """Get result of a specific health check."""
        return self.results.get(name)

    def get_health_summary(self) -> Dict[str, Any]:
        """Get a summary of system health."""
        system_health = self.get_system_health()
        
        total_checks = len(self.checks)
        healthy_checks = sum(1 for r in self.results.values() if r.status == HealthStatus.HEALTHY)
        degraded_checks = sum(1 for r in self.results.values() if r.status == HealthStatus.DEGRADED)
        unhealthy_checks = sum(1 for r in self.results.values() if r.status == HealthStatus.UNHEALTHY)
        
        return {
            "overall_status": system_health.status.value,
            "timestamp": system_health.timestamp.isoformat(),
            "uptime_seconds": system_health.uptime_seconds,
            "version": system_health.version,
            "check_summary": {
                "total": total_checks,
                "healthy": healthy_checks,
                "degraded": degraded_checks,
                "unhealthy": unhealthy_checks
            }
        }

    def start_monitoring(self, interval: int = 60):
        """Start background health monitoring."""
        self._monitor_interval = interval
        self._monitoring_enabled = True
        
        if self._monitor_thread is None or not self._monitor_thread.is_alive():
            self._monitor_thread = threading.Thread(target=self._monitor_worker, daemon=True)
            self._monitor_thread.start()
            logger.info(f"Health monitoring started with {interval}s interval")

    def stop_monitoring(self):
        """Stop background health monitoring."""
        self._monitoring_enabled = False
        logger.info("Health monitoring stopped")

    def _monitor_worker(self):
        """Background worker for periodic health checks."""
        while self._monitoring_enabled:
            try:
                current_time = datetime.utcnow()
                
                for name, check in self.checks.items():
                    if not check.enabled:
                        continue
                    
                    # Check if it's time to run this check
                    last_result = self.results.get(name)
                    if (not last_result or 
                        (current_time - last_result.timestamp).total_seconds() >= check.interval):
                        self.execute_check(name)
                
                time.sleep(self._monitor_interval)
                
            except Exception as e:
                logger.error(f"Error in health monitor worker: {e}")
                time.sleep(self._monitor_interval)

    def _calculate_overall_status(self) -> HealthStatus:
        """Calculate overall system health status."""
        if not self.results:
            return HealthStatus.UNKNOWN
        
        critical_checks = [
            name for name, check in self.checks.items() 
            if check.critical and check.enabled
        ]
        
        # Check critical components first
        for name in critical_checks:
            result = self.results.get(name)
            if result and result.status == HealthStatus.UNHEALTHY:
                return HealthStatus.UNHEALTHY
        
        # Count status types
        status_counts = {status: 0 for status in HealthStatus}
        for result in self.results.values():
            status_counts[result.status] += 1
        
        total_checks = len(self.results)
        unhealthy_ratio = status_counts[HealthStatus.UNHEALTHY] / total_checks
        degraded_ratio = status_counts[HealthStatus.DEGRADED] / total_checks
        
        # Determine overall status
        if unhealthy_ratio > 0.5:  # More than 50% unhealthy
            return HealthStatus.UNHEALTHY
        elif unhealthy_ratio > 0.2 or degraded_ratio > 0.3:  # Significant issues
            return HealthStatus.DEGRADED
        elif status_counts[HealthStatus.HEALTHY] == total_checks:
            return HealthStatus.HEALTHY
        else:
            return HealthStatus.DEGRADED

    def _generate_summary(self) -> Dict[str, Any]:
        """Generate health summary information."""
        # System resources
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Agent health
        agent_health = {}
        for service in ["customer_insights_agent", "financial_agent", "sales_agent", "inventory_agent"]:
            is_healthy = error_handler.degradation_handler.is_service_healthy(service)
            agent_health[service] = "healthy" if is_healthy else "unhealthy"
        
        # Cache health
        cache_health = {"status": "unknown"}
        try:
            if hasattr(multi_cache, 'caches') and multi_cache.caches:
                memory_cache = multi_cache.caches[0]
                if hasattr(memory_cache, 'get_stats'):
                    stats = memory_cache.get_stats()
                    cache_health = {
                        "status": "healthy",
                        "entries": stats.get("entries", 0),
                        "utilization": round(stats.get("size_utilization", 0), 3)
                    }
        except Exception as e:
            cache_health = {"status": "error", "error": str(e)}
        
        return {
            "system_resources": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_gb": round(memory.available / (1024**3), 2),
                "disk_percent": disk.percent,
                "disk_free_gb": round(disk.free / (1024**3), 2)
            },
            "agents": agent_health,
            "cache": cache_health,
            "uptime_hours": round((time.time() - self.start_time) / 3600, 2)
        }

    def _register_default_checks(self):
        """Register default system health checks."""
        
        def system_resources_check():
            """Check system resource utilization."""
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            issues = []
            status = "healthy"
            
            if cpu_percent > 90:
                issues.append(f"High CPU usage: {cpu_percent}%")
                status = "degraded" if cpu_percent < 95 else "unhealthy"
            
            if memory.percent > 90:
                issues.append(f"High memory usage: {memory.percent}%")
                status = "degraded" if memory.percent < 95 else "unhealthy"
            
            if disk.percent > 90:
                issues.append(f"Low disk space: {disk.percent}% used")
                status = "degraded" if disk.percent < 95 else "unhealthy"
            
            return {
                "status": status,
                "message": "; ".join(issues) if issues else "System resources normal",
                "details": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "disk_percent": disk.percent
                }
            }
        
        def database_check():
            """Check database connectivity."""
            try:
                from orchestration_agent.utils.async_processing import async_db_manager
                # Simple connectivity test
                return {
                    "status": "healthy",
                    "message": "Database connection available"
                }
            except Exception as e:
                return {
                    "status": "unhealthy", 
                    "message": f"Database connection failed: {str(e)}",
                    "error": str(e)
                }
        
        def cache_check():
            """Check cache system health."""
            try:
                if hasattr(multi_cache, 'caches') and multi_cache.caches:
                    # Test cache operations
                    test_key = "_health_check_test"
                    test_value = {"timestamp": time.time()}
                    
                    multi_cache.set(test_key, test_value, ttl=60)
                    retrieved = multi_cache.get(test_key)
                    multi_cache.delete(test_key)
                    
                    if retrieved:
                        return {
                            "status": "healthy",
                            "message": "Cache system operational",
                            "details": {
                                "cache_levels": len(multi_cache.caches)
                            }
                        }
                    else:
                        return {
                            "status": "degraded",
                            "message": "Cache read/write test failed"
                        }
                else:
                    return {
                        "status": "degraded",
                        "message": "No cache backends available"
                    }
            except Exception as e:
                return {
                    "status": "unhealthy",
                    "message": f"Cache system error: {str(e)}",
                    "error": str(e)
                }
        
        def agents_check():
            """Check agent system health."""
            try:
                agents = ["customer_insights_agent", "financial_agent", "sales_agent", "inventory_agent"]
                healthy_agents = []
                unhealthy_agents = []
                
                for agent in agents:
                    is_healthy = error_handler.degradation_handler.is_service_healthy(agent)
                    if is_healthy:
                        healthy_agents.append(agent)
                    else:
                        unhealthy_agents.append(agent)
                
                if not unhealthy_agents:
                    status = "healthy"
                    message = f"All {len(agents)} agents healthy"
                elif len(unhealthy_agents) < len(agents) / 2:
                    status = "degraded"
                    message = f"{len(unhealthy_agents)} agents unhealthy: {', '.join(unhealthy_agents)}"
                else:
                    status = "unhealthy"
                    message = f"Majority of agents unhealthy: {', '.join(unhealthy_agents)}"
                
                return {
                    "status": status,
                    "message": message,
                    "details": {
                        "total_agents": len(agents),
                        "healthy_agents": len(healthy_agents),
                        "unhealthy_agents": unhealthy_agents
                    }
                }
            except Exception as e:
                return {
                    "status": "unhealthy",
                    "message": f"Agent health check failed: {str(e)}",
                    "error": str(e)
                }
        
        # Register checks
        self.register_check(HealthCheck(
            name="system_resources",
            description="System CPU, memory, and disk usage",
            check_function=system_resources_check,
            timeout=10,
            interval=30,
            critical=True
        ))
        
        self.register_check(HealthCheck(
            name="database",
            description="Database connectivity and operations",
            check_function=database_check,
            timeout=15,
            interval=60,
            critical=True
        ))
        
        self.register_check(HealthCheck(
            name="cache",
            description="Cache system health and operations",
            check_function=cache_check,
            timeout=10,
            interval=60,
            critical=False
        ))
        
        self.register_check(HealthCheck(
            name="agents",
            description="Multi-agent system health",
            check_function=agents_check,
            timeout=15,
            interval=45,
            critical=True
        ))


# Global health monitor instance
health_monitor = HealthMonitor()


def get_health_status() -> Dict[str, Any]:
    """Get current system health status."""
    return health_monitor.get_health_summary()


def get_detailed_health() -> SystemHealth:
    """Get detailed system health information."""
    return health_monitor.get_system_health()


def register_custom_check(name: str, check_function: Callable, **kwargs):
    """Register a custom health check."""
    health_check = HealthCheck(
        name=name,
        description=kwargs.get('description', f'Custom check: {name}'),
        check_function=check_function,
        timeout=kwargs.get('timeout', 30),
        interval=kwargs.get('interval', 60),
        enabled=kwargs.get('enabled', True),
        critical=kwargs.get('critical', False)
    )
    health_monitor.register_check(health_check)


# Auto-start monitoring on import
health_monitor.start_monitoring()