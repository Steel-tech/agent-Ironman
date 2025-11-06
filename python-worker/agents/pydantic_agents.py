"""
Pydantic AI Agents - Type-safe, multi-model AI agents
Demonstrates Claude + GPT-4 support with validated I/O
"""

import logging
from typing import Optional
from pydantic_ai import Agent
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIModel

from config import settings
from schemas.agent_schemas import (
    CodeAnalysisResult,
    CodeQualityIssue,
    DataAnalysisResult,
    DataInsight,
    LongRunningTaskResult,
    TaskStatus
)

logger = logging.getLogger(__name__)


class CodeAnalysisAgent:
    """
    Type-safe code analysis agent using Pydantic AI
    Supports both Claude and GPT-4 with validated outputs
    """

    def __init__(self, use_openai: bool = False):
        """
        Initialize code analysis agent

        Args:
            use_openai: If True, use GPT-4; otherwise use Claude
        """
        self.use_openai = use_openai and settings.enable_multi_model

        # Select model based on configuration
        if self.use_openai and settings.openai_api_key:
            model = OpenAIModel(
                'gpt-4o',
                api_key=settings.openai_api_key
            )
            logger.info("Code analysis agent using GPT-4o")
        else:
            model = AnthropicModel(
                'claude-3-5-sonnet-20241022',
                api_key=settings.anthropic_api_key
            )
            logger.info("Code analysis agent using Claude 3.5 Sonnet")

        # Create type-safe agent with Pydantic result validation
        self.agent = Agent(
            model,
            result_type=CodeAnalysisResult,
            system_prompt="""You are an expert code quality analyzer.
Analyze code for:
- Security vulnerabilities
- Performance issues
- Code maintainability
- Best practices violations
- Potential bugs

Provide a quality score (0-100), list specific issues with severity levels,
and give actionable recommendations."""
        )

    async def analyze_code(
        self,
        code: str,
        language: Optional[str] = None,
        context: Optional[str] = None
    ) -> CodeAnalysisResult:
        """
        Analyze code quality with type-safe output

        Args:
            code: Source code to analyze
            language: Programming language (optional, will be inferred)
            context: Additional context about the code

        Returns:
            CodeAnalysisResult with validated structure
        """
        try:
            prompt = f"""Analyze the following code:

Language: {language or 'auto-detect'}
Context: {context or 'None provided'}

Code:
```
{code}
```

Provide a comprehensive analysis with quality score, issues, and recommendations."""

            # Run agent - Pydantic AI validates output against CodeAnalysisResult schema
            result = await self.agent.run(prompt)

            logger.info(
                f"Code analysis complete - Quality Score: {result.data.quality_score}, "
                f"Issues: {len(result.data.issues)}"
            )

            return result.data

        except Exception as e:
            logger.error(f"Code analysis failed: {e}")
            raise


class DataAnalysisAgent:
    """
    Type-safe data analysis agent using Pydantic AI
    Ideal for structured data insights with validated outputs
    """

    def __init__(self, use_openai: bool = False):
        """
        Initialize data analysis agent

        Args:
            use_openai: If True, use GPT-4; otherwise use Claude
        """
        self.use_openai = use_openai and settings.enable_multi_model

        if self.use_openai and settings.openai_api_key:
            model = OpenAIModel(
                'gpt-4o-mini',  # Cost-optimized for data analysis
                api_key=settings.openai_api_key
            )
            logger.info("Data analysis agent using GPT-4o-mini")
        else:
            model = AnthropicModel(
                'claude-3-5-sonnet-20241022',
                api_key=settings.anthropic_api_key
            )
            logger.info("Data analysis agent using Claude 3.5 Sonnet")

        self.agent = Agent(
            model,
            result_type=DataAnalysisResult,
            system_prompt="""You are a data analysis expert.
Analyze datasets to find:
- Key trends and patterns
- Anomalies and outliers
- Correlations between variables
- Statistical insights
- Actionable recommendations

Provide clear, validated insights with confidence scores."""
        )

    async def analyze_data(
        self,
        data_description: str,
        dataset_summary: Optional[str] = None,
        specific_questions: Optional[list[str]] = None
    ) -> DataAnalysisResult:
        """
        Analyze data with type-safe output

        Args:
            data_description: Description of the dataset
            dataset_summary: Statistical summary of data
            specific_questions: Specific questions to answer

        Returns:
            DataAnalysisResult with validated structure
        """
        try:
            prompt = f"""Analyze this dataset:

Description: {data_description}

Dataset Summary:
{dataset_summary or 'Not provided'}

Specific Questions:
{', '.join(specific_questions) if specific_questions else 'General analysis'}

Provide comprehensive insights, statistics, and recommendations."""

            result = await self.agent.run(prompt)

            logger.info(
                f"Data analysis complete - Insights: {len(result.data.insights)}"
            )

            return result.data

        except Exception as e:
            logger.error(f"Data analysis failed: {e}")
            raise


class LongRunningTaskAgent:
    """
    Durable execution agent for long-running tasks
    Supports checkpointing and resumption
    """

    def __init__(self):
        """Initialize long-running task agent"""
        model = AnthropicModel(
            'claude-3-5-sonnet-20241022',
            api_key=settings.anthropic_api_key
        )

        self.agent = Agent(
            model,
            result_type=LongRunningTaskResult,
            system_prompt="""You are a task orchestration expert.
Break down complex tasks into manageable steps.
Provide progress updates and checkpoint data for resumption.
Track status accurately and handle errors gracefully."""
        )

    async def execute_task(
        self,
        task_id: str,
        task_description: str,
        checkpoint_data: Optional[dict] = None
    ) -> LongRunningTaskResult:
        """
        Execute or resume a long-running task

        Args:
            task_id: Unique task identifier
            task_description: What the task should accomplish
            checkpoint_data: Previous checkpoint (for resumption)

        Returns:
            LongRunningTaskResult with current status and progress
        """
        try:
            resume_info = ""
            if checkpoint_data:
                resume_info = f"\n\nResuming from checkpoint: {checkpoint_data}"

            prompt = f"""Execute the following task:

Task ID: {task_id}
Description: {task_description}{resume_info}

Track your progress and provide checkpoint data for potential resumption.
Update the status and progress percentage accurately."""

            result = await self.agent.run(prompt)

            logger.info(
                f"Task {task_id} - Status: {result.data.status}, "
                f"Progress: {result.data.progress_percentage}%"
            )

            return result.data

        except Exception as e:
            logger.error(f"Task execution failed: {e}")
            raise


# Singleton instances (lazy-loaded)
_code_analyzer: Optional[CodeAnalysisAgent] = None
_data_analyzer: Optional[DataAnalysisAgent] = None
_task_runner: Optional[LongRunningTaskAgent] = None


def get_code_analyzer(use_openai: bool = False) -> CodeAnalysisAgent:
    """Get singleton code analysis agent"""
    global _code_analyzer
    if _code_analyzer is None or _code_analyzer.use_openai != use_openai:
        _code_analyzer = CodeAnalysisAgent(use_openai=use_openai)
    return _code_analyzer


def get_data_analyzer(use_openai: bool = False) -> DataAnalysisAgent:
    """Get singleton data analysis agent"""
    global _data_analyzer
    if _data_analyzer is None or _data_analyzer.use_openai != use_openai:
        _data_analyzer = DataAnalysisAgent(use_openai=use_openai)
    return _data_analyzer


def get_task_runner() -> LongRunningTaskAgent:
    """Get singleton long-running task agent"""
    global _task_runner
    if _task_runner is None:
        _task_runner = LongRunningTaskAgent()
    return _task_runner
