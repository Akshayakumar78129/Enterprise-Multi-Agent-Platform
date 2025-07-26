"""
Centralized configuration management system.
Provides environment-specific configuration with validation and hot-reload capabilities.
"""

import os
import json
import yaml
from typing import Any, Dict, List, Optional, Union, Type
from dataclasses import dataclass, field, asdict
from pathlib import Path
from enum import Enum
import logging
from functools import wraps
import threading
import time
import hashlib

from orchestration_agent.utils.logging_config import get_logger

logger = get_logger(__name__)


class Environment(Enum):
    """Environment types."""
    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


@dataclass
class DatabaseConfig:
    """Database configuration."""
    type: str = "sqlite"
    host: str = "localhost"
    port: int = 3306
    database: str = "multiagent"
    username: str = ""
    password: str = ""
    connection_pool_size: int = 10
    connection_timeout: int = 30
    ssl_enabled: bool = False
    
    def get_connection_string(self) -> str:
        """Get database connection string."""
        if self.type == "sqlite":
            return f"sqlite:///{self.database}.db"
        elif self.type == "mysql":
            return f"mysql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        elif self.type == "postgresql":
            return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        else:
            raise ValueError(f"Unsupported database type: {self.type}")


@dataclass
class CacheConfig:
    """Cache configuration."""
    enabled: bool = True
    default_ttl: int = 3600
    max_memory_size: int = 100 * 1024 * 1024  # 100MB
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    enable_memory_cache: bool = True
    enable_disk_cache: bool = True
    enable_redis_cache: bool = False
    disk_cache_dir: str = "./cache"


@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str = "INFO"
    format: str = "json"  # 'json' or 'text'
    file_enabled: bool = True
    file_path: str = "logs/application.log"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    backup_count: int = 5
    console_enabled: bool = True
    structured_logging: bool = True
    correlation_tracking: bool = True


@dataclass
class SecurityConfig:
    """Security configuration."""
    api_key_required: bool = False
    jwt_secret: Optional[str] = None
    jwt_expiration: int = 3600  # 1 hour
    rate_limiting_enabled: bool = True
    max_requests_per_minute: int = 60
    cors_enabled: bool = True
    cors_origins: List[str] = field(default_factory=lambda: ["*"])
    encryption_enabled: bool = False
    encryption_key: Optional[str] = None


@dataclass
class AgentConfig:
    """Agent configuration."""
    model: str = "gemini-2.0-flash"
    max_retries: int = 3
    timeout: int = 30
    circuit_breaker_threshold: int = 5
    circuit_breaker_recovery_timeout: int = 60
    cache_enabled: bool = True
    cache_ttl: int = 1800
    parallel_execution: bool = True
    max_concurrent_tasks: int = 10


@dataclass
class MonitoringConfig:
    """Monitoring and observability configuration."""
    enabled: bool = True
    metrics_enabled: bool = True
    tracing_enabled: bool = False
    health_check_enabled: bool = True
    health_check_interval: int = 30
    prometheus_enabled: bool = False
    prometheus_port: int = 9090
    jaeger_enabled: bool = False
    jaeger_endpoint: Optional[str] = None


