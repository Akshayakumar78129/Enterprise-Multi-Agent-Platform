"""
Async processing utilities for I/O operations and parallel execution.
Provides async database operations, API calls, and task orchestration.
"""

import asyncio
import aiohttp
import aiofiles
import aiomysql
import aiosqlite
from typing import Any, Dict, List, Optional, Callable, Union, Awaitable
from dataclasses import dataclass
import concurrent.futures
import time
import logging
from functools import wraps
from contextlib import asynccontextmanager
import json

from orchestration_agent.utils.logging_config import get_logger
from orchestration_agent.utils.error_handling import async_retry_with_backoff, RetryConfig

logger = get_logger(__name__)


@dataclass
class AsyncTaskResult:
    """Result of an async task execution."""
    task_id: str
    status: str  # 'success', 'error', 'timeout'
    result: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    metadata: Dict[str, Any] = None


class AsyncDatabaseManager:
    """
    Async database manager for SQLite and MySQL operations.
    """

    def __init__(self, db_type: str = "sqlite", connection_string: str = None):
        self.db_type = db_type.lower()
        self.connection_string = connection_string
        self._connection_pool = None
        self._lock = asyncio.Lock()

    async def initialize(self):
        """Initialize database connection pool."""
        async with self._lock:
            if self._connection_pool is None:
                if self.db_type == "sqlite":
                    # SQLite doesn't need a pool, but we'll create a connection manager
                    self._connection_pool = "sqlite_ready"
                elif self.db_type == "mysql":
                    if not self.connection_string:
                        raise ValueError("MySQL requires connection string")
                    
                    # Parse connection string for aiomysql
                    # Format: mysql://user:password@host:port/database
                    import urllib.parse
                    parsed = urllib.parse.urlparse(self.connection_string)
                    
                    self._connection_pool = await aiomysql.create_pool(
                        host=parsed.hostname,
                        port=parsed.port or 3306,
                        user=parsed.username,
                        password=parsed.password,
                        db=parsed.path[1:] if parsed.path else None,
                        autocommit=True,
                        maxsize=20
                    )
                
                logger.info(f"Initialized {self.db_type} connection pool")

    @asynccontextmanager
    async def get_connection(self):
        """Get database connection from pool."""
        if self._connection_pool is None:
            await self.initialize()

        if self.db_type == "sqlite":
            db_path = self.connection_string or ":memory:"
            async with aiosqlite.connect(db_path) as conn:
                yield conn
        elif self.db_type == "mysql":
            async with self._connection_pool.acquire() as conn:
                yield conn

    async def execute_query(
        self, 
        query: str, 
        params: Optional[tuple] = None,
        fetch: str = "none"  # 'none', 'one', 'all'
    ) -> Any:
        """
        Execute a database query asynchronously.
        
        Args:
            query: SQL query to execute
            params: Query parameters
            fetch: Fetch mode ('none', 'one', 'all')
            
        Returns:
            Query result based on fetch mode
        """
        retry_config = RetryConfig(
            max_attempts=3,
            base_delay=0.5,
            retryable_exceptions=(Exception,)
        )

        @async_retry_with_backoff(retry_config)
        async def execute_with_retry():
            async with self.get_connection() as conn:
                if self.db_type == "sqlite":
                    cursor = await conn.execute(query, params or ())
                    
                    if fetch == "one":
                        result = await cursor.fetchone()
                    elif fetch == "all":
                        result = await cursor.fetchall()
                    else:
                        result = cursor.rowcount
                    
                    await conn.commit()
                    return result
                
                elif self.db_type == "mysql":
                    async with conn.cursor() as cursor:
                        await cursor.execute(query, params or ())
                        
                        if fetch == "one":
                            result = await cursor.fetchone()
                        elif fetch == "all":
                            result = await cursor.fetchall()
                        else:
                            result = cursor.rowcount
                        
                        return result

        return await execute_with_retry()

    async def execute_batch(self, queries: List[Dict[str, Any]]) -> List[Any]:
        """
        Execute multiple queries in batch.
        
        Args:
            queries: List of query dictionaries with 'query', 'params', 'fetch' keys
            
        Returns:
            List of query results
        """
        tasks = []
        
        for query_info in queries:
            task = self.execute_query(
                query_info["query"],
                query_info.get("params"),
                query_info.get("fetch", "none")
            )
            tasks.append(task)
        
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def close(self):
        """Close database connections."""
        if self._connection_pool and self.db_type == "mysql":
            self._connection_pool.close()
            await self._connection_pool.wait_closed()


