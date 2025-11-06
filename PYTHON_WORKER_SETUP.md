# Python AI Worker Setup Guide

Complete guide to setting up the Python AI worker for advanced AI capabilities alongside your Bun backend.

## 🏗️ Architecture Overview

┌─────────────────┐
│   Browser       │
└────────┬────────┘
         │ HTTP/WebSocket
┌────────▼────────────┐
│  Bun Server         │ ← Existing backend
│  (TypeScript)       │   - Web routes
│  - server.ts        │   - WebSockets
│  - taskQueue.ts     │   - SQLite DB
└────────┬────────────┘
         │ Enqueue tasks
┌────────▼────────────┐
│     Redis           │ ← Message broker
│  (Task Queue)       │
└────────┬────────────┘
         │ Pull tasks
┌────────▼────────────┐
│  Python Worker      │ ← NEW AI worker
│  (Celery)           │
│  - RAG/Embeddings   │
│  - Multi-agent      │
│  - Doc processing   │
│  - AI workflows     │
└─────────────────────┘

## 📋 Prerequisites

### 1. Python 3.10+

bash

 Check Python version

python3 --version

 Should be 3.10 or higher

## 2. Redis Server

```bash
# macOS (via Homebrew)
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server

# Start Redis
redis-server --daemonize yes

# Verify Redis is running
redis-cli ping
# Should respond: PONG
```

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd /Users/vics/Applications/agent-ironman-app

# Install concurrently for running multiple processes
bun install

# Create Python virtual environment
bun run python:setup

# Or manually:
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
```

### Step 2: Configure Environment

Add to your `.env` file:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Anthropic API (required for AI tasks)
ANTHROPIC_API_KEY=your_api_key_here

# Vector Store
CHROMA_PERSIST_DIR=./data/chroma

# LLM Settings
DEFAULT_MODEL=claude-3-5-sonnet-20241022
MAX_TOKENS=8000
TEMPERATURE=0.7

# Document Processing
MAX_DOCUMENT_SIZE_MB=50
```

### Step 3: Start Services

**Option A: Run everything together

```bash
# Start Redis (if not already running)
bun run redis:start

# Start Bun server + Python worker
bun run dev:with-worker
```

**Option B: Run separately (for debugging)

```bash
# Terminal 1: Start Redis
bun run redis:start

# Terminal 2: Start Bun server
bun run dev

# Terminal 3: Start Python worker
bun run python:worker
```

### Step 4: Verify Setup

Check worker is running:

```bash
# You should see:
# [tasks]
#   . rag.delete_collection
#   . rag.index_documents
#   . rag.list_collections
#   . rag.query_with_context
#   . rag.search
#   . agents.debate
#   . agents.multi_agent_parallel
#   . agents.multi_agent_sequential
#   . agents.single_agent
#   . documents.chunk_and_index
#   . documents.extract_entities
#   . documents.parse
#   . documents.summarize
#   . workflows.batch_document_analysis
#   . workflows.content_pipeline
#   . workflows.document_to_knowledge_base
#   . workflows.research_and_report
```

## 📚 Available AI Tasks

### 1. RAG (Retrieval Augmented Generation)

**Index documents:**

```typescript
import { AITasks } from "./server/taskQueue";

await AITasks.indexDocument(
  "/path/to/document.pdf",
  "my-knowledge-base"
);
```

**Query with context:**

```typescript
await AITasks.queryKnowledgeBase(
  "my-knowledge-base",
  "What are the key findings?"
);
```

### 2. Multi-Agent Orchestration

**Run agents in sequence:**

```typescript
await taskQueue.enqueueMultiAgent(
  [
    { role: "researcher", task_description: "Research the topic" },
    { role: "analyst", task_description: "Analyze findings" },
    { role: "critic", task_description: "Review for accuracy" }
  ],
  "What are the benefits of AI?",
  "sequential"
);
```

### 3. Document Processing

**Parse and analyze:**

```typescript
await AITasks.analyzeDocument("/path/to/report.pdf");
```

### 4. AI Workflows

**Research and generate report:**

```typescript
await AITasks.research(
  "Impact of climate change on agriculture",
  "research-docs"
);
```

**Content creation pipeline:**

```typescript
await AITasks.createContent(
  "Guide to TypeScript",
  "blog_post"
);
```

## 🔧 Integration Examples

