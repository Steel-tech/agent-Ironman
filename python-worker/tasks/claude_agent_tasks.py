"""
Claude Agent SDK Tasks for Celery
Code execution and file operation tasks using Claude Code CLI
"""

from celery import Task
from typing import Dict, Any, Optional, List
import logging

from python_worker.worker import app
from python_worker.services.claude_agent_client import get_claude_agent_client

logger = logging.getLogger(__name__)


@app.task(bind=True, name="claude_agent.query")
async def claude_agent_query_task(
    self: Task,
    prompt: str,
    working_dir: Optional[str] = None,
    max_tokens: Optional[int] = None,
    permission_mode: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute a simple query using Claude Agent SDK

    Args:
        prompt: The task/question for Claude Code
        working_dir: Directory for file operations
        max_tokens: Max tokens for response
        permission_mode: Permission mode ("plan", "acceptEdits", "default")

    Returns:
        Dict with response and metadata
    """
    try:
        logger.info(f"Starting Claude Agent SDK query (task_id: {self.request.id})")

        # Get Claude Agent client
        client = get_claude_agent_client()

        if not client.is_available():
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": "sdk_unavailable",
                "message": "Claude Agent SDK is not available. Please install claude-agent-sdk and Claude Code CLI."
            }

        # Execute query
        result = await client.query_simple(
            prompt=prompt,
            working_dir=working_dir,
            max_tokens=max_tokens,
            permission_mode=permission_mode
        )

        return {
            **result,
            "task_id": self.request.id
        }

    except Exception as e:
        logger.error(f"Claude Agent query task failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": "task_failed",
            "message": str(e)
        }


@app.task(bind=True, name="claude_agent.execute_code")
async def execute_code_task(
    self: Task,
    task_description: str,
    files_to_modify: Optional[List[str]] = None,
    working_dir: Optional[str] = None,
    auto_accept: bool = False
) -> Dict[str, Any]:
    """
    Execute a code-related task with file operations

    Args:
        task_description: What code task to perform
        files_to_modify: Expected files to be created/modified
        working_dir: Working directory for operations
        auto_accept: Whether to auto-accept file edits

    Returns:
        Dict with task results and file changes
    """
    try:
        logger.info(
            f"Starting code execution task (task_id: {self.request.id}, "
            f"auto_accept: {auto_accept})"
        )

        client = get_claude_agent_client()

        if not client.is_available():
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": "sdk_unavailable",
                "message": "Claude Agent SDK is not available"
            }

        result = await client.execute_code_task(
            task_description=task_description,
            files_to_modify=files_to_modify,
            working_dir=working_dir,
            auto_accept=auto_accept
        )

        return {
            **result,
            "task_id": self.request.id
        }

    except Exception as e:
        logger.error(f"Code execution task failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": "task_failed",
            "message": str(e)
        }


@app.task(bind=True, name="claude_agent.analyze_codebase")
async def analyze_codebase_task(
    self: Task,
    analysis_prompt: str,
    directory: Optional[str] = None,
    file_patterns: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Analyze codebase with read-only operations

    Args:
        analysis_prompt: What to analyze in the codebase
        directory: Directory to analyze
        file_patterns: File patterns to focus on (e.g., ["*.py", "*.ts"])

    Returns:
        Dict with analysis results
    """
    try:
        logger.info(f"Starting codebase analysis (task_id: {self.request.id})")

        client = get_claude_agent_client()

        if not client.is_available():
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": "sdk_unavailable",
                "message": "Claude Agent SDK is not available"
            }

        result = await client.analyze_codebase(
            analysis_prompt=analysis_prompt,
            directory=directory,
            file_patterns=file_patterns
        )

        return {
            **result,
            "task_id": self.request.id
        }

    except Exception as e:
        logger.error(f"Codebase analysis task failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": "task_failed",
            "message": str(e)
        }


@app.task(bind=True, name="claude_agent.run_tests")
async def run_tests_task(
    self: Task,
    test_command: str,
    working_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run tests and analyze results using Claude Agent SDK

    Args:
        test_command: Command to run tests (e.g., "pytest", "npm test")
        working_dir: Directory to run tests in

    Returns:
        Dict with test results and analysis
    """
    try:
        logger.info(f"Starting test execution (task_id: {self.request.id})")

        client = get_claude_agent_client()

        if not client.is_available():
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": "sdk_unavailable",
                "message": "Claude Agent SDK is not available"
            }

        result = await client.run_tests(
            test_command=test_command,
            working_dir=working_dir
        )

        return {
            **result,
            "task_id": self.request.id
        }

    except Exception as e:
        logger.error(f"Test execution task failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": "task_failed",
            "message": str(e)
        }


@app.task(bind=True, name="claude_agent.file_operations")
async def file_operations_task(
    self: Task,
    operation: str,
    files: List[str],
    content: Optional[str] = None,
    working_dir: Optional[str] = None
) -> Dict[str, Any]:
    """
    Perform file operations using Claude Agent SDK

    Args:
        operation: Type of operation ("read", "write", "edit", "analyze")
        files: List of file paths
        content: Content for write operations
        working_dir: Working directory

    Returns:
        Dict with operation results
    """
    try:
        logger.info(
            f"Starting file operation: {operation} (task_id: {self.request.id})"
        )

        client = get_claude_agent_client()

        if not client.is_available():
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": "sdk_unavailable",
                "message": "Claude Agent SDK is not available"
            }

        # Build prompt based on operation type
        if operation == "read":
            prompt = f"Read and summarize the following files:\n" + "\n".join(files)
        elif operation == "write":
            prompt = f"Write the following content to {files[0]}:\n\n{content}"
        elif operation == "edit":
            prompt = f"Edit the following files as described:\n{content}\n\nFiles: " + ", ".join(files)
        elif operation == "analyze":
            prompt = f"Analyze the following files:\n" + "\n".join(files)
        else:
            return {
                "status": "error",
                "task_id": self.request.id,
                "error": "invalid_operation",
                "message": f"Unknown operation: {operation}"
            }

        # Execute with appropriate permission mode
        permission_mode = "acceptEdits" if operation in ["write", "edit"] else "plan"

        result = await client.query_simple(
            prompt=prompt,
            working_dir=working_dir,
            permission_mode=permission_mode
        )

        return {
            **result,
            "task_id": self.request.id,
            "operation": operation,
            "files": files
        }

    except Exception as e:
        logger.error(f"File operation task failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": "task_failed",
            "message": str(e)
        }
