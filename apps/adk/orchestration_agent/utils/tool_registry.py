"""
Automatic tool discovery and registration system.
Provides dynamic tool loading and management across agents.
"""

import inspect
import importlib
import logging
from typing import Dict, List, Any, Callable, Optional, Type, Union
from pathlib import Path
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
import functools

from orchestration_agent.utils.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class ToolMetadata:
    """Metadata for registered tools."""
    name: str
    description: str
    category: str
    version: str = "1.0.0"
    dependencies: List[str] = field(default_factory=list)
    parameters: Dict[str, Any] = field(default_factory=dict)
    return_type: Optional[Type] = None
    is_async: bool = False
    cache_ttl: Optional[int] = None
    retry_config: Optional[Dict[str, Any]] = None
    circuit_breaker_config: Optional[Dict[str, Any]] = None


@dataclass
class ToolDefinition:
    """Complete tool definition with metadata and function."""
    metadata: ToolMetadata
    function: Callable
    module_path: str
    agent_categories: List[str] = field(default_factory=list)


class ToolInterface(ABC):
    """Abstract base class for tools."""
    
    @abstractmethod
    def execute(self, *args, **kwargs) -> Any:
        """Execute the tool with given parameters."""
        pass
    
    @property
    @abstractmethod
    def metadata(self) -> ToolMetadata:
        """Get tool metadata."""
        pass


def tool_metadata(
    name: str,
    description: str,
    category: str,
    version: str = "1.0.0",
    dependencies: Optional[List[str]] = None,
    cache_ttl: Optional[int] = None,
    retry_config: Optional[Dict[str, Any]] = None,
    circuit_breaker_config: Optional[Dict[str, Any]] = None,
    agent_categories: Optional[List[str]] = None
):
    """
    Decorator to add metadata to tool functions.
    
    Args:
        name: Tool name
        description: Tool description
        category: Tool category (e.g., 'analytics', 'data_processing')
        version: Tool version
        dependencies: List of required dependencies
        cache_ttl: Cache time-to-live in seconds
        retry_config: Retry configuration
        circuit_breaker_config: Circuit breaker configuration
        agent_categories: List of agent categories this tool belongs to
    """
    def decorator(func: Callable) -> Callable:
        # Extract function signature for parameters
        sig = inspect.signature(func)
        parameters = {}
        for param_name, param in sig.parameters.items():
            param_info = {
                'type': param.annotation if param.annotation != inspect.Parameter.empty else 'Any',
                'default': param.default if param.default != inspect.Parameter.empty else None,
                'required': param.default == inspect.Parameter.empty
            }
            parameters[param_name] = param_info
        
        # Create metadata
        metadata = ToolMetadata(
            name=name,
            description=description,
            category=category,
            version=version,
            dependencies=dependencies or [],
            parameters=parameters,
            return_type=sig.return_annotation if sig.return_annotation != inspect.Parameter.empty else None,
            is_async=inspect.iscoroutinefunction(func),
            cache_ttl=cache_ttl,
            retry_config=retry_config,
            circuit_breaker_config=circuit_breaker_config
        )
        
        # Attach metadata to function
        func._tool_metadata = metadata
        func._agent_categories = agent_categories or []
        
        return func
    return decorator