### Example 1: Add RAG Endpoint to Bun Server

Add to `server/routes/ai.ts`:

```typescript
import { taskQueue } from "../taskQueue";

export async function handleAIRoutes(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // POST /api/ai/query
  if (url.pathname === "/api/ai/query" && req.method === "POST") {
    const { collection, query } = await req.json();

    const task = await taskQueue.enqueueRAGQuery(collection, query);

    return Response.json({
      taskId: task.taskId,
      status: "queued",
      message: "AI query enqueued for processing"
    });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}
```

### Example 2: WebSocket Task Updates

```typescript
// Notify clients when AI task completes
// (Requires implementing result backend polling)
ws.send(JSON.stringify({
  type: "ai_task_complete",
  taskId: "...",
  result: {
    answer: "...",
    sources: [...]
  }
}));
```

## 📊 Task Types Reference

### RAG Tasks

- `rag.index_documents` - Index text to vector store
- `rag.search` - Search for similar documents
- `rag.query_with_context` - RAG query (search + generate)
- `rag.list_collections` - List all collections
- `rag.delete_collection` - Delete collection

### Agent Tasks

- `agents.single_agent` - Run single specialized agent
- `agents.multi_agent_sequential` - Sequential agent pipeline
- `agents.multi_agent_parallel` - Parallel agents with synthesis
- `agents.debate` - Multi-round agent debate

### Document Tasks

- `documents.parse` - Extract text from PDF/DOCX/TXT/HTML
- `documents.summarize` - Generate document summary
- `documents.extract_entities` - Extract named entities
- `documents.chunk_and_index` - Parse, chunk, and index

### Workflow Tasks

- `workflows.document_to_knowledge_base` - Full document indexing pipeline
- `workflows.research_and_report` - RAG + multi-agent research
- `workflows.content_pipeline` - Content creation workflow
- `workflows.batch_document_analysis` - Batch document processing

## 🐛 Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping

# Start Redis if not running
redis-server --daemonize yes
```

### Python Worker Not Starting

```bash
# Check virtual environment
ls -la venv/

# Reinstall if needed
rm -rf venv
bun run python:setup

# Check Celery can import
./venv/bin/python -c "import celery; print(celery.__version__)"
```

### ChromaDB Errors

```bash
# Ensure data directory exists
mkdir -p data/chroma

# Check permissions
ls -la data/
```

### Import Errors

```bash
# The worker uses underscores in imports
# Ensure __init__.py files exist:
python-worker/__init__.py
python-worker/tasks/__init__.py
python-worker/services/__init__.py
```

## 🔐 Security Notes

1. **API Keys**: Never commit `.env` file
2. **Redis**: Use password in production (`requirepass` in redis.conf)
3. **File Uploads**: Validate file types and sizes
4. **Rate Limiting**: Implement task rate limits for production

## 📈 Monitoring

### Check Worker Status

```bash
# View active tasks
./venv/bin/celery -A python-worker.worker inspect active

# View worker stats
./venv/bin/celery -A python-worker.worker inspect stats
```

### Redis Monitor

```bash
# Watch Redis commands
redis-cli monitor
```

## 🚀 Production Deployment

### Using Supervisor (Linux)

```ini
[program:celery-worker]
command=/path/to/venv/bin/celery -A python-worker.worker worker --loglevel=info
directory=/path/to/agent-ironman-app
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery/worker.log
```

### Using systemd

```ini
[Unit]
Description=Agent Ironman Python Worker
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/agent-ironman-app
ExecStart=/path/to/venv/bin/celery -A python-worker.worker worker --loglevel=info
Restart=always

[Install]
WantedBy=multi-user.target
```

## 📝 Next Steps

1. ✅ Test basic RAG query
2. ✅ Index some sample documents
3. ✅ Try multi-agent workflow
4. ✅ Build custom agents for your use case
5. ✅ Integrate with your Bun routes
6. ✅ Monitor performance and optimize

## 🎯 Super Agent Capabilities Unlocked

✨ **RAG**: Context-aware responses from your knowledge base
🤖 **Multi-Agent**: Multiple AI perspectives working together
📄 **Document Processing**: Automatic parsing and analysis
🔄 **Workflows**: Complex AI task chains
⚡ **Background Processing**: Long-running tasks without blocking

Your agent is now a **Super Agent**! 🦾