class AsyncHTTPClient:
    """
    Async HTTP client for API calls with connection pooling.
    """

    def __init__(self, timeout: int = 30, max_connections: int = 100):
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.connector = aiohttp.TCPConnector(limit=max_connections)
        self._session = None

    async def get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=self.timeout,
                connector=self.connector
            )
        return self._session

    async def get(self, url: str, headers: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make async GET request."""
        session = await self.get_session()
        
        try:
            async with session.get(url, headers=headers, params=params) as response:
                response.raise_for_status()
                
                if response.content_type == 'application/json':
                    data = await response.json()
                else:
                    data = await response.text()
                
                return {
                    "status": "success",
                    "status_code": response.status,
                    "data": data,
                    "headers": dict(response.headers)
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "status_code": getattr(e, 'status', None)
            }

    async def post(self, url: str, data: Any = None, json_data: Any = None, headers: Optional[Dict] = None) -> Dict[str, Any]:
        """Make async POST request."""
        session = await self.get_session()
        
        try:
            kwargs = {}
            if data:
                kwargs['data'] = data
            if json_data:
                kwargs['json'] = json_data
            if headers:
                kwargs['headers'] = headers
            
            async with session.post(url, **kwargs) as response:
                response.raise_for_status()
                
                if response.content_type == 'application/json':
                    response_data = await response.json()
                else:
                    response_data = await response.text()
                
                return {
                    "status": "success",
                    "status_code": response.status,
                    "data": response_data,
                    "headers": dict(response.headers)
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "status_code": getattr(e, 'status', None)
            }

    async def batch_requests(self, requests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute multiple HTTP requests in parallel.
        
        Args:
            requests: List of request dictionaries with 'method', 'url', and optional params
            
        Returns:
            List of response dictionaries
        """
        tasks = []
        
        for req in requests:
            method = req.get("method", "GET").upper()
            url = req["url"]
            
            if method == "GET":
                task = self.get(
                    url,
                    headers=req.get("headers"),
                    params=req.get("params")
                )
            elif method == "POST":
                task = self.post(
                    url,
                    data=req.get("data"),
                    json_data=req.get("json"),
                    headers=req.get("headers")
                )
            else:
                # Add more methods as needed
                continue
            
            tasks.append(task)
        
        return await asyncio.gather(*tasks, return_exceptions=True)

    async def close(self):
        """Close HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()


class AsyncFileManager:
    """
    Async file operations manager.
    """

    @staticmethod
    async def read_file(file_path: str, encoding: str = "utf-8") -> Dict[str, Any]:
        """
        Read file asynchronously.
        
        Args:
            file_path: Path to file
            encoding: File encoding
            
        Returns:
            File content or error information
        """
        try:
            async with aiofiles.open(file_path, mode='r', encoding=encoding) as f:
                content = await f.read()
                return {
                    "status": "success",
                    "content": content,
                    "file_path": file_path
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "file_path": file_path
            }

    @staticmethod
    async def write_file(file_path: str, content: str, encoding: str = "utf-8") -> Dict[str, Any]:
        """
        Write file asynchronously.
        
        Args:
            file_path: Path to file
            content: Content to write
            encoding: File encoding
            
        Returns:
            Write operation result
        """
        try:
            async with aiofiles.open(file_path, mode='w', encoding=encoding) as f:
                await f.write(content)
                return {
                    "status": "success",
                    "file_path": file_path,
                    "bytes_written": len(content.encode(encoding))
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "file_path": file_path
            }

    @staticmethod
    async def read_json_file(file_path: str) -> Dict[str, Any]:
        """Read JSON file asynchronously."""
        result = await AsyncFileManager.read_file(file_path)
        
        if result["status"] == "success":
            try:
                result["data"] = json.loads(result["content"])
                del result["content"]  # Remove raw content
            except json.JSONDecodeError as e:
                result["status"] = "error"
                result["error"] = f"JSON decode error: {str(e)}"
        
        return result

    @staticmethod
    async def write_json_file(file_path: str, data: Any, indent: int = 2) -> Dict[str, Any]:
        """Write JSON file asynchronously."""
        try:
            content = json.dumps(data, indent=indent, default=str)
            return await AsyncFileManager.write_file(file_path, content)
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "file_path": file_path
            }

    @staticmethod
    async def batch_file_operations(operations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Execute multiple file operations in parallel.
        
        Args:
            operations: List of operation dictionaries
            
        Returns:
            List of operation results
        """
        tasks = []
        
        for op in operations:
            op_type = op["type"]
            
            if op_type == "read":
                task = AsyncFileManager.read_file(op["file_path"], op.get("encoding", "utf-8"))
            elif op_type == "write":
                task = AsyncFileManager.write_file(op["file_path"], op["content"], op.get("encoding", "utf-8"))
            elif op_type == "read_json":
                task = AsyncFileManager.read_json_file(op["file_path"])
            elif op_type == "write_json":
                task = AsyncFileManager.write_json_file(op["file_path"], op["data"], op.get("indent", 2))
            else:
                continue
            
            tasks.append(task)
        
        return await asyncio.gather(*tasks, return_exceptions=True)


class AsyncTaskOrchestrator:
    """
    Orchestrator for managing async tasks and workflows.
    """

    def __init__(self, max_concurrent_tasks: int = 10):
        self.max_concurrent_tasks = max_concurrent_tasks
        self.semaphore = asyncio.Semaphore(max_concurrent_tasks)
        self.active_tasks: Dict[str, asyncio.Task] = {}

    async def execute_task(
        self,
        task_id: str,
        coro: Awaitable,
        timeout: Optional[float] = None
    ) -> AsyncTaskResult:
        """
        Execute a single async task with monitoring.
        
        Args:
            task_id: Unique task identifier
            coro: Coroutine to execute
            timeout: Optional timeout in seconds
            
        Returns:
            Task execution result
        """
        start_time = time.time()
        
        async with self.semaphore:
            try:
                if timeout:
                    result = await asyncio.wait_for(coro, timeout=timeout)
                else:
                    result = await coro
                
                execution_time = time.time() - start_time
                
                return AsyncTaskResult(
                    task_id=task_id,
                    status="success",
                    result=result,
                    execution_time=execution_time
                )
                
            except asyncio.TimeoutError:
                execution_time = time.time() - start_time
                return AsyncTaskResult(
                    task_id=task_id,
                    status="timeout",
                    error="Task timed out",
                    execution_time=execution_time
                )
                
            except Exception as e:
                execution_time = time.time() - start_time
                return AsyncTaskResult(
                    task_id=task_id,
                    status="error",
                    error=str(e),
                    execution_time=execution_time
                )

    async def execute_parallel_tasks(
        self,
        tasks: Dict[str, Awaitable],
        timeout: Optional[float] = None
    ) -> Dict[str, AsyncTaskResult]:
        """
        Execute multiple tasks in parallel.
        
        Args:
            tasks: Dictionary of task_id -> coroutine
            timeout: Optional timeout for all tasks
            
        Returns:
            Dictionary of task results
        """
        if not tasks:
            return {}

        # Create task executions
        task_executions = {
            task_id: self.execute_task(task_id, coro, timeout)
            for task_id, coro in tasks.items()
        }
        
        # Execute all tasks
        results = await asyncio.gather(*task_executions.values(), return_exceptions=True)
        
        # Map results back to task IDs
        result_dict = {}
        for (task_id, _), result in zip(task_executions.items(), results):
            if isinstance(result, AsyncTaskResult):
                result_dict[task_id] = result
            else:
                # Handle unexpected exceptions
                result_dict[task_id] = AsyncTaskResult(
                    task_id=task_id,
                    status="error",
                    error=str(result)
                )
        
        return result_dict

    async def execute_sequential_tasks(
        self,
        tasks: List[tuple[str, Awaitable]],
        stop_on_error: bool = False
    ) -> List[AsyncTaskResult]:
        """
        Execute tasks sequentially.
        
        Args:
            tasks: List of (task_id, coroutine) tuples
            stop_on_error: Whether to stop execution on first error
            
        Returns:
            List of task results in execution order
        """
        results = []
        
        for task_id, coro in tasks:
            result = await self.execute_task(task_id, coro)
            results.append(result)
            
            if stop_on_error and result.status == "error":
                logger.warning(f"Stopping sequential execution due to error in task {task_id}")
                break
        
        return results

    def start_background_task(self, task_id: str, coro: Awaitable) -> asyncio.Task:
        """
        Start a background task.
        
        Args:
            task_id: Unique task identifier
            coro: Coroutine to execute
            
        Returns:
            Started asyncio Task
        """
        if task_id in self.active_tasks:
            logger.warning(f"Task {task_id} is already running")
            return self.active_tasks[task_id]
        
        async def task_wrapper():
            try:
                result = await coro
                logger.info(f"Background task {task_id} completed successfully")
                return result
            except Exception as e:
                logger.error(f"Background task {task_id} failed: {e}")
                raise
            finally:
                self.active_tasks.pop(task_id, None)
        
        task = asyncio.create_task(task_wrapper())
        self.active_tasks[task_id] = task
        
        return task

    async def wait_for_background_tasks(self, task_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Wait for background tasks to complete.
        
        Args:
            task_ids: Optional list of specific task IDs to wait for
            
        Returns:
            Results of completed tasks
        """
        if task_ids:
            tasks_to_wait = {tid: task for tid, task in self.active_tasks.items() if tid in task_ids}
        else:
            tasks_to_wait = self.active_tasks.copy()
        
        if not tasks_to_wait:
            return {}
        
        results = await asyncio.gather(*tasks_to_wait.values(), return_exceptions=True)
        
        return {
            task_id: result 
            for (task_id, _), result in zip(tasks_to_wait.items(), results)
        }


def async_tool_wrapper(func: Callable) -> Callable:
    """
    Decorator to wrap sync functions for async execution.
    
    Args:
        func: Function to wrap
        
    Returns:
        Async wrapper function
    """
    @wraps(func)
    async def async_wrapper(*args, **kwargs):
        loop = asyncio.get_event_loop()
        
        # Use thread pool for CPU-bound tasks
        with concurrent.futures.ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(executor, func, *args, **kwargs)
            return result
    
    return async_wrapper


def run_async(coro: Awaitable) -> Any:
    """
    Run async coroutine in sync context.
    
    Args:
        coro: Coroutine to run
        
    Returns:
        Coroutine result
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in an async context, create a new task
            return asyncio.create_task(coro)
        else:
            return loop.run_until_complete(coro)
    except RuntimeError:
        # No event loop in current thread
        return asyncio.run(coro)


# Global instances
async_db_manager = AsyncDatabaseManager()
async_http_client = AsyncHTTPClient()
async_task_orchestrator = AsyncTaskOrchestrator()


# Cleanup function
async def cleanup_async_resources():
    """Clean up all async resources."""
    await async_db_manager.close()
    await async_http_client.close()
    logger.info("Async resources cleaned up")