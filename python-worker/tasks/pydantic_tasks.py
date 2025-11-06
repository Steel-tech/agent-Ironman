"""
Pydantic AI Agent Tasks for Celery
Type-safe tasks with validated inputs and outputs
"""

from celery import Task
from typing import Dict, Any, Optional, List
import logging
import json

from python_worker.worker import app
from python_worker.agents.pydantic_agents import (
    get_code_analyzer,
    get_data_analyzer,
    get_task_runner
)
from python_worker.schemas.agent_schemas import (
    CodeAnalysisResult,
    DataAnalysisResult,
    LongRunningTaskResult
)

logger = logging.getLogger(__name__)


@app.task(bind=True, name="pydantic.analyze_code")
async def analyze_code_task(
    self: Task,
    code: str,
    language: Optional[str] = None,
    context: Optional[str] = None,
    use_openai: bool = False
) -> Dict[str, Any]:
    """
    Analyze code quality with type-safe Pydantic AI agent

    Args:
        code: Source code to analyze
        language: Programming language (auto-detected if not provided)
        context: Additional context about the code
        use_openai: Use GPT-4 instead of Claude

    Returns:
        Dict with validated CodeAnalysisResult
    """
    try:
        logger.info(
            f"Starting code analysis (model: {'GPT-4' if use_openai else 'Claude'})"
        )

        # Get type-safe agent
        agent = get_code_analyzer(use_openai=use_openai)

        # Run analysis - output is automatically validated against schema
        result: CodeAnalysisResult = await agent.analyze_code(
            code=code,
            language=language,
            context=context
        )

        # Convert Pydantic model to dict for JSON serialization
        return {
            "status": "success",
            "task_id": self.request.id,
            "model": "gpt-4o" if use_openai else "claude-3-5-sonnet",
            "result": result.model_dump()  # Type-safe conversion
        }

    except Exception as e:
        logger.error(f"Code analysis task failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="pydantic.analyze_data")
async def analyze_data_task(
    self: Task,
    data_description: str,
    dataset_summary: Optional[str] = None,
    specific_questions: Optional[List[str]] = None,
    use_openai: bool = False
) -> Dict[str, Any]:
    """
    Analyze data with type-safe Pydantic AI agent

    Args:
        data_description: Description of the dataset
        dataset_summary: Statistical summary
        specific_questions: Specific questions to answer
        use_openai: Use GPT-4o-mini instead of Claude

    Returns:
        Dict with validated DataAnalysisResult
    """
    try:
        logger.info(
            f"Starting data analysis (model: {'GPT-4o-mini' if use_openai else 'Claude'})"
        )

        agent = get_data_analyzer(use_openai=use_openai)

        result: DataAnalysisResult = await agent.analyze_data(
            data_description=data_description,
            dataset_summary=dataset_summary,
            specific_questions=specific_questions
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "model": "gpt-4o-mini" if use_openai else "claude-3-5-sonnet",
            "result": result.model_dump()
        }

    except Exception as e:
        logger.error(f"Data analysis task failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="pydantic.run_long_task")
async def run_long_task(
    self: Task,
    task_description: str,
    checkpoint_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Execute long-running task with checkpointing support

    Args:
        task_description: What the task should accomplish
        checkpoint_data: Previous checkpoint for resumption

    Returns:
        Dict with validated LongRunningTaskResult
    """
    try:
        task_id = self.request.id
        logger.info(f"Starting long-running task {task_id}")

        agent = get_task_runner()

        result: LongRunningTaskResult = await agent.execute_task(
            task_id=task_id,
            task_description=task_description,
            checkpoint_data=checkpoint_data
        )

        # Store checkpoint data for potential resumption
        if result.status != "completed":
            logger.info(
                f"Task {task_id} at {result.progress_percentage}% - "
                f"checkpoint saved"
            )

        return {
            "status": "success",
            "task_id": task_id,
            "result": result.model_dump()
        }

    except Exception as e:
        logger.error(f"Long-running task failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="pydantic.compare_models")
async def compare_models_task(
    self: Task,
    code: str,
    language: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compare Claude vs GPT-4 code analysis side-by-side

    Args:
        code: Source code to analyze
        language: Programming language

    Returns:
        Dict with results from both models for comparison
    """
    try:
        logger.info("Running model comparison: Claude vs GPT-4")

        # Analyze with Claude
        claude_agent = get_code_analyzer(use_openai=False)
        claude_result: CodeAnalysisResult = await claude_agent.analyze_code(
            code=code,
            language=language
        )

        # Analyze with GPT-4
        gpt4_agent = get_code_analyzer(use_openai=True)
        gpt4_result: CodeAnalysisResult = await gpt4_agent.analyze_code(
            code=code,
            language=language
        )

        return {
            "status": "success",
            "task_id": self.request.id,
            "comparison": {
                "claude": {
                    "model": "claude-3-5-sonnet-20241022",
                    "quality_score": claude_result.quality_score,
                    "issues_count": len(claude_result.issues),
                    "result": claude_result.model_dump()
                },
                "gpt4": {
                    "model": "gpt-4o",
                    "quality_score": gpt4_result.quality_score,
                    "issues_count": len(gpt4_result.issues),
                    "result": gpt4_result.model_dump()
                },
                "score_difference": abs(
                    claude_result.quality_score - gpt4_result.quality_score
                )
            }
        }

    except Exception as e:
        logger.error(f"Model comparison failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }


@app.task(bind=True, name="pydantic.validate_code_batch")
async def validate_code_batch(
    self: Task,
    code_files: List[Dict[str, str]],
    use_openai: bool = False
) -> Dict[str, Any]:
    """
    Analyze multiple code files in batch

    Args:
        code_files: List of {filename, code, language} dicts
        use_openai: Use GPT-4 instead of Claude

    Returns:
        Dict with analysis results for all files
    """
    try:
        logger.info(f"Batch analyzing {len(code_files)} files")

        agent = get_code_analyzer(use_openai=use_openai)

        results = []
        total_issues = 0
        avg_quality = 0.0

        for file_data in code_files:
            filename = file_data.get("filename", "unknown")
            code = file_data["code"]
            language = file_data.get("language")

            logger.info(f"Analyzing {filename}")

            result: CodeAnalysisResult = await agent.analyze_code(
                code=code,
                language=language,
                context=f"File: {filename}"
            )

            results.append({
                "filename": filename,
                "quality_score": result.quality_score,
                "issues_count": len(result.issues),
                "critical_issues": len([
                    i for i in result.issues if i.severity == "critical"
                ]),
                "result": result.model_dump()
            })

            total_issues += len(result.issues)
            avg_quality += result.quality_score

        avg_quality = avg_quality / len(code_files) if code_files else 0

        return {
            "status": "success",
            "task_id": self.request.id,
            "model": "gpt-4o" if use_openai else "claude-3-5-sonnet",
            "summary": {
                "total_files": len(code_files),
                "total_issues": total_issues,
                "average_quality": round(avg_quality, 2),
                "files_with_critical_issues": len([
                    r for r in results if r["critical_issues"] > 0
                ])
            },
            "files": results
        }

    except Exception as e:
        logger.error(f"Batch validation failed: {e}", exc_info=True)
        return {
            "status": "error",
            "task_id": self.request.id,
            "error": str(e)
        }
