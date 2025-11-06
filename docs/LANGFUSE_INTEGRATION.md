# Langfuse Observability Integration

## Overview

Agent Ironman now includes **Langfuse** for comprehensive LLM observability, cost tracking, and performance monitoring. Langfuse provides:

- 📊 **Cost Tracking**: Monitor token usage and estimated costs per conversation
- 🔍 **Request Tracing**: Full visibility into LLM calls across TypeScript and Python
- ⏱️ **Performance Metrics**: Latency tracking and bottleneck identification
- 🐛 **Debugging**: Inspect inputs, outputs, and metadata for every LLM call
- 📈 **Analytics**: Aggregate metrics, trends, and usage patterns

**Key Features:**
- ✅ Open source (MIT License)
- ✅ Cloud-hosted or self-hosted options
- ✅ Automatic token counting and cost estimation
- ✅ Works without configuration (gracefully disabled if credentials not provided)
- ✅ Integrated with both TypeScript (main chat) and Python (background tasks)

---

## Quick Start

### 1. Sign Up for Langfuse Cloud

1. Visit [https://cloud.langfuse.com](https://cloud.langfuse.com) (EU) or [https://us.cloud.langfuse.com](https://us.cloud.langfuse.com) (US)
2. Create a free account
3. Create a new project for Agent Ironman
4. Copy your API credentials from the project settings

### 2. Configure Environment Variables

Add your credentials to `.env`:

```bash
# =============================================================================
# Langfuse Configuration (LLM Observability & Cost Tracking)
# =============================================================================
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # or https://us.cloud.langfuse.com
```

### 3. Install Python Dependencies (if not already installed)

```bash
pip install -r requirements.txt
```

This installs the Langfuse Python SDK (`langfuse>=2.0.0`).

### 4. Restart Services

```bash
# Restart the main application
bun run dev

# Restart the Python worker (if using Python tasks)
cd python-worker
celery -A worker worker --loglevel=info
```

### 5. Verify Integration

1. Start Agent Ironman and send a test message
2. Open the Langfuse dashboard at [https://cloud.langfuse.com](https://cloud.langfuse.com)
3. Navigate to **Traces** → you should see your chat session
4. Click on a trace to view:
   - Input message and system prompt
   - Output response
   - Token usage (input/output)
   - Latency and timestamps
   - Model used and parameters

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Ironman Chat                      │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  TypeScript Chat Handler (server/websocket/messageHandlers) │
│  • Creates Langfuse trace (session ID)                      │
│  • Creates generation span (before LLM call)                │
│  • Captures input, output, token usage                      │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ├─────────> Langfuse Cloud Dashboard
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Claude Agent SDK (Anthropic API)                           │
│  • Processes query                                           │
│  • Returns response with token usage                         │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│         Python Background Tasks (Optional)                   │
│  • RAG queries, document processing, multi-agent workflows   │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Python Celery Worker (python-worker/worker.py)             │
│  • Initializes Langfuse client at startup                   │
│  • Tasks can use observability helpers                      │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    └─────────> Langfuse Cloud Dashboard
```

### Automatic Instrumentation

**TypeScript (Main Chat Handler)**:
- File: `server/websocket/messageHandlers.ts`
- Automatically traces every chat query
- Captures session ID, model, permission mode
- Records token usage from Claude Agent SDK responses

**Python (Background Workers)**:
- File: `python-worker/worker.py`
- Initializes Langfuse client at startup
- Provides helper utilities in `python-worker/observability.py`
- Tasks can opt-in to tracing using helper functions

---

## Usage Examples

### TypeScript (Already Integrated)

The main chat handler is already instrumented. Every chat message automatically creates:

1. **Trace**: Unique session with metadata (model, mode, permission mode)
2. **Generation**: LLM call with input, output, and token usage

**What's Captured**:
```typescript
{
  sessionId: "unique-session-id",
  model: "claude-3-5-sonnet-20241022",
  input: {
    message: "User's message",
    systemPrompt: "Truncated system prompt..."
  },
  output: "Claude's response",
  usage: {
    input: 1250,  // input tokens
    output: 450   // output tokens
  },
  metadata: {
    permissionMode: "enabled",
    mode: "normal",
    application: "agent-ironman"
  }
}
```

### Python (Manual Instrumentation)

To add tracing to Python tasks, import the observability helpers:

```python
from python_worker.observability import create_trace, create_generation, log_event

@app.task
def my_custom_task(query: str):
    """Example task with Langfuse tracing"""

    # Create trace for this task
    trace = create_trace(
        name="custom_rag_query",
        session_id=f"task-{self.request.id}",
        metadata={"query": query[:100]}
    )

    if trace:
        # Log an event
        log_event(trace, "task_started", {"timestamp": "2024-01-01T00:00:00Z"})

        # Create generation span for LLM call
        generation = create_generation(
            trace,
            name="claude-rag-generation",
            model="claude-3-5-sonnet-20241022",
            input_data={"prompt": query}
        )

        # Make your LLM call here
        result = call_anthropic_api(query)

        # End the generation with output
        if generation:
            generation.end(
                output=result["response"],
                usage={
                    "input": result["input_tokens"],
                    "output": result["output_tokens"]
                }
            )

        # Log completion
        log_event(trace, "task_completed", {"success": True})

        # End the trace
        trace.end()

    return result
```

### Using the `@observe` Decorator

For automatic tracing of any function:

```python
from python_worker.observability import observe

@observe(name="document_parser")
def parse_document(file_path: str):
    """This function will be automatically traced"""
    # ... your code ...
    return parsed_content
```

---

## Dashboard Navigation

### Traces View

**Path**: Langfuse Dashboard → **Traces**

- View all LLM interactions chronologically
- Filter by session ID, model, or date range
- Click any trace to see full details

**What You'll See**:
- **Session ID**: Unique identifier for the conversation
- **Timestamp**: When the interaction occurred
- **Latency**: Total time from request to response
- **Tokens**: Input and output token counts
- **Cost**: Estimated cost based on model pricing

### Generation Details

Click on a trace to view the generation details:

- **Input**:
  - User message
  - Truncated system prompt
  - Model parameters
- **Output**:
  - Full Claude response
  - Token usage breakdown
- **Metadata**:
  - Permission mode
  - Session mode (normal/auto/plan)
  - Application version

### Analytics Dashboard

**Path**: Langfuse Dashboard → **Analytics**

View aggregate metrics:
- Total tokens used
- Cost over time
- Average latency per model
- Request volume trends
- Error rates

---

## Cost Tracking

Langfuse automatically estimates costs based on:
- Model pricing (Claude Sonnet, Opus, Haiku, etc.)
- Token usage (input + output)
- Real-time pricing updates from Anthropic

**Example Cost Breakdown**:
```
Model: claude-3-5-sonnet-20241022
Input tokens: 1,250 × $0.003/1K = $0.00375
Output tokens: 450 × $0.015/1K = $0.00675
Total cost: $0.01050
```

**Monthly Budget Tracking**:
- Set spending alerts in Langfuse dashboard
- Monitor cost per session
- Identify expensive queries for optimization

---

## Troubleshooting

### Traces Not Appearing

**Problem**: No traces showing in Langfuse dashboard

**Solutions**:
1. Verify credentials in `.env`:
   ```bash
   cat .env | grep LANGFUSE
   ```
2. Check console for initialization message:
   ```
   ✅ Langfuse observability initialized
   ```
3. Ensure credentials are uncommented in `.env`
4. Restart the application: `bun run dev`
5. Check Langfuse project settings for correct region (EU vs US)

### Python Worker Not Traced

**Problem**: TypeScript traces work, but Python tasks not appearing

**Solutions**:
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Restart Celery worker:
   ```bash
   cd python-worker
   celery -A worker worker --loglevel=info
   ```
3. Look for initialization message:
   ```
   ✅ Langfuse observability initialized for Python worker
   ```
4. Ensure Python tasks use observability helpers (not automatic)

### Connection Errors

**Problem**: `Failed to connect to Langfuse`

**Solutions**:
1. Check `LANGFUSE_BASE_URL` matches your region:
   - EU: `https://cloud.langfuse.com`
   - US: `https://us.cloud.langfuse.com`
2. Verify network connectivity
3. Check if Langfuse Cloud is operational: [status.langfuse.com](https://status.langfuse.com)
4. Try self-hosted Langfuse if cloud is down

### ImportError: No module named 'langfuse'

**Problem**: Python worker fails to start

**Solution**:
```bash
pip install -r requirements.txt
# Verify installation
pip show langfuse
```

---

## Advanced Configuration

### Self-Hosted Langfuse

Instead of Langfuse Cloud, you can run your own instance:

1. Deploy Langfuse using Docker:
   ```bash
   git clone https://github.com/langfuse/langfuse.git
   cd langfuse
   docker-compose up -d
   ```

2. Update `.env`:
   ```bash
   LANGFUSE_BASE_URL=http://localhost:3000
   LANGFUSE_PUBLIC_KEY=your-self-hosted-key
   LANGFUSE_SECRET_KEY=your-self-hosted-secret
   ```

### Custom Metadata

Add custom metadata to traces for better filtering:

**TypeScript** (edit `server/websocket/messageHandlers.ts`):
```typescript
const langfuseTrace = createTrace(
  sessionId as string,
  userId,  // Add user ID if available
  {
    model: queryOptions.model,
    permissionMode: session.permission_mode,
    mode: session.mode,
    // Add custom fields:
    userRole: "admin",
    environment: "production",
    featureFlags: ["new-ui", "advanced-mode"]
  }
);
```

**Python**:
```python
trace = create_trace(
    name="custom_task",
    session_id=task_id,
    metadata={
        "collection": collection_name,
        "query_type": "rag",
        "custom_field": "value"
    }
)
```

### Disable Langfuse

To temporarily disable without removing code:

1. Comment out credentials in `.env`:
   ```bash
   # LANGFUSE_PUBLIC_KEY=pk-lf-...
   # LANGFUSE_SECRET_KEY=sk-lf-...
   ```

2. Restart the application

The integration will gracefully degrade:
```
ℹ️  Langfuse credentials not configured, observability disabled
```

---

## Best Practices

### 1. Session ID Management
- Use consistent session IDs for multi-turn conversations
- Include identifiers in session IDs: `user-123-chat-456`
- Avoid PII (personally identifiable information) in session IDs

### 2. Metadata Strategy
- Add searchable fields: `environment`, `feature`, `version`
- Include context: `mode`, `permission_mode`, `model`
- Avoid large objects (keep metadata under 1KB)

### 3. Cost Optimization
- Monitor high-cost queries in Analytics dashboard
- Identify long system prompts for truncation
- Use cheaper models (Haiku) for simple tasks
- Set up spending alerts

### 4. Privacy Considerations
- **Never log** user credentials, API keys, or secrets
- Truncate sensitive inputs before tracing
- Use Langfuse's built-in PII redaction features
- Review data retention policies

### 5. Performance
- Langfuse uses async operations (non-blocking)
- Flush interval: 5 seconds (default)
- Graceful shutdown ensures events are sent
- No performance impact on LLM latency

---

## Integration Summary

### Files Modified

| File | Purpose |
|------|---------|
| `.env` | Added Langfuse credentials |
| `package.json` | Installed `langfuse` npm package |
| `requirements.txt` | Added `langfuse>=2.0.0` Python SDK |
| `server/observability/langfuse.ts` | TypeScript observability helpers |
| `server/websocket/messageHandlers.ts` | Instrumented main chat handler |
| `python-worker/worker.py` | Initialize Langfuse at startup |
| `python-worker/observability.py` | Python observability helpers |

### What's Traced Automatically

✅ **Traced Automatically** (No Code Changes Needed):
- Every chat message in the main interface
- Token usage from Claude Agent SDK
- Session metadata (model, mode, permission mode)

⚠️ **Manual Instrumentation Required**:
- Python Celery tasks (use observability helpers)
- Custom LLM calls outside main chat handler
- Multi-agent workflows

---

## Related Documentation

- [Langfuse Official Docs](https://langfuse.com/docs)
- [Langfuse Python SDK](https://langfuse.com/docs/sdk/python)
- [Langfuse TypeScript SDK](https://langfuse.com/docs/sdk/typescript)
- [Agent Ironman Main README](../README.md)
- [Pydantic AI Integration](./PYDANTIC_AI_INTEGRATION.md)

---

## Support

**Questions or Issues?**
- Check the [Langfuse Discord](https://discord.gg/7NXusRtqYU)
- File issues on [GitHub](https://github.com/langfuse/langfuse)
- Review this project's troubleshooting section above

**Agent Ironman Specific**:
- Check console logs for initialization messages
- Verify `.env` configuration
- Test with a simple chat message first
