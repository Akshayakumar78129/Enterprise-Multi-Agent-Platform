"""
Comprehensive error handling and resilience utilities for the multi-agent system.
Provides circuit breakers, retry logic, and graceful degradation patterns.
"""

import time
import logging
import functools
from typing import Any, Callable, Dict, Optional, Type, Union, List
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import asyncio
import threading
from collections import defaultdict

logger = logging.getLogger(__name__)


class CircuitBreakerState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""
    failure_threshold: int = 5
    recovery_timeout: int = 60
    expected_exception: Type[Exception] = Exception
    name: str = "default"


class CircuitBreakerError(Exception):
    """Exception raised when circuit breaker is open."""
    pass


class CircuitBreaker:
    """
    Circuit breaker implementation for fault tolerance.
    Prevents cascading failures by temporarily blocking calls to failing services.
    """

    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED
        self._lock = threading.Lock()

    def __call__(self, func: Callable) -> Callable:
        """Decorator to wrap functions with circuit breaker."""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return self._call(func, *args, **kwargs)
        return wrapper

    def _call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection."""
        with self._lock:
            if self.state == CircuitBreakerState.OPEN:
                if self._should_attempt_reset():
                    self.state = CircuitBreakerState.HALF_OPEN
                    logger.info(f"Circuit breaker {self.config.name} moving to HALF_OPEN")
                else:
                    raise CircuitBreakerError(f"Circuit breaker {self.config.name} is OPEN")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.config.expected_exception as e:
            self._on_failure()
            raise e

    def _should_attempt_reset(self) -> bool:
        """Check if circuit breaker should attempt reset."""
        return (
            self.last_failure_time and
            time.time() - self.last_failure_time >= self.config.recovery_timeout
        )

    def _on_success(self):
        """Handle successful call."""
        with self._lock:
            self.failure_count = 0
            self.state = CircuitBreakerState.CLOSED
            logger.debug(f"Circuit breaker {self.config.name} reset to CLOSED")

    def _on_failure(self):
        """Handle failed call."""
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.config.failure_threshold:
                self.state = CircuitBreakerState.OPEN
                logger.warning(f"Circuit breaker {self.config.name} opened after {self.failure_count} failures")


@dataclass
class RetryConfig:
    """Configuration for retry logic."""
    max_attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_exceptions: tuple = (Exception,)


class RetryError(Exception):
    """Exception raised when all retry attempts are exhausted."""
    pass


def retry_with_backoff(config: Optional[RetryConfig] = None):
    """
    Decorator for retry logic with exponential backoff.
    
    Args:
        config: Retry configuration. Uses defaults if None.
    """
    if config is None:
        config = RetryConfig()

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(config.max_attempts):
                try:
                    return func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt == config.max_attempts - 1:
                        logger.error(f"Function {func.__name__} failed after {config.max_attempts} attempts")
                        raise RetryError(f"Max retry attempts exceeded") from e
                    
                    delay = min(
                        config.base_delay * (config.exponential_base ** attempt),
                        config.max_delay
                    )
                    
                    if config.jitter:
                        import random
                        delay *= (0.5 + random.random() * 0.5)
                    
                    logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}, retrying in {delay:.2f}s: {str(e)}")
                    time.sleep(delay)
            
            raise last_exception

        return wrapper
    return decorator


async def async_retry_with_backoff(config: Optional[RetryConfig] = None):
    """
    Async version of retry decorator with exponential backoff.
    
    Args:
        config: Retry configuration. Uses defaults if None.
    """
    if config is None:
        config = RetryConfig()

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(config.max_attempts):
                try:
                    if asyncio.iscoroutinefunction(func):
                        return await func(*args, **kwargs)
                    else:
                        return func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt == config.max_attempts - 1:
                        logger.error(f"Function {func.__name__} failed after {config.max_attempts} attempts")
                        raise RetryError(f"Max retry attempts exceeded") from e
                    
                    delay = min(
                        config.base_delay * (config.exponential_base ** attempt),
                        config.max_delay
                    )
                    
                    if config.jitter:
                        import random
                        delay *= (0.5 + random.random() * 0.5)
                    
                    logger.warning(f"Attempt {attempt + 1} failed for {func.__name__}, retrying in {delay:.2f}s: {str(e)}")
                    await asyncio.sleep(delay)
            
            raise last_exception

        return wrapper
    return decorator


class GracefulDegradation:
    """
    Provides graceful degradation patterns for service failures.
    """

    def __init__(self):
        self.fallback_handlers: Dict[str, Callable] = {}
        self.service_health: Dict[str, bool] = defaultdict(lambda: True)

    def register_fallback(self, service_name: str, fallback_handler: Callable):
        """Register a fallback handler for a service."""
        self.fallback_handlers[service_name] = fallback_handler
        logger.info(f"Registered fallback handler for service: {service_name}")

    def mark_service_unhealthy(self, service_name: str):
        """Mark a service as unhealthy."""
        self.service_health[service_name] = False
        logger.warning(f"Service marked as unhealthy: {service_name}")

    def mark_service_healthy(self, service_name: str):
        """Mark a service as healthy."""
        self.service_health[service_name] = True
        logger.info(f"Service marked as healthy: {service_name}")

    def is_service_healthy(self, service_name: str) -> bool:
        """Check if a service is healthy."""
        return self.service_health.get(service_name, True)

    def execute_with_fallback(self, service_name: str, primary_func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with fallback if service is unhealthy.
        
        Args:
            service_name: Name of the service
            primary_func: Primary function to execute
            *args, **kwargs: Arguments for the function
            
        Returns:
            Result from primary function or fallback
        """
        if self.is_service_healthy(service_name):
            try:
                return primary_func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Primary function failed for {service_name}: {str(e)}")
                self.mark_service_unhealthy(service_name)
                return self._execute_fallback(service_name, *args, **kwargs)
        else:
            return self._execute_fallback(service_name, *args, **kwargs)

    def _execute_fallback(self, service_name: str, *args, **kwargs) -> Any:
        """Execute fallback handler."""
        if service_name in self.fallback_handlers:
            logger.info(f"Executing fallback for service: {service_name}")
            return self.fallback_handlers[service_name](*args, **kwargs)
        else:
            logger.error(f"No fallback handler registered for service: {service_name}")
            raise ServiceUnavailableError(f"Service {service_name} is unavailable and no fallback is configured")