@dataclass
class ApplicationConfig:
    """Main application configuration."""
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    
    # Component configurations
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    cache: CacheConfig = field(default_factory=CacheConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    agents: Dict[str, AgentConfig] = field(default_factory=dict)
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    
    # Custom settings
    custom: Dict[str, Any] = field(default_factory=dict)


class ConfigManager:
    """
    Centralized configuration manager with environment support and hot-reload.
    """

    def __init__(self, config_dir: str = "config"):
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(exist_ok=True)
        
        self._config: Optional[ApplicationConfig] = None
        self._config_lock = threading.RLock()
        self._watchers: Dict[str, Callable] = {}
        self._file_checksums: Dict[str, str] = {}
        
        # Auto-reload settings
        self._auto_reload = False
        self._reload_thread: Optional[threading.Thread] = None
        self._reload_interval = 5  # seconds

    def load_config(self, 
                   environment: Optional[Environment] = None,
                   config_file: Optional[str] = None) -> ApplicationConfig:
        """
        Load configuration from files and environment variables.
        
        Args:
            environment: Target environment
            config_file: Specific config file to load
            
        Returns:
            Loaded application configuration
        """
        with self._config_lock:
            # Determine environment
            if environment is None:
                env_str = os.getenv("ENVIRONMENT", "development").lower()
                environment = Environment(env_str)
            
            logger.info(f"Loading configuration for environment: {environment.value}")
            
            # Start with default configuration
            config = ApplicationConfig(environment=environment)
            
            # Load base configuration
            base_config_file = self.config_dir / "base.yaml"
            if base_config_file.exists():
                config = self._merge_config(config, self._load_config_file(base_config_file))
            
            # Load environment-specific configuration
            env_config_file = self.config_dir / f"{environment.value}.yaml"
            if env_config_file.exists():
                config = self._merge_config(config, self._load_config_file(env_config_file))
            
            # Load specific config file if provided
            if config_file:
                specific_config_file = Path(config_file)
                if specific_config_file.exists():
                    config = self._merge_config(config, self._load_config_file(specific_config_file))
            
            # Override with environment variables
            config = self._apply_env_overrides(config)
            
            # Validate configuration
            self._validate_config(config)
            
            self._config = config
            logger.info("Configuration loaded successfully")
            
            return config

    def get_config(self) -> ApplicationConfig:
        """Get current configuration."""
        if self._config is None:
            raise RuntimeError("Configuration not loaded. Call load_config() first.")
        return self._config

    def get_agent_config(self, agent_name: str) -> AgentConfig:
        """Get configuration for a specific agent."""
        config = self.get_config()
        return config.agents.get(agent_name, AgentConfig())

    def set_agent_config(self, agent_name: str, agent_config: AgentConfig):
        """Set configuration for a specific agent."""
        with self._config_lock:
            if self._config is None:
                raise RuntimeError("Configuration not loaded.")
            self._config.agents[agent_name] = agent_config

    def update_config(self, updates: Dict[str, Any]):
        """
        Update configuration with partial updates.
        
        Args:
            updates: Dictionary of configuration updates
        """
        with self._config_lock:
            if self._config is None:
                raise RuntimeError("Configuration not loaded.")
            
            # Apply updates using dot notation
            for key, value in updates.items():
                self._set_nested_value(self._config, key, value)
            
            # Validate updated configuration
            self._validate_config(self._config)
            
            # Notify watchers
            self._notify_watchers("config_updated", self._config)

    def save_config(self, file_path: Optional[str] = None):
        """
        Save current configuration to file.
        
        Args:
            file_path: Optional specific file path
        """
        if self._config is None:
            raise RuntimeError("No configuration to save.")
        
        if file_path is None:
            file_path = self.config_dir / f"{self._config.environment.value}.yaml"
        else:
            file_path = Path(file_path)
        
        config_dict = asdict(self._config)
        
        with open(file_path, 'w') as f:
            yaml.dump(config_dict, f, default_flow_style=False, indent=2)
        
        logger.info(f"Configuration saved to {file_path}")

    def register_watcher(self, name: str, callback: Callable[[str, ApplicationConfig], None]):
        """
        Register a configuration change watcher.
        
        Args:
            name: Watcher name
            callback: Callback function called on configuration changes
        """
        self._watchers[name] = callback
        logger.info(f"Registered config watcher: {name}")

    def unregister_watcher(self, name: str):
        """Unregister a configuration watcher."""
        self._watchers.pop(name, None)
        logger.info(f"Unregistered config watcher: {name}")

    def enable_auto_reload(self, interval: int = 5):
        """
        Enable automatic configuration reloading.
        
        Args:
            interval: Check interval in seconds
        """
        self._auto_reload = True
        self._reload_interval = interval
        
        if self._reload_thread is None or not self._reload_thread.is_alive():
            self._reload_thread = threading.Thread(target=self._reload_worker, daemon=True)
            self._reload_thread.start()
            logger.info(f"Auto-reload enabled with {interval}s interval")

    def disable_auto_reload(self):
        """Disable automatic configuration reloading."""
        self._auto_reload = False
        logger.info("Auto-reload disabled")

    def _load_config_file(self, file_path: Path) -> Dict[str, Any]:
        """Load configuration from a file."""
        try:
            with open(file_path, 'r') as f:
                if file_path.suffix.lower() == '.json':
                    return json.load(f)
                elif file_path.suffix.lower() in ['.yaml', '.yml']:
                    return yaml.safe_load(f) or {}
                else:
                    raise ValueError(f"Unsupported config file format: {file_path.suffix}")
        except Exception as e:
            logger.error(f"Error loading config file {file_path}: {e}")
            return {}

    def _merge_config(self, base_config: ApplicationConfig, updates: Dict[str, Any]) -> ApplicationConfig:
        """Merge configuration updates into base configuration."""
        # Convert base config to dict for easier merging
        config_dict = asdict(base_config)
        
        # Deep merge updates
        self._deep_merge(config_dict, updates)
        
        # Convert back to ApplicationConfig
        return self._dict_to_config(config_dict)

    def _deep_merge(self, base: Dict, updates: Dict):
        """Deep merge two dictionaries."""
        for key, value in updates.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._deep_merge(base[key], value)
            else:
                base[key] = value

    def _dict_to_config(self, config_dict: Dict[str, Any]) -> ApplicationConfig:
        """Convert dictionary to ApplicationConfig."""
        # Handle environment conversion
        if isinstance(config_dict.get('environment'), str):
            config_dict['environment'] = Environment(config_dict['environment'])
        
        # Handle nested configurations
        if 'database' in config_dict and isinstance(config_dict['database'], dict):
            config_dict['database'] = DatabaseConfig(**config_dict['database'])
        
        if 'cache' in config_dict and isinstance(config_dict['cache'], dict):
            config_dict['cache'] = CacheConfig(**config_dict['cache'])
        
        if 'logging' in config_dict and isinstance(config_dict['logging'], dict):
            config_dict['logging'] = LoggingConfig(**config_dict['logging'])
        
        if 'security' in config_dict and isinstance(config_dict['security'], dict):
            config_dict['security'] = SecurityConfig(**config_dict['security'])
        
        if 'monitoring' in config_dict and isinstance(config_dict['monitoring'], dict):
            config_dict['monitoring'] = MonitoringConfig(**config_dict['monitoring'])
        
        # Handle agents dictionary
        if 'agents' in config_dict and isinstance(config_dict['agents'], dict):
            agents = {}
            for agent_name, agent_config in config_dict['agents'].items():
                if isinstance(agent_config, dict):
                    agents[agent_name] = AgentConfig(**agent_config)
                else:
                    agents[agent_name] = agent_config
            config_dict['agents'] = agents
        
        return ApplicationConfig(**config_dict)

    def _apply_env_overrides(self, config: ApplicationConfig) -> ApplicationConfig:
        """Apply environment variable overrides."""
        # Define environment variable mappings
        env_mappings = {
            'HOST': 'host',
            'PORT': 'port',
            'DEBUG': 'debug',
            'DATABASE_TYPE': 'database.type',
            'DATABASE_HOST': 'database.host',
            'DATABASE_PORT': 'database.port',
            'DATABASE_NAME': 'database.database',
            'DATABASE_USER': 'database.username',
            'DATABASE_PASSWORD': 'database.password',
            'REDIS_HOST': 'cache.redis_host',
            'REDIS_PORT': 'cache.redis_port',
            'REDIS_PASSWORD': 'cache.redis_password',
            'LOG_LEVEL': 'logging.level',
            'JWT_SECRET': 'security.jwt_secret',
            'API_KEY_REQUIRED': 'security.api_key_required'
        }
        
        config_dict = asdict(config)
        
        for env_var, config_path in env_mappings.items():
            env_value = os.getenv(env_var)
            if env_value is not None:
                # Convert string values to appropriate types
                env_value = self._convert_env_value(env_value)
                self._set_nested_value(config_dict, config_path, env_value)
        
        return self._dict_to_config(config_dict)

    def _convert_env_value(self, value: str) -> Any:
        """Convert environment variable string to appropriate type."""
        # Boolean conversion
        if value.lower() in ('true', 'false'):
            return value.lower() == 'true'
        
        # Integer conversion
        if value.isdigit():
            return int(value)
        
        # Float conversion
        try:
            return float(value)
        except ValueError:
            pass
        
        # Return as string
        return value

    def _set_nested_value(self, obj: Union[Dict, object], path: str, value: Any):
        """Set a nested value using dot notation."""
        keys = path.split('.')
        current = obj
        
        for key in keys[:-1]:
            if isinstance(current, dict):
                if key not in current:
                    current[key] = {}
                current = current[key]
            else:
                if not hasattr(current, key):
                    setattr(current, key, {})
                current = getattr(current, key)
        
        # Set the final value
        final_key = keys[-1]
        if isinstance(current, dict):
            current[final_key] = value
        else:
            setattr(current, final_key, value)

    def _validate_config(self, config: ApplicationConfig):
        """Validate configuration values."""
        # Validate port range
        if not (1 <= config.port <= 65535):
            raise ValueError(f"Invalid port number: {config.port}")
        
        # Validate database configuration
        if config.database.type not in ['sqlite', 'mysql', 'postgresql']:
            raise ValueError(f"Unsupported database type: {config.database.type}")
        
        # Validate logging level
        valid_log_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if config.logging.level.upper() not in valid_log_levels:
            raise ValueError(f"Invalid log level: {config.logging.level}")
        
        # Validate agent configurations
        for agent_name, agent_config in config.agents.items():
            if agent_config.max_retries < 0:
                raise ValueError(f"Invalid max_retries for agent {agent_name}: {agent_config.max_retries}")
            if agent_config.timeout <= 0:
                raise ValueError(f"Invalid timeout for agent {agent_name}: {agent_config.timeout}")

    def _notify_watchers(self, event: str, config: ApplicationConfig):
        """Notify all registered watchers of configuration changes."""
        for name, callback in self._watchers.items():
            try:
                callback(event, config)
            except Exception as e:
                logger.error(f"Error in config watcher {name}: {e}")

    def _reload_worker(self):
        """Background worker for automatic configuration reloading."""
        while self._auto_reload:
            try:
                self._check_and_reload()
                time.sleep(self._reload_interval)
            except Exception as e:
                logger.error(f"Error in config reload worker: {e}")
                time.sleep(self._reload_interval)

    def _check_and_reload(self):
        """Check for configuration file changes and reload if necessary."""
        if self._config is None:
            return
        
        config_files = [
            self.config_dir / "base.yaml",
            self.config_dir / f"{self._config.environment.value}.yaml"
        ]
        
        reload_needed = False
        
        for config_file in config_files:
            if config_file.exists():
                current_checksum = self._calculate_file_checksum(config_file)
                stored_checksum = self._file_checksums.get(str(config_file))
                
                if stored_checksum != current_checksum:
                    self._file_checksums[str(config_file)] = current_checksum
                    reload_needed = True
        
        if reload_needed:
            logger.info("Configuration files changed, reloading...")
            try:
                old_config = self._config
                self.load_config(self._config.environment)
                self._notify_watchers("config_reloaded", self._config)
            except Exception as e:
                logger.error(f"Failed to reload configuration: {e}")
                self._config = old_config  # Restore previous config

    def _calculate_file_checksum(self, file_path: Path) -> str:
        """Calculate MD5 checksum of a file."""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()


def config_required(config_path: Optional[str] = None):
    """
    Decorator to ensure configuration is loaded before function execution.
    
    Args:
        config_path: Optional specific configuration path to check
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            config = config_manager.get_config()
            
            if config_path:
                # Check if specific config path exists
                try:
                    current = config
                    for key in config_path.split('.'):
                        current = getattr(current, key)
                except AttributeError:
                    raise RuntimeError(f"Required configuration path not found: {config_path}")
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Global configuration manager instance
config_manager = ConfigManager()


# Convenience functions
def get_config() -> ApplicationConfig:
    """Get current application configuration."""
    return config_manager.get_config()


def get_database_config() -> DatabaseConfig:
    """Get database configuration."""
    return config_manager.get_config().database


def get_cache_config() -> CacheConfig:
    """Get cache configuration."""
    return config_manager.get_config().cache


def get_agent_config(agent_name: str) -> AgentConfig:
    """Get agent-specific configuration."""
    return config_manager.get_agent_config(agent_name)


def is_production() -> bool:
    """Check if running in production environment."""
    return config_manager.get_config().environment == Environment.PRODUCTION


def is_debug() -> bool:
    """Check if debug mode is enabled."""
    return config_manager.get_config().debug


# Initialize default configuration
def init_default_config():
    """Initialize default configuration files."""
    config_dir = Path("config")
    config_dir.mkdir(exist_ok=True)
    
    # Create base.yaml if it doesn't exist
    base_config_file = config_dir / "base.yaml"
    if not base_config_file.exists():
        base_config = {
            "database": {
                "type": "sqlite",
                "database": "multiagent"
            },
            "cache": {
                "enabled": True,
                "default_ttl": 3600
            },
            "logging": {
                "level": "INFO",
                "format": "json"
            },
            "agents": {
                "customer": {
                    "model": "gemini-2.0-flash",
                    "max_retries": 3,
                    "timeout": 30
                },
                "sales": {
                    "model": "gemini-2.0-flash",
                    "max_retries": 3,
                    "timeout": 30
                },
                "financial": {
                    "model": "gemini-2.0-flash",
                    "max_retries": 3,
                    "timeout": 30
                },
                "inventory": {
                    "model": "gemini-2.0-flash",
                    "max_retries": 3,
                    "timeout": 30
                }
            }
        }
        
        with open(base_config_file, 'w') as f:
            yaml.dump(base_config, f, default_flow_style=False, indent=2)
    
    # Create development.yaml if it doesn't exist
    dev_config_file = config_dir / "development.yaml"
    if not dev_config_file.exists():
        dev_config = {
            "debug": True,
            "logging": {
                "level": "DEBUG"
            },
            "cache": {
                "enable_redis_cache": False
            }
        }
        
        with open(dev_config_file, 'w') as f:
            yaml.dump(dev_config, f, default_flow_style=False, indent=2)


if __name__ == "__main__":
    # Initialize default configuration
    init_default_config()
    
    # Load configuration
    config_manager.load_config()
    
    print("Configuration management system initialized!")
    print(f"Environment: {config_manager.get_config().environment.value}")
    print(f"Debug mode: {config_manager.get_config().debug}")