class ToolRegistry:
    """
    Central registry for tool discovery and management.
    """

    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self.categories: Dict[str, List[str]] = {}
        self.agent_tools: Dict[str, List[str]] = {}
        self._discovery_paths: List[Path] = []

    def add_discovery_path(self, path: Union[str, Path]):
        """Add a path for tool discovery."""
        path = Path(path)
        if path.exists():
            self._discovery_paths.append(path)
            logger.info(f"Added discovery path: {path}")
        else:
            logger.warning(f"Discovery path does not exist: {path}")

    def register_tool(self, tool_def: ToolDefinition):
        """
        Register a tool definition.
        
        Args:
            tool_def: Tool definition to register
        """
        tool_name = tool_def.metadata.name
        
        if tool_name in self.tools:
            logger.warning(f"Tool {tool_name} already registered, replacing")
        
        self.tools[tool_name] = tool_def
        
        # Update category index
        category = tool_def.metadata.category
        if category not in self.categories:
            self.categories[category] = []
        if tool_name not in self.categories[category]:
            self.categories[category].append(tool_name)
        
        # Update agent category index
        for agent_category in tool_def.agent_categories:
            if agent_category not in self.agent_tools:
                self.agent_tools[agent_category] = []
            if tool_name not in self.agent_tools[agent_category]:
                self.agent_tools[agent_category].append(tool_name)
        
        logger.info(f"Registered tool: {tool_name} (category: {category})")

    def register_function(
        self, 
        func: Callable, 
        metadata: Optional[ToolMetadata] = None,
        agent_categories: Optional[List[str]] = None
    ):
        """
        Register a function as a tool.
        
        Args:
            func: Function to register
            metadata: Optional metadata (will be extracted from function if not provided)
            agent_categories: Agent categories this tool belongs to
        """
        # Extract metadata from function if available
        if hasattr(func, '_tool_metadata'):
            tool_metadata = func._tool_metadata
            agent_cats = getattr(func, '_agent_categories', [])
        elif metadata:
            tool_metadata = metadata
            agent_cats = agent_categories or []
        else:
            # Create basic metadata
            tool_metadata = ToolMetadata(
                name=func.__name__,
                description=func.__doc__ or f"Tool: {func.__name__}",
                category="general"
            )
            agent_cats = agent_categories or []
        
        tool_def = ToolDefinition(
            metadata=tool_metadata,
            function=func,
            module_path=func.__module__,
            agent_categories=agent_cats
        )
        
        self.register_tool(tool_def)

    def discover_tools(self, recursive: bool = True):
        """
        Discover tools in registered paths.
        
        Args:
            recursive: Whether to search recursively
        """
        logger.info("Starting tool discovery")
        discovered_count = 0
        
        for path in self._discovery_paths:
            discovered_count += self._discover_in_path(path, recursive)
        
        logger.info(f"Tool discovery completed. Found {discovered_count} tools")
        return discovered_count

    def _discover_in_path(self, path: Path, recursive: bool) -> int:
        """Discover tools in a specific path."""
        discovered_count = 0
        
        # Find Python files
        pattern = "**/*.py" if recursive else "*.py"
        python_files = list(path.glob(pattern))
        
        for py_file in python_files:
            if py_file.name.startswith('__') or py_file.name.startswith('test_'):
                continue
                
            try:
                discovered_count += self._discover_in_file(py_file)
            except Exception as e:
                logger.warning(f"Error discovering tools in {py_file}: {e}")
        
        return discovered_count

    def _discover_in_file(self, file_path: Path) -> int:
        """Discover tools in a Python file."""
        # Convert file path to module path
        module_path = self._file_to_module_path(file_path)
        
        try:
            module = importlib.import_module(module_path)
            return self._discover_in_module(module)
        except Exception as e:
            logger.debug(f"Could not import module {module_path}: {e}")
            return 0

    def _discover_in_module(self, module) -> int:
        """Discover tools in a module."""
        discovered_count = 0
        
        for name in dir(module):
            obj = getattr(module, name)
            
            # Check if it's a function with tool metadata
            if (inspect.isfunction(obj) and 
                hasattr(obj, '_tool_metadata')):
                
                try:
                    self.register_function(obj)
                    discovered_count += 1
                except Exception as e:
                    logger.warning(f"Error registering tool {name}: {e}")
            
            # Check if it's a class implementing ToolInterface
            elif (inspect.isclass(obj) and 
                  issubclass(obj, ToolInterface) and 
                  obj != ToolInterface):
                
                try:
                    instance = obj()
                    self.register_function(instance.execute, instance.metadata)
                    discovered_count += 1
                except Exception as e:
                    logger.warning(f"Error registering tool class {name}: {e}")
        
        return discovered_count

    def _file_to_module_path(self, file_path: Path) -> str:
        """Convert file path to module import path."""
        # Remove .py extension
        module_path = str(file_path.with_suffix(''))
        
        # Convert path separators to dots
        module_path = module_path.replace('/', '.').replace('\\', '.')
        
        # Remove leading dots
        while module_path.startswith('.'):
            module_path = module_path[1:]
        
        return module_path

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        """Get a tool by name."""
        return self.tools.get(name)

    def get_tools_by_category(self, category: str) -> List[ToolDefinition]:
        """Get all tools in a category."""
        tool_names = self.categories.get(category, [])
        return [self.tools[name] for name in tool_names if name in self.tools]

    def get_tools_for_agent(self, agent_category: str) -> List[ToolDefinition]:
        """Get all tools for an agent category."""
        tool_names = self.agent_tools.get(agent_category, [])
        return [self.tools[name] for name in tool_names if name in self.tools]

    def list_tools(self) -> List[str]:
        """List all registered tool names."""
        return list(self.tools.keys())

    def list_categories(self) -> List[str]:
        """List all tool categories."""
        return list(self.categories.keys())

    def get_tool_info(self, name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a tool."""
        tool_def = self.get_tool(name)
        if not tool_def:
            return None
        
        return {
            'name': tool_def.metadata.name,
            'description': tool_def.metadata.description,
            'category': tool_def.metadata.category,
            'version': tool_def.metadata.version,
            'dependencies': tool_def.metadata.dependencies,
            'parameters': tool_def.metadata.parameters,
            'return_type': str(tool_def.metadata.return_type) if tool_def.metadata.return_type else None,
            'is_async': tool_def.metadata.is_async,
            'module_path': tool_def.module_path,
            'agent_categories': tool_def.agent_categories,
            'cache_ttl': tool_def.metadata.cache_ttl,
            'has_retry_config': tool_def.metadata.retry_config is not None,
            'has_circuit_breaker': tool_def.metadata.circuit_breaker_config is not None
        }

    def validate_dependencies(self) -> Dict[str, List[str]]:
        """
        Validate that all tool dependencies are available.
        
        Returns:
            Dictionary of tools with missing dependencies
        """
        missing_deps = {}
        
        for tool_name, tool_def in self.tools.items():
            missing = []
            for dep in tool_def.metadata.dependencies:
                try:
                    importlib.import_module(dep)
                except ImportError:
                    missing.append(dep)
            
            if missing:
                missing_deps[tool_name] = missing
        
        return missing_deps

    def create_enhanced_function(self, tool_name: str) -> Optional[Callable]:
        """
        Create an enhanced function with error handling, caching, and logging.
        
        Args:
            tool_name: Name of the tool to enhance
            
        Returns:
            Enhanced function or None if tool not found
        """
        tool_def = self.get_tool(tool_name)
        if not tool_def:
            return None
        
        from orchestration_agent.utils.error_handling import safe_tool_call, retry_with_backoff
        from orchestration_agent.utils.caching import cache_tool_result
        from orchestration_agent.utils.logging_config import log_tool_call, measure_performance
        
        func = tool_def.function
        metadata = tool_def.metadata
        
        # Apply enhancements based on metadata
        enhanced_func = func
        
        # Add retry logic if configured
        if metadata.retry_config:
            from orchestration_agent.utils.error_handling import RetryConfig
            retry_config = RetryConfig(**metadata.retry_config)
            enhanced_func = retry_with_backoff(retry_config)(enhanced_func)
        
        # Add caching if configured
        if metadata.cache_ttl:
            enhanced_func = cache_tool_result(tool_name, ttl=metadata.cache_ttl)(enhanced_func)
        
        # Add logging and monitoring
        enhanced_func = log_tool_call(tool_name)(enhanced_func)
        enhanced_func = measure_performance(f"tool_{tool_name}")(enhanced_func)
        
        # Add error handling
        enhanced_func = safe_tool_call(tool_name)(enhanced_func)
        
        return enhanced_func

    def export_registry(self) -> Dict[str, Any]:
        """Export registry state for serialization."""
        return {
            'tools': {
                name: {
                    'metadata': {
                        'name': tool_def.metadata.name,
                        'description': tool_def.metadata.description,
                        'category': tool_def.metadata.category,
                        'version': tool_def.metadata.version,
                        'dependencies': tool_def.metadata.dependencies,
                        'is_async': tool_def.metadata.is_async,
                        'cache_ttl': tool_def.metadata.cache_ttl
                    },
                    'module_path': tool_def.module_path,
                    'agent_categories': tool_def.agent_categories
                }
                for name, tool_def in self.tools.items()
            },
            'categories': self.categories,
            'agent_tools': self.agent_tools
        }


# Global tool registry instance
tool_registry = ToolRegistry()


def auto_discover_tools(base_paths: Optional[List[str]] = None):
    """
    Automatically discover and register tools.
    
    Args:
        base_paths: Optional list of base paths to search. Uses default paths if None.
    """
    if base_paths is None:
        # Default discovery paths
        base_paths = [
            "orchestration_agent/tools",
            "visualization_agent/tools"
        ]
    
    # Add discovery paths
    for path in base_paths:
        tool_registry.add_discovery_path(path)
    
    # Discover tools
    discovered_count = tool_registry.discover_tools()
    
    # Validate dependencies
    missing_deps = tool_registry.validate_dependencies()
    if missing_deps:
        logger.warning(f"Tools with missing dependencies: {list(missing_deps.keys())}")
        for tool_name, deps in missing_deps.items():
            logger.warning(f"  {tool_name}: {deps}")
    
    logger.info(f"Auto-discovery completed. Registered {discovered_count} tools")
    return discovered_count


def get_agent_tools(agent_category: str) -> List[Callable]:
    """
    Get enhanced tools for a specific agent category.
    
    Args:
        agent_category: Agent category (e.g., 'customer', 'sales', 'financial')
        
    Returns:
        List of enhanced tool functions
    """
    tool_definitions = tool_registry.get_tools_for_agent(agent_category)
    enhanced_tools = []
    
    for tool_def in tool_definitions:
        enhanced_func = tool_registry.create_enhanced_function(tool_def.metadata.name)
        if enhanced_func:
            enhanced_tools.append(enhanced_func)
    
    return enhanced_tools


# Initialize tool registry on import
if __name__ == "__main__":
    auto_discover_tools()