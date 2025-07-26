"""
Structured logging configuration with correlation IDs and OpenTelemetry integration.
Provides consistent logging across all agents and tools.
"""

import json
import logging
import logging.config
import uuid
import threading
import time
from typing import Any, Dict, Optional, Union
from datetime import datetime
from contextvars import ContextVar
from dataclasses import dataclass, asdict
import functools
import os

# Context variables for correlation tracking
correlation_id: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)
session_id: ContextVar[Optional[str]] = ContextVar('session_id', default=None)
user_id: ContextVar[Optional[str]] = ContextVar('user_id', default=None)
agent_name: ContextVar[Optional[str]] = ContextVar('agent_name', default=None)


@dataclass
class LogContext:
    """Log context information."""
    correlation_id: Optional[str] = None
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    agent_name: Optional[str] = None
    tool_name: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values."""
        return {k: v for k, v in asdict(self).items() if v is not None}


class ContextFilter(logging.Filter):
    """Logging filter that adds context information to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Add context information to log record."""
        # Add correlation ID
        record.correlation_id = correlation_id.get()
        record.session_id = session_id.get()
        record.user_id = user_id.get()
        record.agent_name = agent_name.get()
        
        # Add timestamp in ISO format
        record.timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Add thread information
        record.thread_name = threading.current_thread().name
        
        return True


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def __init__(self, include_context: bool = True):
        self.include_context = include_context
        super().__init__()

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            'timestamp': getattr(record, 'timestamp', datetime.utcnow().isoformat() + 'Z'),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'thread': getattr(record, 'thread_name', threading.current_thread().name),
        }

        # Add context information if available
        if self.include_context:
            context_fields = ['correlation_id', 'session_id', 'user_id', 'agent_name']
            for field in context_fields:
                value = getattr(record, field, None)
                if value:
                    log_data[field] = value

        # Add exception information if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': self.formatException(record.exc_info)
            }

        # Add any extra fields
        for key, value in record.__dict__.items():
            if key not in log_data and not key.startswith('_'):
                log_data[key] = value

        return json.dumps(log_data, default=str, ensure_ascii=False)


class PerformanceLogger:
    """Logger for performance metrics and timing."""

    def __init__(self, logger_name: str = 'performance'):
        self.logger = logging.getLogger(logger_name)

    def log_execution_time(self, operation: str, duration: float, context: Optional[Dict[str, Any]] = None):
        """Log execution time for an operation."""
        log_data = {
            'operation': operation,
            'duration_ms': round(duration * 1000, 2),
            'context': context or {}
        }
        self.logger.info(f"Operation {operation} completed", extra=log_data)

    def log_agent_performance(self, agent_name: str, operation: str, duration: float, 
                            success: bool = True, error: Optional[str] = None):
        """Log agent performance metrics."""
        log_data = {
            'agent_name': agent_name,
            'operation': operation,
            'duration_ms': round(duration * 1000, 2),
            'success': success,
            'error': error
        }
        level = logging.INFO if success else logging.WARNING
        self.logger.log(level, f"Agent {agent_name} {operation}", extra=log_data)

    def log_tool_performance(self, tool_name: str, operation: str, duration: float,
                           input_size: Optional[int] = None, output_size: Optional[int] = None,
                           success: bool = True, error: Optional[str] = None):
        """Log tool performance metrics."""
        log_data = {
            'tool_name': tool_name,
            'operation': operation,
            'duration_ms': round(duration * 1000, 2),
            'input_size': input_size,
            'output_size': output_size,
            'success': success,
            'error': error
        }
        level = logging.INFO if success else logging.WARNING
        self.logger.log(level, f"Tool {tool_name} {operation}", extra=log_data)


def setup_logging(config: Optional[Dict[str, Any]] = None) -> None:
    """
    Setup structured logging configuration.
    
    Args:
        config: Custom logging configuration. Uses defaults if None.
    """
    if config is None:
        config = get_default_logging_config()
    
    logging.config.dictConfig(config)
    
    # Set up context filter for all loggers
    context_filter = ContextFilter()
    for logger_name in config.get('loggers', {}):
        logger = logging.getLogger(logger_name)
        logger.addFilter(context_filter)
    
    # Also add to root logger
    root_logger = logging.getLogger()
    root_logger.addFilter(context_filter)


def get_default_logging_config() -> Dict[str, Any]:
    """Get default logging configuration."""
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    log_format = os.getenv('LOG_FORMAT', 'json')  # 'json' or 'text'
    
    formatters = {
        'json': {
            'class': 'orchestration_agent.utils.logging_config.JSONFormatter',
            'include_context': True
        },
        'text': {
            'format': '%(timestamp)s - %(name)s - %(levelname)s - [%(correlation_id)s] - %(message)s'
        }
    }
    
    handlers = {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': log_format,
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/application.log',
            'maxBytes': 10 * 1024 * 1024,  # 10MB
            'backupCount': 5,
            'formatter': log_format
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/errors.log',
            'maxBytes': 10 * 1024 * 1024,  # 10MB
            'backupCount': 5,
            'formatter': log_format,
            'level': 'WARNING'
        }
    }
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': formatters,
        'handlers': handlers,
        'loggers': {
            'orchestration_agent': {
                'level': log_level,
                'handlers': ['console', 'file', 'error_file'],
                'propagate': False
            },
            'visualization_agent': {
                'level': log_level,
                'handlers': ['console', 'file', 'error_file'],
                'propagate': False
            },
            'performance': {
                'level': 'INFO',
                'handlers': ['console', 'file'],
                'propagate': False
            },
            'security': {
                'level': 'INFO',
                'handlers': ['console', 'file', 'error_file'],
                'propagate': False
            }
        },
        'root': {
            'level': log_level,
            'handlers': ['console', 'file', 'error_file']
        }
    }


def set_correlation_id(corr_id: Optional[str] = None) -> str:
    """
    Set correlation ID for current context.
    
    Args:
        corr_id: Correlation ID to set. Generates new UUID if None.
        
    Returns:
        The correlation ID that was set.
    """
    if corr_id is None:
        corr_id = str(uuid.uuid4())
    
    correlation_id.set(corr_id)
    return corr_id


def set_session_id(sess_id: str) -> None:
    """Set session ID for current context."""
    session_id.set(sess_id)


def set_user_id(usr_id: str) -> None:
    """Set user ID for current context."""
    user_id.set(usr_id)


def set_agent_name(agent: str) -> None:
    """Set agent name for current context."""
    agent_name.set(agent)


def get_logger(name: str, context: Optional[LogContext] = None) -> logging.Logger:
    """
    Get logger with optional context.
    
    Args:
        name: Logger name
        context: Optional context to set
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    if context:
        if context.correlation_id:
            correlation_id.set(context.correlation_id)
        if context.session_id:
            session_id.set(context.session_id)
        if context.user_id:
            user_id.set(context.user_id)
        if context.agent_name:
            agent_name.set(context.agent_name)
    
    return logger


