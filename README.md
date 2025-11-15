# Agent Ironman

**A comprehensive AI development platform powered by the Claude Agent SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![Bun](https://img.shields.io/badge/Bun-Latest-black?logo=bun)](https://bun.sh/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet_4.5-8B5CF6)](https://www.anthropic.com/claude)
[![Pydantic AI](https://img.shields.io/badge/Pydantic_AI-Enabled-green)](https://ai.pydantic.dev)

Enterprise-grade AI development platform with multi-agent workflows, build wizards, productivity analytics, and seamless integrations. Built with React, TypeScript, and Bun for blazing-fast performance.

[Getting Started](#-quick-start) • [Features](#-features) • [Installation](#-installation) • [Contributing](#-contributing)

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🚀 Installation](#-installation)
- [📖 Quick Start](#-quick-start)
- [🎮 Usage](#-usage)
- [🛠️ Development](#️-development)
- [📚 Architecture](#-architecture)
- [🔧 Configuration](#-configuration)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview

Agent Ironman is a **comprehensive AI development platform** that brings the power of Anthropic's Claude Agent SDK to your local machine. Unlike web-based alternatives, Agent Ironman runs entirely on your computer with full file system access, persistent sessions, and advanced features like workflow orchestration, productivity analytics, and external integrations.

**What makes Agent Ironman different:**

- 🤖 **Multi-Agent Workflows** - Chain specialized AI agents for complex tasks
- 🧙‍♂️ **Build Wizard** - Bootstrap new projects with industry best practices
- 🔌 **Integration Hub** - Connect GitHub, deployment services, webhooks, and more
- 📊 **Analytics Dashboard** - Track productivity, costs, and AI usage patterns
- 🐍 **Python Workers** - Type-safe Pydantic AI agents for advanced use cases
- ⚡ **Slash Commands** - Quick actions like /audit, /check, /commit
- 🔒 **Privacy-First** - All data stored locally, full control over your information

**Perfect for:**

- 🔧 Development teams building production applications
- 🏗️ Engineers managing complex multi-service architectures
- 📈 Organizations tracking AI costs and productivity
- 🚀 Startups needing rapid prototyping and deployment
- 💼 Consultants working on multiple client projects
- 🔬 Researchers exploring AI agent architectures

---

## ✨ Features

### 🤖 Powered by Claude Agent SDK

- **Claude Sonnet 4.5** - Anthropic's most intelligent model
- **Specialized Sub-Agents** - Researcher, code reviewer, debugger, test writer, documenter
- **Full Tool Access** - Read, write, edit files, search code, run commands
- **MCP Integration** - Model Context Protocol for extensibility

### 💬 Real-Time Streaming

- **WebSocket-Based** - Instant responses as Claude types
- **Live Updates** - See tool use in real-time
- **Nested Visualization** - Sub-agent tools displayed under parent tasks

### 🗂️ Session Management

- **SQLite Persistence** - All conversations saved locally
- **Session Isolation** - Each chat has its own working directory
- **Auto-Titles** - Sessions named from first message
- **Full History** - Never lose a conversation

### 🎨 Modern UI/UX

- **Clean Interface** - Built with Radix UI components
- **Dark Mode** - Easy on the eyes
- **Virtual Scrolling** - Smooth performance with long conversations
- **Syntax Highlighting** - Beautiful code blocks
- **Smooth Animations** - Powered by Framer Motion

### 🔄 Workflow Orchestration

- **Multi-Agent Workflows** - Chain multiple AI agents together
- **Custom Triggers** - Event-driven workflow execution
- **Built-in Templates** - Pre-configured workflows for common tasks
- **Workflow Builder** - Visual workflow creation interface
- **Execution History** - Track and replay workflow runs

### 🧙‍♂️ Build Wizard

- **4 Template Modes** - CLI Tool, Web App, API Service, Full-Stack App
- **Interactive Setup** - Step-by-step project initialization
- **Smart Scaffolding** - Generate project structure automatically
- **Best Practices** - Industry-standard configurations included
- **Instant Start** - From zero to running project in minutes

### 🔌 Integration Hub

- **GitHub Integration** - Connect repositories, track issues, manage PRs
- **Deployment Services** - Vercel, Netlify, Railway, Render support
- **Webhook Support** - Real-time notifications and triggers
- **Package Registry** - npm, PyPI integration for dependency management
- **API Connectors** - Easy third-party service integration

### 📊 Productivity Analytics

- **Code Metrics** - Lines written, files modified, commits made
- **Time Tracking** - Session duration and activity patterns
- **AI Usage Stats** - Token consumption and cost analysis
- **Performance Insights** - Identify bottlenecks and optimize workflows
- **Custom Reports** - Export analytics for team reporting

### ⚡ Slash Commands

Quick actions powered by Claude Code:

- **/audit** - Security and dependency auditing
- **/check** - Run linting, type-checking, and tests
- **/commit** - Generate AI commit messages
- **/dev-server** - Start/restart development server
- **/clear** - Clear conversation history
- **/compact** - Reduce conversation token usage

### 🌐 Multi-Provider Support

- **Anthropic** - Direct Claude API access
- **Z.AI** - Alternative provider with GLM models + web search
- **Easy Switching** - Change providers via dropdown

### ⚡ Developer Experience

- **Hot Reload** - Instant updates during development
- **TypeScript** - Full type safety
- **Bun Runtime** - Ultra-fast builds and execution
- **Zero Config** - SQLite just works

### 📊 Observability & Monitoring

- **Langfuse Integration** - LLM cost tracking and performance monitoring
- **Request Tracing** - Full visibility into all AI interactions
- **Token Analytics** - Monitor usage and optimize costs
- **Dashboard** - Beautiful web interface for insights

---

## 🚀 Installation

### Universal One-Line Install

**Works on macOS, Linux, and Windows (Git Bash/WSL):**

```bash
curl -fsSL https://raw.githubusercontent.com/KenKaiii/agent-ironman/master/install.sh | bash
```

**What it does:**

- ✅ Auto-detects your OS and architecture
- ✅ Downloads the correct release for your platform
- ✅ Installs to platform-specific location
- ✅ Creates global command (macOS/Linux)
- ✅ Sets up API key configuration
- ✅ macOS: Apple-signed & notarized (no warnings)

**Supported Platforms:**

- macOS (Intel + Apple Silicon)
- Linux (x64 + ARM64)
- Windows x64 (via Git Bash/WSL)

### Windows PowerShell (Alternative)

**For native Windows PowerShell:**

```powershell
iwr -useb https://raw.githubusercontent.com/KenKaiii/agent-ironman/master/install.ps1 | iex
```

Provides better Windows integration with automatic PATH setup.

### Manual Installation

If you prefer to install manually or the one-line installer doesn't work:

```bash
# Clone repository
git clone https://github.com/KenKaiii/agent-ironman.git
cd agent-ironman

# Install dependencies
bun install

# Create environment file
cp .env.example .env
# Edit .env and add your Anthropic API key

# Start the application
bun run start
```

---

## 📖 Quick Start

### 1. Configure API Key

Before first run, add your Anthropic API key:

```bash
# macOS/Linux
nano ~/Applications/agent-ironman-app/.env

# Windows
notepad %USERPROFILE%\Documents\agent-ironman-app\.env
```

Replace `sk-ant-your-key-here` with your actual key from [console.anthropic.com](https://console.anthropic.com/).

### 2. Launch the App

**macOS/Linux:**

```bash
agent-ironman
```

**Windows:**

- Double-click `agent-ironman.exe` in the install directory

**From Finder/Explorer:**

1. Navigate to install directory
2. Double-click the `agent-ironman` executable

The app starts at **<http://localhost:3003>** and opens automatically in your browser.

### 3. Start Chatting

1. Click **"New Chat"** to create a session
2. Select a working directory (or use default)
3. Choose your model (Claude Sonnet 4.5 recommended)
4. Start your conversation!

---

## 🎮 Usage

### Session Management

**Create a Session:**

- Click **"New Chat"** in sidebar
- Choose working directory for file operations
- Sessions are isolated - files stay organized

**Rename Session:**

- Click pencil icon → Enter new name → Press Enter

**Delete Session:**

- Click trash icon → Confirm deletion (permanent)

### Model Selection

**Anthropic Models:**

- **Claude Sonnet 4.5** ⭐ - Best for complex tasks
- Direct API access to latest Claude models

**Z.AI Models:**

- **GLM 4.6** - Alternative with web search MCP
- Great for research tasks

Switch anytime via header dropdown.

### Custom Sub-Agents

Claude can spawn specialized agents using the Task tool:

| Agent | Purpose |
|-------|---------|
| **researcher** | Information gathering and analysis |
| **code-reviewer** | Bug detection, security, best practices |
| **debugger** | Systematic bug hunting |
| **test-writer** | Comprehensive test suite creation |
| **documenter** | Clear docs and examples |

Sub-agent activity displays nested under parent tasks for clarity.

### Working Directories

Each session has an isolated working directory:

- **Default:** `~/Documents/agent-ironman-app/{session-id}/`
- **Custom:** Choose any directory when creating
- **Safety:** File operations scoped to this directory only

### Workflow Orchestration

**Creating Workflows:**

Build multi-agent workflows through the UI or API:

```typescript
// Example: Code Review Workflow
{
  name: "comprehensive-review",
  steps: [
    { agent: "code-reviewer", input: "files/*.ts" },
    { agent: "test-writer", input: "{{previous.output}}" },
    { agent: "documenter", input: "{{previous.output}}" }
  ],
  triggers: ["on-push", "on-pr"]
}
```

**Built-in Workflows:**

- **Quality Check** - Lint, type-check, test, security scan
- **Documentation Update** - Analyze changes, update docs, generate examples
- **Deployment Pipeline** - Build, test, deploy, notify
- **Code Migration** - Analyze, refactor, test, validate

**Accessing Workflows:**

1. Open workflow panel in sidebar
2. Browse built-in templates or create custom
3. Configure triggers and parameters
4. Execute manually or automatically

### Build Wizard

**Starting a New Project:**

1. Click "Build Wizard" in header
2. Select template mode:
   - **CLI Tool** - Command-line application with args parsing
   - **Web App** - React/Next.js frontend application
   - **API Service** - RESTful API with database
   - **Full-Stack App** - Complete frontend + backend setup
3. Configure options (TypeScript, testing, linting)
4. Generate project structure
5. Install dependencies automatically

**Wizard generates:**

- Project scaffolding with best practices
- Configuration files (tsconfig, eslint, prettier)
- Development scripts and commands
- README with quick start guide
- Git initialization and .gitignore

### Integration Hub

**Connecting Services:**

Access Integration Hub from the header menu:

**GitHub Integration:**

```bash
# Connect your GitHub account
# Provides: Issue tracking, PR management, commit history
gh auth login
```

**Deployment Services:**

- **Vercel** - One-click frontend deployments
- **Netlify** - Static site hosting with edge functions
- **Railway** - Container-based app hosting
- **Render** - Web services and databases

**Webhooks:**
Set up real-time notifications:

```javascript
// Example: GitHub webhook for PR events
{
  source: "github",
  event: "pull_request.opened",
  action: "trigger-workflow",
  workflow: "code-review"
}
```

**Package Registry:**

- Search and install packages directly
- View dependency trees
- Check for updates and vulnerabilities
- Generate dependency reports

### Productivity Analytics

**Accessing Analytics:**

Click "Analytics" in header to view:

**Code Activity:**

- Lines of code written per session
- Files created/modified/deleted
- Most active file types
- Contribution heatmap

**AI Usage:**

- Total tokens consumed
- Cost per session/project
- Model usage breakdown
- Most expensive operations

**Time Tracking:**

- Session duration trends
- Peak productivity hours
- Average response times
- Idle time detection

**Export Reports:**

- CSV/JSON format
- Custom date ranges
- Team aggregation
- Cost allocation

### Slash Commands

**Using Commands:**

Type `/` in the chat input to see available commands:

**Built-in Commands:**

- `/audit` - Run security audit on dependencies
- `/check` - Execute all code quality checks
- `/commit` - Generate semantic commit message
- `/dev-server` - Start development server
- `/clear` - Clear conversation and start fresh
- `/compact` - Compress history to save tokens

**Custom Commands:**

Create your own in `.claude/commands/`:

```markdown
---
description: "Run integration tests"
argument-hint: "[test-suite]"
---

Execute integration test suite:
- Start test database
- Run migrations
- Execute tests
- Generate coverage report
```

---

## 🛠️ Development

### Prerequisites

- [Bun](https://bun.sh/) v1.0.0+
- macOS, Linux, or WSL (Windows Subsystem for Linux)
- Node.js 18+ (optional, for compatibility testing)

### Local Development

```bash
# Clone repository
git clone https://github.com/KenKaiii/agent-ironman.git
cd agent-ironman

# Install dependencies
bun install

# Create environment file
cat > .env << EOF
API_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
EOF

# Start development server
bun run dev
```

Development server runs at **<http://localhost:3003>** with hot reload.

### Build from Source

Build for your current platform:

```bash
# Single platform build
./build-source-release.sh

# Output will be in ./release/
```

### Run Tests

```bash
# Run all tests
bun test

# Watch mode
bun test --watch
```

---

## 📚 Architecture

### Tech Stack

**Frontend:**

- React 19 + TypeScript
- Radix UI (accessible components)
- Tailwind CSS 4 (utility-first styling)
- Framer Motion (animations)
- React Virtual (performance)
- React Markdown (message rendering)
- Zustand (state management)
- TanStack Virtual (virtualized lists)

**Backend:**

- Bun runtime (high performance)
- Claude Agent SDK (AI interactions)
- SQLite (session persistence)
- WebSocket (real-time streaming)
- MCP (Model Context Protocol)
- Langfuse (LLM observability & cost tracking)

**AI & Agents:**

- Claude Sonnet 4.5 (primary model)
- Pydantic AI (type-safe Python agents)
- Multi-agent workflow orchestration
- Predictive suggestions engine
- Personal learning system

**Integrations:**

- GitHub API (repository management)
- Deployment platforms (Vercel, Netlify, Railway, Render)
- Webhook services (real-time notifications)
- Package registries (npm, PyPI)

**Analytics & Monitoring:**

- Productivity analytics engine
- Token usage tracking
- Cost attribution
- Performance metrics

**Python Workers (Optional):**

- Celery (task queue)
- Pydantic AI (type-safe agents)
- Claude Agent SDK (Python code execution)
- Redis (message broker)

#### Claude Agent SDK Setup

The Python Claude Agent SDK enables Python workers to control Claude Code programmatically for code execution and file operations.

**Installation:**

```bash
# 1. Install Claude Code CLI (required)
npm install -g @anthropic-ai/claude-code

# 2. Install Python SDK
pip install "claude-agent-sdk>=0.1.0"

# 3. Verify installation
python3 test-claude-agent-sdk.py
```

**Configuration (`.env`):**

```bash
# Claude Agent SDK settings
CLAUDE_SDK_PERMISSION_MODE=plan      # or "acceptEdits", "default"
CLAUDE_SDK_MAX_TOKENS=8000
CLAUDE_SDK_WORKING_DIR=/path/to/project
```

**Available Celery Tasks:**

```python
# Simple query
task = claude_agent.query.apply_async(
    args=["Analyze this codebase structure"],
    kwargs={"permission_mode": "plan"}
)

# Execute code task with file operations
task = claude_agent.execute_code.apply_async(
    args=["Create a new React component"],
    kwargs={"auto_accept": False, "files_to_modify": ["src/components/NewComponent.tsx"]}
)

# Analyze codebase
task = claude_agent.analyze_codebase.apply_async(
    args=["Find all API endpoints"],
    kwargs={"file_patterns": ["*.ts", "*.tsx"]}
)

# Run tests
task = claude_agent.run_tests.apply_async(
    args=["npm test"],
    kwargs={"working_dir": "./"}
)
```

**Service Layer Usage:**

```python
from python_worker.services.claude_agent_client import get_claude_agent_client

client = get_claude_agent_client()

if client.is_available():
    result = await client.query_simple(
        prompt="What files are in this directory?",
        working_dir="/path/to/analyze",
        permission_mode="plan"
    )
    print(result["text"])
```

### Project Structure

agent-ironman/
├── client/                      # React frontend
│   ├── components/
│   │   ├── chat/               # ChatContainer, MessageList, ChatInput
│   │   ├── message/            # Message renderers
│   │   ├── sidebar/            # Session sidebar
│   │   ├── header/             # Header, model selector, about modal
│   │   ├── build-wizard/       # Project setup wizard
│   │   ├── workflows/          # Workflow builder & manager
│   │   ├── ai/                 # AI features (suggestions, learning)
│   │   └── python/             # Python worker UI components
│   ├── hooks/                  # useWebSocket, useSessionAPI
│   ├── config/                 # Model/provider configuration
│   └── index.tsx               # App entry point
├── server/
│   ├── server.ts               # Main server, WebSocket, SDK integration
│   ├── database.ts             # Session & message persistence
│   ├── providers.ts            # Multi-provider config
│   ├── agents.ts               # Custom agent registry
│   ├── mcpServers.ts           # MCP server config
│   ├── systemPrompt.ts         # Dynamic system prompts
│   ├── routes/                 # API route handlers
│   │   ├── sessions.ts         # Session management
│   │   ├── workflows.ts        # Workflow orchestration
│   │   ├── commands.ts         # Slash command loading
│   │   ├── ai.ts               # AI services (suggestions, learning)
│   │   ├── pydantic-ai.ts      # Pydantic AI agent routes
│   │   └── python.ts           # Python worker management
│   ├── integrations/           # External service integrations
│   │   ├── github.ts           # GitHub API integration
│   │   ├── deployment.ts       # Deployment platform connectors
│   │   ├── webhooks.ts         # Webhook management
│   │   ├── packageRegistry.ts  # npm/PyPI integration
│   │   └── integrationHub.ts   # Integration orchestrator
│   ├── analytics/              # Analytics & monitoring
│   │   └── productivityAnalytics.ts  # Productivity tracking
│   ├── ai/                     # AI systems
│   │   ├── personalLearning.ts # Learning system
│   │   └── predictiveSuggestions.ts  # Smart suggestions
│   ├── pydantic-ai/            # Pydantic AI Python agents
│   │   ├── agents/             # Agent implementations
│   │   ├── tools/              # Custom tools
│   │   └── examples/           # Usage examples
│   └── websocket/              # WebSocket handlers
│       └── messageHandlers.ts  # Message routing
├── .github/workflows/          # CI/CD for releases
├── build-source-release.sh     # Build script
└── install.sh                  # One-line installer

---

## 🔧 Configuration

### Environment Variables

Create `.env` in app directory:

```env
# Anthropic (Claude models)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Z.AI (GLM models, optional)
ZAI_API_KEY=your-zai-key-here
```

### Advanced Configuration

**Custom Agents:**

Edit `server/agents.ts`:

```typescript
export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  'my-agent': {
    description: 'Brief description for agent list',
    prompt: 'Detailed instructions...',
    tools: ['Read', 'Write', 'Grep'], // Optional tool restrictions
    model: 'sonnet', // Optional model override
  },
};
```

**MCP Servers:**

Configure per-provider in `server/mcpServers.ts`:

```typescript
export const MCP_SERVERS_BY_PROVIDER: Record<ProviderType, Record<string, McpServerConfig>> = {
  'my-provider': {
    'my-mcp-server': {
      type: 'http',
      url: 'https://api.example.com/mcp',
      headers: { 'Authorization': `Bearer ${process.env.API_KEY}` },
    },
  },
};
```

**System Prompt:**

Customize Claude's behavior in `server/systemPrompt.ts`.

### Observability & Monitoring

**Langfuse Integration:**

Agent Ironman includes built-in observability with [Langfuse](https://langfuse.com) for:

- 📊 Cost tracking and token usage monitoring
- 🔍 Request tracing across all LLM calls
- ⏱️ Performance metrics and latency tracking
- 🐛 Debugging with full input/output inspection

**Quick Setup:**

1. Sign up at [cloud.langfuse.com](https://cloud.langfuse.com)
2. Add credentials to `.env`:

   ```env
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   LANGFUSE_BASE_URL=https://cloud.langfuse.com
   ```

3. Restart Agent Ironman - traces appear automatically!

📖 **Full documentation:** See [`docs/LANGFUSE_INTEGRATION.md`](docs/LANGFUSE_INTEGRATION.md) for:

- Detailed setup instructions
- Python worker instrumentation
- Dashboard navigation guide
- Cost optimization tips
- Troubleshooting

**Python Workers & Pydantic AI

Agent Ironman includes optional Python workers for type-safe AI agents using [Pydantic AI](https://ai.pydantic.dev):

**Features:**

- **Type-Safe Agents** - Full TypeScript-like type safety in Python
- **Custom Tools** - Extend agents with Python-specific capabilities
- **Async Support** - Non-blocking task execution
- **Redis Queue** - Scalable task distribution
- **Langfuse Integration** - Full observability for Python agents

**Quick Start:**

```bash
# Install Python dependencies
cd server/pydantic-ai
pip install -r requirements.txt

# Start Redis (required for task queue)
redis-server

# Start Python worker
python worker.py
```

**Example Agent:**

```python
from pydantic_ai import Agent
from pydantic import BaseModel

class CodeAnalysis(BaseModel):
    complexity: int
    issues: list[str]
    suggestions: list[str]

agent = Agent(
    model='claude-sonnet-4',
    result_type=CodeAnalysis,
    system_prompt='Analyze code quality and provide suggestions'
)

# Use from TypeScript via API
result = await agent.run('Analyze this code: ...')
```

📖 **Full documentation:** See [`docs/PYDANTIC_AI_INTEGRATION.md`](docs/PYDANTIC_AI_INTEGRATION.md) for:

- Complete setup instructions
- Agent creation examples
- Custom tool development
- Langfuse instrumentation
- Troubleshooting guide

---

## 🔌 API Reference

Agent Ironman exposes a REST API for programmatic access:

 Session Management

```bash
# List all sessions
GET /api/sessions

# Create new session
POST /api/sessions
{
  "mode": "claude",
  "workingDirectory": "/path/to/project"
}

# Get session details
GET /api/sessions/:id

# Delete session
DELETE /api/sessions/:id
```

### Workflow API

```bash
# List workflows
GET /api/workflows/:sessionId

# Create workflow
POST /api/workflows/:sessionId
{
  "name": "my-workflow",
  "steps": [...],
  "triggers": ["manual"]
}

# Execute workflow
POST /api/workflows/:sessionId/:workflowId/execute
{
  "input": {...}
}

# Get execution status
GET /api/workflows/:sessionId/:workflowId/executions/:executionId
```

### AI Services

```bash
# Get predictive suggestions
POST /api/ai/suggestions
{
  "context": "current code context",
  "sessionId": "session-id"
}

# Personal learning insights
GET /api/ai/learning/:sessionId

# Analytics data
GET /api/analytics/:sessionId
```

Integration Hub

```bash
# List available integrations
GET /api/integrations

# Connect service
POST /api/integrations/:service/connect
{
  "credentials": {...}
}

# Webhook management
POST /api/integrations/webhooks
{
  "source": "github",
  "events": ["push", "pull_request"],
  "target": "workflow-id"
}
```

### Python Workers

```bash
# List available Pydantic agents
GET /api/pydantic/agents

# Execute Python agent
POST /api/pydantic/execute
{
  "agent": "code-analyzer",
  "input": {...}
}

# Get task status
GET /api/pydantic/tasks/:taskId
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# macOS/Linux
lsof -ti:3003 | xargs kill -9

# Windows
netstat -ano | findstr :3003
taskkill /PID <PID> /F
```

### API Key Issues

1. Verify `.env` exists in app directory
2. Check key format: `sk-ant-...` for Anthropic
3. Restart app after changing `.env`

### Database Reset

```bash
# macOS/Linux
rm -rf ~/Documents/agent-ironman-app/

# Development
rm -rf data/ && mkdir data
```

### macOS Security Warnings

**First run:**

1. Right-click `agent-ironman` → **"Open"**
2. Click **"Open"** in security dialog

Or via System Preferences:

1. **System Preferences** → **Security & Privacy**
2. Click **"Open Anyway"**

---

## 🤝 Contributing

Contributions welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** thoroughly: `bun test`
5. **Commit**: `git commit -m 'Add amazing feature'`
6. **Push**: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Guidelines

- **TypeScript** - Use strict typing
- **Code Style** - Follow existing patterns
- **Testing** - Add tests for new features
- **Documentation** - Update README and comments

---

## 📄 License

This project is licensed under the **MIT License**.

**What this means:**

- ✅ **Free to use** - Personal or commercial
- ✅ **Modify freely** - Adapt to your needs
- ✅ **Distribute** - Share with others
- ✅ **Private use** - No obligation to share modifications
- ⚠️ **No warranty** - Software provided as-is

See the [LICENSE](LICENSE) file for full terms.

---

## 🙏 Credits

**Created by [Ken Kai](https://github.com/KenKaiii)**

**Built with:**

- [Anthropic Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-typescript) - AI capabilities
- [Bun](https://bun.sh/) - Lightning-fast runtime
- [React](https://reactjs.org/) - UI framework
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Framer Motion](https://www.framer.com/motion/) - Smooth animations

**Special thanks to:**

- Anthropic team for the Claude Agent SDK
- Open source community for amazing tools

---

<div align="center">

**Built with ❤️ using Claude Agent SDK

Copyright © 2025 • Licensed under MIT

[⬆ Back to Top](#agent-ironman)
