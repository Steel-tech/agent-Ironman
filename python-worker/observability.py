"""
Langfuse Observability for Python Workers
Provides LLM tracing, cost tracking, and performance monitoring
"""

import os
from typing import Optional, Dict, Any
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context


# Lazy initialization - client created in worker.py
_langfuse_client: Optional[Langfuse] = None


def set_langfuse_client(client: Optional[Langfuse]) -> None:
    """Set the global Langfuse client (called from worker.py)"""
    global _langfuse_client
    _langfuse_client = client


def get_langfuse_client() -> Optional[Langfuse]:
    """Get the global Langfuse client"""
    return _langfuse_client


def is_langfuse_enabled() -> bool:
    """Check if Langfuse is configured and enabled"""
    return _langfuse_client is not None


def create_trace(
    name: str,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
):
    """
    Create a new trace for a task execution

    Usage:
    ```python
    from python_worker.observability import create_trace

    trace = create_trace(
        name="rag_query_task",
        session_id=task_id,
        metadata={"collection": collection_name}
    )

    if trace:
        # ... perform work ...
        trace.end()
    ```
    """
    if not _langfuse_client:
        return None

    return _langfuse_client.trace(
        name=name,
        session_id=session_id,
        user_id=user_id,
        metadata={
            "application": "agent-ironman-python",
            "worker": "celery",
            **(metadata or {}),
        },
    )


def create_generation(
    trace,
    name: str,
    model: str,
    input_data: Any,
    model_parameters: Optional[Dict[str, Any]] = None,
):
    """
    Create a generation span for LLM calls within a trace

    Usage:
    ```python
    trace = create_trace("code_analysis")
    if trace:
        generation = create_generation(
            trace,
            name="claude-code-analysis",
            model="claude-3-5-sonnet-20241022",
            input_data={"code": code_snippet}
        )

        # ... make LLM call ...

        generation.end(
            output=result,
            usage={"input": 150, "output": 75}
        )
    ```
    """
    if not trace:
        return None

    return trace.generation(
        name=name,
        model=model,
        input=input_data,
        model_parameters=model_parameters,
    )


def log_event(
    trace,
    name: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log an event within a trace

    Usage:
    ```python
    trace = create_trace("document_processing")
    if trace:
        log_event(trace, "document_parsed", {"pages": 5})
        log_event(trace, "embeddings_generated", {"chunks": 12})
    ```
    """
    if not trace:
        return

    trace.event(
        name=name,
        metadata=metadata,
    )


async def flush_langfuse() -> None:
    """Flush pending Langfuse events (call on shutdown)"""
    if _langfuse_client:
        await _langfuse_client.flush_async()
        print("✅ Langfuse events flushed (Python)")


# Export the @observe decorator for automatic tracing
# Usage: @observe(name="my_function")
__all__ = [
    "set_langfuse_client",
    "get_langfuse_client",
    "is_langfuse_enabled",
    "create_trace",
    "create_generation",
    "log_event",
    "flush_langfuse",
    "observe",
    "langfuse_context",
]