def log_with_context(logger_name: str = None, context: Optional[Dict[str, Any]] = None):
    """
    Decorator to add context to log messages within a function.
    
    Args:
        logger_name: Name of the logger to use
        context: Additional context to include
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            logger = get_logger(logger_name or func.__module__)
            
            # Set correlation ID if not already set
            if not correlation_id.get():
                set_correlation_id()
            
            # Log function entry
            entry_context = {
                'function': func.__name__,
                'args_count': len(args),
                'kwargs_count': len(kwargs),
                'context': context or {}
            }
            logger.debug(f"Entering function {func.__name__}", extra=entry_context)
            
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Log successful completion
                success_context = {
                    'function': func.__name__,
                    'duration_ms': round(duration * 1000, 2),
                    'success': True
                }
                logger.debug(f"Function {func.__name__} completed successfully", extra=success_context)
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                
                # Log error
                error_context = {
                    'function': func.__name__,
                    'duration_ms': round(duration * 1000, 2),
                    'success': False,
                    'error_type': type(e).__name__,
                    'error_message': str(e)
                }
                logger.error(f"Function {func.__name__} failed", extra=error_context, exc_info=True)
                
                raise
        return wrapper
    return decorator


def log_agent_call(agent_name: str):
    """
    Decorator for logging agent calls.
    
    Args:
        agent_name: Name of the agent
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Set agent context
            original_agent = agent_name.get()
            set_agent_name(agent_name)
            
            logger = get_logger(f'agent.{agent_name}')
            
            try:
                return log_with_context(f'agent.{agent_name}')(func)(*args, **kwargs)
            finally:
                # Restore original agent context
                if original_agent:
                    set_agent_name(original_agent)
                else:
                    agent_name.set(None)
        return wrapper
    return decorator


def log_tool_call(tool_name: str):
    """
    Decorator for logging tool calls.
    
    Args:
        tool_name: Name of the tool
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            logger = get_logger(f'tool.{tool_name}')
            
            return log_with_context(f'tool.{tool_name}', {'tool_name': tool_name})(func)(*args, **kwargs)
        return wrapper
    return decorator


# Performance logger instance
performance_logger = PerformanceLogger()


def measure_performance(operation_name: str = None, logger_instance: PerformanceLogger = None):
    """
    Decorator to measure and log performance of functions.
    
    Args:
        operation_name: Name of the operation (defaults to function name)
        logger_instance: Performance logger instance to use
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            perf_logger = logger_instance or performance_logger
            op_name = operation_name or func.__name__
            
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                perf_logger.log_execution_time(op_name, duration)
                return result
            except Exception as e:
                duration = time.time() - start_time
                perf_logger.log_execution_time(op_name, duration, {'error': str(e)})
                raise
        return wrapper
    return decorator


# Initialize logging on module import
if not logging.getLogger().handlers:
    setup_logging()