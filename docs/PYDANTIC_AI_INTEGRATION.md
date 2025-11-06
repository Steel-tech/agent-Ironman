# Pydantic AI Integration Guide

## Overview

Agent Ironman now includes **Pydantic AI** for type-safe, multi-model Python agents with validated inputs and outputs. This integration enables:

- ✅ **Type Safety**: All LLM outputs validated against Pydantic schemas
- 🔄 **Multi-Model Support**: Switch between Claude and GPT-4
- 🛡️ **Error Prevention**: Catch malformed responses at runtime
- 📊 **Data Analysis**: Python-native ML and data science workflows
- ⏱️ **Durable Execution**: Long-running tasks with checkpointing

## Quick Start

### 1. Environment Setup

Add to your `.env` file:

```bash
# Required for Claude (already configured)
ANTHROPIC_API_KEY=sk-ant-...

# Optional: For multi-model support (GPT-4)
OPENAI_API_KEY=sk-...
ENABLE_MULTI_MODEL=true

# Pydantic AI Settings
PYDANTIC_AI_LOG_LEVEL=INFO
```

### 2. Install Python Dependencies

```bash
cd /path/to/agent-ironman-app
pip install -r requirements.txt
```

This installs:
- `pydantic-ai` - Core Pydantic AI framework
- `pydantic-ai-slim` - Lightweight version
- `openai` - OpenAI SDK for multi-model support

### 3. Start Celery Worker

```bash
cd python-worker
celery -A worker worker --loglevel=info
```

## Usage Examples

### From TypeScript/Bun Code

```typescript
import { AITasks } from './server/taskQueue';

// 1. Analyze Code Quality (Claude)
const codeAnalysis = await AITasks.analyzeCodeWithPydantic(
  `
  function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += items[i].price;
    }
    return total;
  }
  `,
  'javascript',
  {
    context: 'E-commerce shopping cart',
    useOpenAI: false // Use Claude (default)
  }
);

// Result is type-safe and validated:
// {
//   quality_score: 75.5,
//   issues: [
//     { severity: "medium", category: "performance", message: "..." },
//     ...
//   ],
//   recommendations: ["Add input validation", "Use reduce()"],
//   ...
// }


// 2. Analyze Data with GPT-4
const dataAnalysis = await AITasks.analyzeDataWithPydantic(
  "E-commerce sales data for Q4 2024",
  {
    datasetSummary: "10,000 transactions, $2.5M revenue, 5 product categories",
    specificQuestions: [
      "What are the top performing products?",
      "Are there any seasonal trends?"
    ],
    useOpenAI: true // Use GPT-4o-mini for cost optimization
  }
);

// Result is validated against DataAnalysisResult schema


// 3. Compare Claude vs GPT-4 Side-by-Side
const comparison = await AITasks.compareModels(
  `const api = fetch('/api/user')`,
  'javascript'
);

// Returns analysis from both models for comparison


// 4. Batch Validate Multiple Files
const batchResults = await AITasks.batchValidateCode([
  { filename: 'auth.js', code: '...', language: 'javascript' },
  { filename: 'database.py', code: '...', language: 'python' },
  { filename: 'api.ts', code: '...', language: 'typescript' }
]);

// Returns aggregated metrics + per-file results


// 5. Long-Running Task with Checkpointing
const taskResult = await AITasks.runLongTask(
  "Analyze all Python files in the project for security vulnerabilities"
);

// Can resume if interrupted:
const resumed = await AITasks.runLongTask(
  "Continue security analysis",
  taskResult.checkpoint_data
);
```

### Direct Celery Task Queue

```typescript
import { taskQueue } from './server/taskQueue';

// More control over task parameters
const result = await taskQueue.enqueuePydanticCodeAnalysis(
  code,
  'python',
  'Security-critical authentication module',
  false // Use Claude
);

console.log('Task ID:', result.taskId);
console.log('Status:', result.status); // "queued"
```

## Python Schemas

All agent outputs are validated against Pydantic schemas defined in `python-worker/schemas/agent_schemas.py`:

