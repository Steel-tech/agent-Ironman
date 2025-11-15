"""
Claude Agent SDK Client Service
Handles code execution and file operations via Claude Code CLI
"""

import logging
from typing import Dict, Any, Optional, List
from pathlib import Path

try:
    from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, query, CLINotFoundError  # type: ignore
    SDK_AVAILABLE = True
except ImportError as e:
    SDK_AVAILABLE = False
    _import_error = str(e)
    # Define dummy classes to avoid NameError
    ClaudeSDKClient = None
    ClaudeAgentOptions = None
    query = None
    CLINotFoundError = Exception

try:
    from ..config import settings
except ImportError:
    try:
        # Fallback if config module not found
        from config import settings
    except ImportError:
        # Create minimal settings object if no config available
        class Settings:
            def __init__(self):
                import os
                self.anthropic_api_key = os.environ.get('ANTHROPIC_API_KEY')
                self.claude_sdk_permission_mode = os.environ.get('CLAUDE_SDK_PERMISSION_MODE', 'plan')
                self.claude_sdk_working_dir = os.environ.get('CLAUDE_SDK_WORKING_DIR', '.')
                self.claude_code_cli_path = os.environ.get('CLAUDE_CODE_CLI_PATH')
        
        settings = Settings()

logger = logging.getLogger(__name__)


class ClaudeAgentClient:
    """Wrapper for Claude Agent SDK with connection management"""

    def __init__(self):
        """Initialize Claude Agent SDK client"""
        if not SDK_AVAILABLE:
            logger.warning(
                f"Claude Agent SDK not available: {_import_error}. "
                "SDK features will be disabled."
            )
            self.available = False
            return

        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")

        # Verify Claude Code CLI is available
        try:
            # Test import to catch CLI not found early
            _ = ClaudeSDKClient
            self.available = True
            logger.info("Claude Agent SDK initialized successfully")
        except (NameError, CLINotFoundError) as e:
            logger.error(
                f"Claude Code CLI not found: {e}. "
                "Please install: npm install -g @anthropic-ai/claude-code"
            )
            self.available = False

        # Store default options
        self.default_options = {
            "permission_mode": settings.claude_sdk_permission_mode,
            "max_turns": 10,  # Default max conversation turns
            "cwd": settings.claude_sdk_working_dir,
        }

        if settings.claude_code_cli_path:
            self.default_options["cli_path"] = settings.claude_code_cli_path

    def is_available(self) -> bool:
        """Check if SDK is available and configured"""
        return self.available

    async def query_simple(
        self,
        prompt: str,
        working_dir: Optional[str] = None,
        max_turns: Optional[int] = None,
        permission_mode: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Simple one-shot query to Claude Code

        Args:
            prompt: The task/question for Claude
            working_dir: Directory for file operations
            max_turns: Max conversation turns
            permission_mode: Permission mode for operations

        Returns:
            Dict with response and metadata
        """
        if not self.available:
            raise RuntimeError("Claude Agent SDK is not available")

        try:
            # Build options
            options = ClaudeAgentOptions(
                permission_mode=permission_mode or self.default_options["permission_mode"],
                max_turns=max_turns or self.default_options["max_turns"],
            )

            if working_dir:
                options.cwd = working_dir
            elif "cwd" in self.default_options:
                options.cwd = self.default_options["cwd"]

            # Execute query - returns async iterator of messages
            logger.info(f"Executing SDK query with permission mode: {options.permission_mode}")
            messages = []
            async for message in query(prompt=prompt, options=options):
                messages.append(message)

            # Extract response content from messages
            response_text = ""
            for msg in messages:
                if hasattr(msg, 'content'):
                    if isinstance(msg.content, list):
                        response_text += "\n".join([
                            item.get("text", "") if isinstance(item, dict) else str(item)
                            for item in msg.content
                        ])
                    else:
                        response_text += str(msg.content)

            return {
                "status": "success",
                "text": response_text.strip(),
                "messages": messages,
                "message_count": len(messages)
            }

        except CLINotFoundError as e:
            logger.error(f"Claude Code CLI not found: {e}")
            return {
                "status": "error",
                "error": "cli_not_found",
                "message": str(e)
            }
        except Exception as e:
            logger.error(f"SDK query failed: {e}")
            return {
                "status": "error",
                "error": "query_failed",
                "message": str(e)
            }

    async def execute_code_task(
        self,
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
        if not self.available:
            raise RuntimeError("Claude Agent SDK is not available")

        # Build prompt with file context
        prompt = task_description
        if files_to_modify:
            file_list = ", ".join(files_to_modify)
            prompt += f"\n\nExpected files: {file_list}"

        permission_mode = "acceptEdits" if auto_accept else "plan"

        return await self.query_simple(
            prompt=prompt,
            working_dir=working_dir,
            permission_mode=permission_mode
        )

    async def analyze_codebase(
        self,
        analysis_prompt: str,
        directory: Optional[str] = None,
        file_patterns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Analyze codebase with read-only operations

        Args:
            analysis_prompt: What to analyze
            directory: Directory to analyze
            file_patterns: File patterns to focus on (e.g., ["*.py", "*.ts"])

        Returns:
            Dict with analysis results
        """
        if not self.available:
            raise RuntimeError("Claude Agent SDK is not available")

        prompt = analysis_prompt
        if file_patterns:
            patterns = ", ".join(file_patterns)
            prompt += f"\n\nFocus on files matching: {patterns}"

        # Use plan mode for read-only analysis
        return await self.query_simple(
            prompt=prompt,
            working_dir=directory,
            permission_mode="plan"
        )

    async def run_tests(
        self,
        test_command: str,
        working_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run tests and analyze results

        Args:
            test_command: Command to run tests (e.g., "pytest", "npm test")
            working_dir: Directory to run tests in

        Returns:
            Dict with test results and analysis
        """
        if not self.available:
            raise RuntimeError("Claude Agent SDK is not available")

        prompt = f"Run the following test command and analyze the results:\n{test_command}"

        return await self.query_simple(
            prompt=prompt,
            working_dir=working_dir,
            permission_mode="plan"  # Read-only for test execution
        )


# Singleton instance (lazy initialization to avoid errors on import)
_claude_agent_client = None


def get_claude_agent_client() -> ClaudeAgentClient:
    """Get or create singleton Claude Agent client"""
    global _claude_agent_client
    if _claude_agent_client is None:
        _claude_agent_client = ClaudeAgentClient()
    return _claude_agent_client