class ServiceUnavailableError(Exception):
    """Exception raised when a service is unavailable and no fallback exists."""
    pass


class ErrorHandler:
    """
    Centralized error handler for the multi-agent system.
    Provides consistent error handling, logging, and recovery strategies.
    """

    def __init__(self):
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.degradation_handler = GracefulDegradation()

    def get_circuit_breaker(self, name: str, config: Optional[CircuitBreakerConfig] = None) -> CircuitBreaker:
        """Get or create a circuit breaker."""
        if name not in self.circuit_breakers:
            if config is None:
                config = CircuitBreakerConfig(name=name)
            self.circuit_breakers[name] = CircuitBreaker(config)
        return self.circuit_breakers[name]

    def handle_agent_error(self, agent_name: str, error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle errors from agents with appropriate recovery strategies.
        
        Args:
            agent_name: Name of the agent that failed
            error: The exception that occurred
            context: Additional context information
            
        Returns:
            Error response with recovery information
        """
        error_info = {
            "agent": agent_name,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "timestamp": datetime.utcnow().isoformat(),
            "context": context or {}
        }

        logger.error(f"Agent error in {agent_name}: {error_info}")

        # Determine recovery strategy based on error type
        recovery_strategy = self._determine_recovery_strategy(error)
        error_info["recovery_strategy"] = recovery_strategy

        return {
            "status": "error",
            "error_info": error_info,
            "recovery_available": recovery_strategy != "none"
        }

    def handle_tool_error(self, tool_name: str, error: Exception, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Handle errors from tools with fallback strategies.
        
        Args:
            tool_name: Name of the tool that failed
            error: The exception that occurred
            parameters: Parameters that were passed to the tool
            
        Returns:
            Error response with fallback information
        """
        error_info = {
            "tool": tool_name,
            "error_type": type(error).__name__,
            "error_message": str(error),
            "timestamp": datetime.utcnow().isoformat(),
            "parameters": parameters or {}
        }

        logger.error(f"Tool error in {tool_name}: {error_info}")

        # Check if fallback is available
        fallback_available = self.degradation_handler.fallback_handlers.get(tool_name) is not None

        return {
            "status": "error",
            "error_info": error_info,
            "fallback_available": fallback_available
        }

    def _determine_recovery_strategy(self, error: Exception) -> str:
        """Determine the appropriate recovery strategy for an error."""
        if isinstance(error, (ConnectionError, TimeoutError)):
            return "retry"
        elif isinstance(error, (ValueError, TypeError)):
            return "parameter_validation"
        elif isinstance(error, FileNotFoundError):
            return "fallback_data"
        else:
            return "graceful_degradation"


# Global error handler instance
error_handler = ErrorHandler()


def safe_agent_call(agent_name: str, context: Optional[Dict[str, Any]] = None):
    """
    Decorator for safe agent calls with error handling.
    
    Args:
        agent_name: Name of the agent
        context: Additional context for error handling
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                return error_handler.handle_agent_error(agent_name, e, context)
        return wrapper
    return decorator


def safe_tool_call(tool_name: str):
    """
    Decorator for safe tool calls with error handling.
    
    Args:
        tool_name: Name of the tool
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                return error_handler.handle_tool_error(tool_name, e, kwargs)
        return wrapper
    return decorator