### CodeAnalysisResult

```python
class CodeAnalysisResult(BaseModel):
    quality_score: float  # 0-100
    issues: List[CodeQualityIssue]
    recommendations: List[str]
    complexity_score: Optional[float]
    test_coverage: Optional[float]
    metadata: Dict[str, Any]
```

### CodeQualityIssue

```python
class CodeQualityIssue(BaseModel):
    severity: Literal["critical", "high", "medium", "low", "info"]
    category: str  # "security", "performance", "maintainability", etc.
    message: str
    line_number: Optional[int]
    suggestion: Optional[str]
```

### DataAnalysisResult

```python
class DataAnalysisResult(BaseModel):
    summary: str
    insights: List[DataInsight]
    statistics: Dict[str, Any]
    visualizations: List[str]
    recommendations: List[str]
    data_quality_score: Optional[float]
```

### LongRunningTaskResult

```python
class LongRunningTaskResult(BaseModel):
    task_id: str
    status: TaskStatus  # pending, in_progress, completed, failed
    progress_percentage: float  # 0-100
    current_step: str
    steps_completed: int
    total_steps: int
    result: Optional[Dict[str, Any]]
    error_message: Optional[str]
    checkpoint_data: Dict[str, Any]
```

## Model Selection

### When to Use Claude (Default)

- General-purpose code analysis
- Complex reasoning tasks
- Long-form text generation
- Most cost-effective for general use

### When to Use GPT-4

- Vision/multimodal tasks (future)
- Specific OpenAI features needed
- Comparing model outputs
- Cost optimization with GPT-4o-mini for simple tasks

## Architecture

```
TypeScript/Bun Server
    ↓
AITasks.analyzeCodeWithPydantic()
    ↓
taskQueue.enqueuePydanticCodeAnalysis()
    ↓
Redis (Celery queue)
    ↓
Python Celery Worker
    ↓
pydantic_tasks.analyze_code_task()
    ↓
CodeAnalysisAgent (Pydantic AI)
    ↓
Claude API or OpenAI API
    ↓
Pydantic Validation (CodeAnalysisResult schema)
    ↓
Return validated result to TypeScript
```

## Error Handling

```typescript
try {
  const result = await AITasks.analyzeCodeWithPydantic(code);

  if (result.status === 'error') {
    console.error('Task failed:', result.error);
    return;
  }

  // Result is guaranteed to match CodeAnalysisResult schema
  console.log('Quality Score:', result.result.quality_score);

} catch (error) {
  // Network or queue errors
  console.error('Failed to enqueue task:', error);
}
```

## Benefits Over Direct LLM Calls

| Feature | Direct LLM | Pydantic AI |
|---------|-----------|-------------|
| Type Safety | ❌ No | ✅ Validated |
| Error Detection | Runtime | Build Time |
| Multi-Model | Manual | Built-in |
| Durable Tasks | Custom | Built-in |
| Observability | Custom | OpenTelemetry |
| Schema Evolution | Manual | Automatic |

## Future Enhancements

- ✅ Vision agents with GPT-4o (planned)
- ✅ Gemini integration (supported by Pydantic AI)
- ✅ Agent handoffs and coordination
- ✅ Streaming responses with validation
- ✅ Cost tracking per model

## Troubleshooting

### Pydantic AI imports failing

```bash
# Install dependencies
pip install -r requirements.txt
```

### Redis connection errors

```bash
# Start Redis (macOS)
brew services start redis

# Or Docker
docker run -d -p 6379:6379 redis
```

### Celery worker not processing tasks

```bash
# Check worker is running
celery -A python_worker.worker inspect active

# Restart worker
celery -A python_worker.worker worker --loglevel=info
```

### OpenAI API key not working

```bash
# Verify .env has the key
cat .env | grep OPENAI_API_KEY

# Enable multi-model support
export ENABLE_MULTI_MODEL=true
```

## Additional Resources

- [Pydantic AI Documentation](https://ai.pydantic.dev/)
- [Agent Ironman Main README](../README.md)
- [Python Worker Setup](../python-worker/README.md)
