"""
Pydantic schemas for type-safe agent inputs and outputs
Ensures all LLM responses are validated against these models
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    """Status of long-running tasks"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class CodeQualityIssue(BaseModel):
    """Individual code quality issue"""
    severity: Literal["critical", "high", "medium", "low", "info"] = Field(
        description="Severity level of the issue"
    )
    category: str = Field(
        description="Category (security, performance, maintainability, etc.)"
    )
    message: str = Field(
        description="Human-readable description of the issue"
    )
    line_number: Optional[int] = Field(
        None,
        description="Line number where issue occurs (if applicable)"
    )
    suggestion: Optional[str] = Field(
        None,
        description="Suggested fix or improvement"
    )


class CodeAnalysisResult(BaseModel):
    """Type-safe output from code analysis agent"""
    quality_score: float = Field(
        ge=0.0,
        le=100.0,
        description="Overall code quality score (0-100)"
    )
    issues: List[CodeQualityIssue] = Field(
        default_factory=list,
        description="List of detected issues"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="High-level recommendations for improvement"
    )
    complexity_score: Optional[float] = Field(
        None,
        ge=0.0,
        description="Cyclomatic complexity or similar metric"
    )
    test_coverage: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Estimated test coverage percentage"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata from analysis"
    )

    @field_validator('quality_score')
    @classmethod
    def validate_quality_score(cls, v: float) -> float:
        """Ensure quality score is within valid range"""
        if not 0.0 <= v <= 100.0:
            raise ValueError("Quality score must be between 0 and 100")
        return round(v, 2)


class DataInsight(BaseModel):
    """Individual insight from data analysis"""
    insight_type: Literal["trend", "anomaly", "correlation", "summary"] = Field(
        description="Type of insight discovered"
    )
    title: str = Field(
        description="Short title for the insight"
    )
    description: str = Field(
        description="Detailed description of the finding"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence level in this insight (0-1)"
    )
    supporting_data: Optional[Dict[str, Any]] = Field(
        None,
        description="Supporting data or statistics"
    )


class DataAnalysisResult(BaseModel):
    """Type-safe output from data analysis agent"""
    summary: str = Field(
        description="High-level summary of the analysis"
    )
    insights: List[DataInsight] = Field(
        default_factory=list,
        description="Key insights discovered"
    )
    statistics: Dict[str, Any] = Field(
        default_factory=dict,
        description="Statistical measurements"
    )
    visualizations: List[str] = Field(
        default_factory=list,
        description="Paths to generated visualization files"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Actionable recommendations based on analysis"
    )
    data_quality_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Assessment of input data quality"
    )


class LongRunningTaskResult(BaseModel):
    """Type-safe output for long-running tasks with checkpoints"""
    task_id: str = Field(
        description="Unique identifier for the task"
    )
    status: TaskStatus = Field(
        description="Current status of the task"
    )
    progress_percentage: float = Field(
        ge=0.0,
        le=100.0,
        description="Completion percentage (0-100)"
    )
    current_step: str = Field(
        description="Description of current processing step"
    )
    steps_completed: int = Field(
        ge=0,
        description="Number of steps completed"
    )
    total_steps: int = Field(
        ge=1,
        description="Total number of steps"
    )
    result: Optional[Dict[str, Any]] = Field(
        None,
        description="Final result (only when status=COMPLETED)"
    )
    error_message: Optional[str] = Field(
        None,
        description="Error details (only when status=FAILED)"
    )
    checkpoint_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Data for resuming from this point"
    )
    started_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="When the task started"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Last update time"
    )


class MLModelEvaluation(BaseModel):
    """Type-safe output for ML model evaluation"""
    model_type: str = Field(
        description="Type of ML model (e.g., 'classification', 'regression')"
    )
    accuracy: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Model accuracy (0-1)"
    )
    precision: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Precision score"
    )
    recall: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Recall score"
    )
    f1_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="F1 score"
    )
    confusion_matrix: Optional[List[List[int]]] = Field(
        None,
        description="Confusion matrix for classification"
    )
    feature_importance: Optional[Dict[str, float]] = Field(
        None,
        description="Feature importance scores"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Recommendations for model improvement"
    )
