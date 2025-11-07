# Agent Ironman API Reference

Comprehensive API documentation for Agent Ironman - a modern chat interface for Claude Agent SDK.

**Base URL:** `http://localhost:3003`

**Version:** 1.0.0

---

## Table of Contents

- [Authentication](#authentication)
- [Sessions API](#sessions-api)
- [AI Services API](#ai-services-api)
- [Python Management API](#python-management-api)
- [Workflow Orchestration API](#workflow-orchestration-api)
- [PydanticAI API](#pydanticai-api)
- [Directory Management API](#directory-management-api)
- [Commands API](#commands-api)
- [User Configuration API](#user-configuration-api)
- [WebSocket Protocol](#websocket-protocol)
- [Error Responses](#error-responses)

---

## Authentication

Currently, the API does not require authentication for local development. OAuth support is available via the CLI:

```bash
bun run cli.ts --login
bun run cli.ts --logout
bun run cli.ts --status
```

---

## Sessions API

Manage chat sessions with Claude Agent SDK.

### List All Sessions

Get all active chat sessions.

**Endpoint:** `GET /api/sessions`

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_abc123",
      "title": "New Chat",
      "working_directory": "/path/to/project",
      "mode": "general",
      "permission_mode": "bypassPermissions",
      "sdk_session_id": "sdk_xyz789",
      "created_at": "2025-01-07T10:00:00.000Z",
      "context_tokens": 5000,
      "context_window": 200000,
      "context_percentage": 2.5
    }
  ],
  "warning": "Recreated 1 missing directory"
}
```

**Status Codes:**
- `200 OK` - Successfully retrieved sessions

---

### Create New Session

Create a new chat session.

**Endpoint:** `POST /api/sessions`

**Request Body:**
```json
{
  "title": "My New Chat",
  "workingDirectory": "/path/to/project",
  "mode": "general"
}
```

**Parameters:**
- `title` (string, optional) - Session title (default: "New Chat")
- `workingDirectory` (string, optional) - Working directory path
- `mode` (string, optional) - Session mode: `general`, `coder`, `intense-research`, `spark` (default: "general")

**Response:**
```json
{
  "id": "session_abc123",
  "title": "My New Chat",
  "working_directory": "/path/to/project",
  "mode": "general",
  "permission_mode": "bypassPermissions",
  "created_at": "2025-01-07T10:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Session created successfully

**Example:**
```typescript
const response = await fetch('http://localhost:3003/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Code Review Session',
    workingDirectory: '/home/user/projects/my-app',
    mode: 'coder'
  })
});
const session = await response.json();
```

---

### Get Session by ID

Retrieve a specific session.

**Endpoint:** `GET /api/sessions/:id`

**Parameters:**
- `id` (string, required) - Session ID

**Response:**
```json
{
  "id": "session_abc123",
  "title": "My Chat",
  "working_directory": "/path/to/project",
  "mode": "general",
  "permission_mode": "bypassPermissions",
  "sdk_session_id": "sdk_xyz789",
  "created_at": "2025-01-07T10:00:00.000Z",
  "context_tokens": 5000,
  "context_window": 200000,
  "context_percentage": 2.5
}
```

**Status Codes:**
- `200 OK` - Session found
- `404 Not Found` - Session not found

---

### Delete Session

Delete a chat session and clean up resources.

**Endpoint:** `DELETE /api/sessions/:id`

**Parameters:**
- `id` (string, required) - Session ID

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Session deleted successfully

---

### Rename Session Folder

Rename the session's folder name.

**Endpoint:** `PATCH /api/sessions/:id`

**Parameters:**
- `id` (string, required) - Session ID

**Request Body:**
```json
{
  "folderName": "my-new-folder-name"
}
```

**Response:**
```json
{
  "success": true,
  "session": { /* updated session object */ }
}
```

**Status Codes:**
- `200 OK` - Folder renamed successfully
- `400 Bad Request` - Invalid folder name or session not found

---

### Get Session Messages

Retrieve all messages for a session.

**Endpoint:** `GET /api/sessions/:id/messages`

**Parameters:**
- `id` (string, required) - Session ID

**Response:**
```json
[
  {
    "id": "msg_123",
    "role": "user",
    "content": "Hello, Claude!",
    "timestamp": "2025-01-07T10:00:00.000Z"
  },
  {
    "id": "msg_124",
    "role": "assistant",
    "content": "[{\"type\":\"text\",\"text\":\"Hello! How can I help?\"}]",
    "timestamp": "2025-01-07T10:00:05.000Z"
  }
]
```

**Status Codes:**
- `200 OK` - Messages retrieved successfully

---

### Update Working Directory

Change the working directory for a session.

**Endpoint:** `PATCH /api/sessions/:id/directory`

**Parameters:**
- `id` (string, required) - Session ID

**Request Body:**
```json
{
  "workingDirectory": "/new/path/to/project"
}
```

**Response:**
```json
{
  "success": true,
  "session": { /* updated session object */ }
}
```

**Status Codes:**
- `200 OK` - Directory updated successfully
- `400 Bad Request` - Invalid directory or session not found

---

### Update Permission Mode

Change the permission mode for a session.

**Endpoint:** `PATCH /api/sessions/:id/mode`

**Parameters:**
- `id` (string, required) - Session ID

**Request Body:**
```json
{
  "mode": "bypassPermissions"
}
```

**Parameters:**
- `mode` (string, required) - Permission mode: `default`, `acceptEdits`, `bypassPermissions`, `plan`

**Response:**
```json
{
  "success": true,
  "session": { /* updated session object */ }
}
```

**Status Codes:**
- `200 OK` - Mode updated successfully
- `400 Bad Request` - Session not found

---

## AI Services API

AI-powered features including predictive suggestions, knowledge management, habit tracking, and personal learning.

### Predictive Suggestions

#### Generate Suggestions

Generate AI-powered suggestions based on context.

**Endpoint:** `POST /api/ai/suggestions/:sessionId`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "currentTask": "Building a REST API",
  "recentActions": ["created routes", "added database"],
  "projectContext": {
    "language": "TypeScript",
    "framework": "Express"
  }
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "sug_123",
      "text": "Add input validation middleware",
      "confidence": 0.95,
      "category": "best-practice"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Suggestions generated
- `500 Internal Server Error` - Generation failed

---

#### Get All Suggestions

Retrieve all suggestions for a session.

**Endpoint:** `GET /api/ai/suggestions/:sessionId`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "suggestions": [
    {
      "id": "sug_123",
      "text": "Add error handling",
      "confidence": 0.92,
      "category": "improvement",
      "createdAt": "2025-01-07T10:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Suggestions retrieved
- `500 Internal Server Error` - Retrieval failed

---

#### Submit Suggestion Feedback

Record whether a suggestion was helpful.

**Endpoint:** `POST /api/ai/suggestions/:sessionId/feedback`

**Request Body:**
```json
{
  "suggestionId": "sug_123",
  "helpful": true
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Feedback recorded
- `500 Internal Server Error` - Recording failed

---

### Knowledge Base

#### Search Knowledge

Search the personal knowledge base.

**Endpoint:** `POST /api/ai/knowledge/:sessionId/search`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "query": "authentication patterns",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "kb_123",
      "title": "JWT Authentication",
      "content": "Best practices for JWT...",
      "relevance": 0.95,
      "tags": ["auth", "security"]
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Search completed
- `500 Internal Server Error` - Search failed

---

#### Add Knowledge Entry

Add a new entry to the knowledge base.

**Endpoint:** `POST /api/ai/knowledge/:sessionId/entry`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "title": "React Hooks Best Practices",
  "content": "Always use dependency arrays...",
  "tags": ["react", "hooks", "best-practices"],
  "category": "frontend"
}
```

**Response:**
```json
{
  "id": "kb_456",
  "title": "React Hooks Best Practices",
  "createdAt": "2025-01-07T10:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Entry added
- `500 Internal Server Error` - Addition failed

---

#### Get Knowledge Statistics

Get statistics about the knowledge base.

**Endpoint:** `GET /api/ai/knowledge/:sessionId/stats`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "totalEntries": 142,
  "categories": {
    "frontend": 45,
    "backend": 32,
    "devops": 25
  },
  "mostUsedTags": ["react", "nodejs", "docker"],
  "lastUpdated": "2025-01-07T10:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Statistics retrieved
- `500 Internal Server Error` - Retrieval failed

---

#### Delete Knowledge Entry

Remove an entry from the knowledge base.

**Endpoint:** `DELETE /api/ai/knowledge/:sessionId/entry/:entryId`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `entryId` (string, required) - Entry ID

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Entry deleted
- `500 Internal Server Error` - Deletion failed

---

### Habit Tracking

#### Get All Habits

Retrieve all habits being tracked.

**Endpoint:** `GET /api/ai/habits/:sessionId`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "habits": [
    {
      "id": "habit_123",
      "name": "Daily Code Review",
      "frequency": "daily",
      "streak": 7,
      "lastTracked": "2025-01-07T10:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Habits retrieved
- `500 Internal Server Error` - Retrieval failed

---

#### Create Habit

Create a new habit to track.

**Endpoint:** `POST /api/ai/habits/:sessionId`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "name": "Write Unit Tests",
  "frequency": "daily",
  "target": 5,
  "category": "development"
}
```

**Response:**
```json
{
  "id": "habit_456",
  "name": "Write Unit Tests",
  "frequency": "daily",
  "createdAt": "2025-01-07T10:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Habit created
- `500 Internal Server Error` - Creation failed

---

#### Track Habit

Record habit completion.

**Endpoint:** `POST /api/ai/habits/:sessionId/track`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "habitId": "habit_123",
  "value": 1,
  "notes": "Reviewed 3 pull requests"
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Habit tracked
- `500 Internal Server Error` - Tracking failed

---

#### Get Habit Analytics

Get analytics for a specific habit.

**Endpoint:** `GET /api/ai/habits/:sessionId/analytics?habitId=habit_123`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `habitId` (query string, required) - Habit ID

**Response:**
```json
{
  "habitId": "habit_123",
  "totalCompletions": 45,
  "currentStreak": 7,
  "longestStreak": 12,
  "completionRate": 0.85,
  "trendData": [
    { "date": "2025-01-01", "value": 1 },
    { "date": "2025-01-02", "value": 1 }
  ]
}
```

**Status Codes:**
- `200 OK` - Analytics retrieved
- `400 Bad Request` - Missing habitId
- `500 Internal Server Error` - Retrieval failed

---

#### Get Habit Suggestions

Get AI-powered habit suggestions.

**Endpoint:** `GET /api/ai/habits/:sessionId/suggestions`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "suggestions": [
    {
      "habitName": "Daily Documentation",
      "reason": "Low documentation coverage detected",
      "frequency": "daily",
      "estimatedBenefit": "high"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Suggestions retrieved
- `500 Internal Server Error` - Retrieval failed

---

### Personal Learning

#### Get Learning Profile

Get the personalized learning profile.

**Endpoint:** `GET /api/ai/learning/:sessionId/profile`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "strengths": ["TypeScript", "React", "API Design"],
  "improvementAreas": ["Testing", "DevOps"],
  "learningStyle": "hands-on",
  "recentTopics": ["GraphQL", "Docker"],
  "skillLevels": {
    "TypeScript": 8,
    "React": 9,
    "Testing": 5
  }
}
```

**Status Codes:**
- `200 OK` - Profile retrieved
- `500 Internal Server Error` - Retrieval failed

---

#### Update Learning from Interaction

Update the learning profile based on user interaction.

**Endpoint:** `POST /api/ai/learning/:sessionId/update`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "topic": "GraphQL",
  "action": "implemented_feature",
  "difficulty": "medium",
  "outcome": "success"
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Learning updated
- `500 Internal Server Error` - Update failed

---

## Python Management API

Manage Python environments, packages, and script execution.

### Environment Management

#### Get Python Versions

Detect available Python versions on the system.

**Endpoint:** `GET /api/python/versions?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Response:**
```json
{
  "versions": [
    {
      "version": "3.11.5",
      "path": "/usr/bin/python3.11",
      "isDefault": true
    },
    {
      "version": "3.10.12",
      "path": "/usr/bin/python3.10",
      "isDefault": false
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Versions detected
- `500 Internal Server Error` - Detection failed

---

#### List Virtual Environments

List all virtual environments.

**Endpoint:** `GET /api/python/environments?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Response:**
```json
{
  "environments": [
    {
      "name": "myenv",
      "path": "/path/to/myenv",
      "type": "venv",
      "pythonVersion": "3.11.5",
      "isActive": true
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Environments listed
- `500 Internal Server Error` - Listing failed

---

#### Get Environment Status

Get the status of the current Python environment.

**Endpoint:** `GET /api/python/environments/status?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Response:**
```json
{
  "activeEnvironment": "myenv",
  "pythonVersion": "3.11.5",
  "pipVersion": "23.2.1",
  "installedPackages": 42
}
```

**Status Codes:**
- `200 OK` - Status retrieved
- `500 Internal Server Error` - Retrieval failed

---

#### Create Virtual Environment

Create a new virtual environment.

**Endpoint:** `POST /api/python/environments/create?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Request Body:**
```json
{
  "name": "myenv",
  "type": "venv",
  "pythonVersion": "3.11"
}
```

**Parameters:**
- `name` (string, required) - Environment name
- `type` (string, optional) - Environment type: `venv`, `conda` (default: "venv")
- `pythonVersion` (string, optional) - Python version to use

**Response:**
```json
{
  "environment": {
    "name": "myenv",
    "path": "/path/to/myenv",
    "type": "venv",
    "pythonVersion": "3.11.5"
  }
}
```

**Status Codes:**
- `200 OK` - Environment created
- `400 Bad Request` - Missing name
- `500 Internal Server Error` - Creation failed

---

#### Activate Environment

Activate a virtual environment.

**Endpoint:** `POST /api/python/environments/activate?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Request Body:**
```json
{
  "name": "myenv"
}
```

**Response:**
```json
{
  "environment": {
    "name": "myenv",
    "isActive": true
  }
}
```

**Status Codes:**
- `200 OK` - Environment activated
- `400 Bad Request` - Missing name
- `500 Internal Server Error` - Activation failed

---

### Package Management

#### Install Packages

Install Python packages.

**Endpoint:** `POST /api/python/packages/install?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Request Body:**
```json
{
  "packages": ["requests", "numpy==1.24.0", "pandas"]
}
```

**Response:**
```json
{
  "success": true,
  "installed": ["requests-2.31.0", "numpy-1.24.0", "pandas-2.1.0"]
}
```

**Status Codes:**
- `200 OK` - Packages installed
- `400 Bad Request` - Missing packages array
- `500 Internal Server Error` - Installation failed

---

#### Install from Requirements

Install packages from requirements.txt.

**Endpoint:** `POST /api/python/packages/install-requirements?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Request Body:**
```json
{
  "requirementsPath": "./requirements.txt"
}
```

**Response:**
```json
{
  "success": true,
  "installedCount": 15
}
```

**Status Codes:**
- `200 OK` - Packages installed
- `500 Internal Server Error` - Installation failed

---

#### Uninstall Packages

Uninstall Python packages.

**Endpoint:** `POST /api/python/packages/uninstall?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Request Body:**
```json
{
  "packages": ["requests", "numpy"]
}
```

**Response:**
```json
{
  "success": true,
  "uninstalled": ["requests", "numpy"]
}
```

**Status Codes:**
- `200 OK` - Packages uninstalled
- `400 Bad Request` - Missing packages array
- `500 Internal Server Error` - Uninstallation failed

---

#### Search Packages

Search PyPI for packages.

**Endpoint:** `GET /api/python/packages/search?q=requests&limit=10&sessionId=session_123`

**Parameters:**
- `q` (query string, required) - Search query
- `limit` (query string, optional) - Maximum results (default: 10)
- `sessionId` (query string, optional) - Session ID (default: "default")

**Response:**
```json
{
  "results": [
    {
      "name": "requests",
      "version": "2.31.0",
      "description": "HTTP library for Python",
      "author": "Kenneth Reitz"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Search completed
- `400 Bad Request` - Missing query
- `500 Internal Server Error` - Search failed

---

#### Get Package Info

Get detailed information about a package.

**Endpoint:** `GET /api/python/packages/info?name=requests&sessionId=session_123`

**Parameters:**
- `name` (query string, required) - Package name
- `sessionId` (query string, optional) - Session ID (default: "default")

**Response:**
```json
{
  "info": {
    "name": "requests",
    "version": "2.31.0",
    "description": "HTTP library for Python",
    "author": "Kenneth Reitz",
    "homepage": "https://requests.readthedocs.io",
    "license": "Apache 2.0",
    "dependencies": ["certifi", "charset-normalizer"]
  }
}
```

**Status Codes:**
- `200 OK` - Package info retrieved
- `400 Bad Request` - Missing package name
- `404 Not Found` - Package not found
- `500 Internal Server Error` - Retrieval failed

---

#### List Installed Packages

List all installed packages.

**Endpoint:** `GET /api/python/packages/list?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Response:**
```json
{
  "packages": [
    {
      "name": "requests",
      "version": "2.31.0"
    },
    {
      "name": "numpy",
      "version": "1.24.0"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Packages listed
- `500 Internal Server Error` - Listing failed

---

#### Check Outdated Packages

Check for outdated packages.

**Endpoint:** `GET /api/python/packages/outdated?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Response:**
```json
{
  "outdated": [
    {
      "name": "requests",
      "currentVersion": "2.28.0",
      "latestVersion": "2.31.0"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Check completed
- `500 Internal Server Error` - Check failed

---

#### Update Packages

Update packages to latest versions.

**Endpoint:** `POST /api/python/packages/update?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Request Body:**
```json
{
  "packageName": "requests"
}
```

**Response:**
```json
{
  "success": true,
  "updated": "requests-2.31.0"
}
```

**Status Codes:**
- `200 OK` - Package updated
- `500 Internal Server Error` - Update failed

---

#### Generate Requirements File

Generate requirements.txt from installed packages.

**Endpoint:** `POST /api/python/requirements/generate?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Request Body:**
```json
{
  "includeVersions": true
}
```

**Response:**
```json
{
  "success": true,
  "path": "./requirements.txt",
  "packageCount": 42
}
```

**Status Codes:**
- `200 OK` - Requirements generated
- `500 Internal Server Error` - Generation failed

---

#### Get Package Dependencies

Get dependency tree for a package.

**Endpoint:** `GET /api/python/packages/dependencies?name=requests&sessionId=session_123`

**Parameters:**
- `name` (query string, required) - Package name
- `sessionId` (query string, optional) - Session ID (default: "default")

**Response:**
```json
{
  "dependencies": [
    {
      "name": "certifi",
      "version": ">=2017.4.17",
      "required": true
    },
    {
      "name": "charset-normalizer",
      "version": ">=2.0.0",
      "required": true
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Dependencies retrieved
- `400 Bad Request` - Missing package name
- `500 Internal Server Error` - Retrieval failed

---

### Script Execution

#### Run Python Script

Execute a Python script.

**Endpoint:** `POST /api/python/script/run?sessionId=session_123`

**Parameters:**
- `sessionId` (query string, optional) - Session ID (default: "default")

**Request Body:**
```json
{
  "scriptPath": "./scripts/my_script.py",
  "args": ["--verbose", "--output", "results.json"]
}
```

**Response:**
```json
{
  "success": true,
  "exitCode": 0,
  "stdout": "Script output...",
  "stderr": "",
  "executionTime": 1234
}
```

**Status Codes:**
- `200 OK` - Script executed
- `400 Bad Request` - Missing script path
- `500 Internal Server Error` - Execution failed

---

## Workflow Orchestration API

Manage and execute workflows for task automation.

### Workflow Management

#### List Workflows

Get all workflows for a session.

**Endpoint:** `GET /api/workflows/:sessionId`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "workflows": [
    {
      "id": "wf_123",
      "name": "Deploy to Production",
      "description": "Full deployment pipeline",
      "steps": 5,
      "tags": ["deployment", "production"]
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Workflows retrieved
- `500 Internal Server Error` - Retrieval failed

---

#### Create Workflow

Create a new workflow.

**Endpoint:** `POST /api/workflows/:sessionId`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "name": "Deploy to Production",
  "description": "Full deployment pipeline",
  "steps": [
    {
      "id": "step_1",
      "name": "Run Tests",
      "type": "command",
      "config": { "command": "npm test" }
    },
    {
      "id": "step_2",
      "name": "Build",
      "type": "command",
      "config": { "command": "npm run build" }
    }
  ],
  "tags": ["deployment", "production"]
}
```

**Response:**
```json
{
  "workflowId": "wf_456"
}
```

**Status Codes:**
- `200 OK` - Workflow created
- `500 Internal Server Error` - Creation failed

---

#### Get Workflow Details

Get details for a specific workflow.

**Endpoint:** `GET /api/workflows/:sessionId/:workflowId`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `workflowId` (string, required) - Workflow ID

**Response:**
```json
{
  "id": "wf_123",
  "name": "Deploy to Production",
  "description": "Full deployment pipeline",
  "steps": [
    {
      "id": "step_1",
      "name": "Run Tests",
      "type": "command",
      "config": { "command": "npm test" }
    }
  ],
  "tags": ["deployment", "production"],
  "createdAt": "2025-01-07T10:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Workflow retrieved
- `404 Not Found` - Workflow not found
- `500 Internal Server Error` - Retrieval failed

---

#### Delete Workflow

Delete a workflow.

**Endpoint:** `DELETE /api/workflows/:sessionId/:workflowId`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `workflowId` (string, required) - Workflow ID

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Workflow deleted
- `500 Internal Server Error` - Deletion failed

---

### Workflow Execution

#### Execute Workflow

Execute a workflow.

**Endpoint:** `POST /api/workflows/:sessionId/:workflowId/execute`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `workflowId` (string, required) - Workflow ID

**Request Body:**
```json
{
  "input": {
    "branch": "main",
    "environment": "production"
  }
}
```

**Response:**
```json
{
  "executionId": "exec_789"
}
```

**Status Codes:**
- `200 OK` - Workflow started
- `500 Internal Server Error` - Execution failed

---

#### Get Execution History

Get execution history for a workflow.

**Endpoint:** `GET /api/workflows/:sessionId/:workflowId/executions`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `workflowId` (string, required) - Workflow ID

**Response:**
```json
{
  "executions": [
    {
      "id": "exec_789",
      "status": "completed",
      "startedAt": "2025-01-07T10:00:00.000Z",
      "completedAt": "2025-01-07T10:05:00.000Z",
      "duration": 300000
    }
  ]
}
```

**Status Codes:**
- `200 OK` - History retrieved
- `500 Internal Server Error` - Retrieval failed

---

#### Get Execution Status

Get status of a specific execution.

**Endpoint:** `GET /api/workflows/:sessionId/:workflowId/executions/:executionId`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `workflowId` (string, required) - Workflow ID
- `executionId` (string, required) - Execution ID

**Response:**
```json
{
  "id": "exec_789",
  "status": "running",
  "currentStep": 3,
  "totalSteps": 5,
  "startedAt": "2025-01-07T10:00:00.000Z",
  "stepResults": [
    {
      "stepId": "step_1",
      "status": "completed",
      "output": "All tests passed"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Execution status retrieved
- `404 Not Found` - Execution not found
- `500 Internal Server Error` - Retrieval failed

---

#### Cancel Execution

Cancel a running workflow execution.

**Endpoint:** `POST /api/workflows/:sessionId/:workflowId/executions/:executionId/cancel`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `workflowId` (string, required) - Workflow ID
- `executionId` (string, required) - Execution ID

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Execution cancelled
- `500 Internal Server Error` - Cancellation failed

---

### Workflow Suggestions

#### Get Workflow Suggestions

Get AI-powered workflow suggestions based on context.

**Endpoint:** `POST /api/workflows/:sessionId/suggest`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "currentTask": "deploying application",
  "technologies": ["Node.js", "Docker", "AWS"]
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "workflow": {
        "name": "Docker Deploy to AWS",
        "description": "Build Docker image and deploy to ECS",
        "tags": ["docker", "aws", "deployment"]
      },
      "score": 0.95,
      "reason": "Matches your current stack (Docker + AWS)"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Suggestions generated
- `500 Internal Server Error` - Generation failed

---

#### Get Built-in Workflows

Get list of built-in workflow templates.

**Endpoint:** `GET /api/workflows/:sessionId/builtin`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "workflows": [
    {
      "id": "builtin_ci",
      "name": "Continuous Integration",
      "description": "Run tests, linting, and build",
      "category": "ci-cd"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Built-in workflows retrieved
- `500 Internal Server Error` - Retrieval failed

---

## PydanticAI API

Manage and execute PydanticAI agents for structured AI tasks.

### Agent Management

#### List All Agents

Get all PydanticAI agents for a session.

**Endpoint:** `GET /api/pydantic-ai/:sessionId/agents`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "agents": [
    {
      "id": "agent_123",
      "name": "Code Analyzer",
      "description": "Analyzes code quality",
      "model": "claude-3-5-sonnet-20241022",
      "resultType": "structured"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Agents retrieved
- `500 Internal Server Error` - Retrieval failed

---

#### Create Agent

Create a new PydanticAI agent.

**Endpoint:** `POST /api/pydantic-ai/:sessionId/agents`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Request Body:**
```json
{
  "name": "Code Analyzer",
  "description": "Analyzes code quality",
  "model": "claude-3-5-sonnet-20241022",
  "systemPrompt": "You are a code quality analyzer...",
  "resultType": "structured",
  "tools": ["file_reader", "ast_parser"]
}
```

**Response:**
```json
{
  "agentId": "agent_456"
}
```

**Status Codes:**
- `200 OK` - Agent created
- `500 Internal Server Error` - Creation failed

---

#### Get Agent

Get details for a specific agent.

**Endpoint:** `GET /api/pydantic-ai/:sessionId/agents/:agentId`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `agentId` (string, required) - Agent ID

**Response:**
```json
{
  "id": "agent_123",
  "name": "Code Analyzer",
  "description": "Analyzes code quality",
  "model": "claude-3-5-sonnet-20241022",
  "systemPrompt": "You are a code quality analyzer...",
  "resultType": "structured",
  "tools": ["file_reader", "ast_parser"],
  "createdAt": "2025-01-07T10:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Agent retrieved
- `404 Not Found` - Agent not found
- `500 Internal Server Error` - Retrieval failed

---

#### Delete Agent

Delete a PydanticAI agent.

**Endpoint:** `DELETE /api/pydantic-ai/:sessionId/agents/:agentId`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `agentId` (string, required) - Agent ID

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Agent deleted
- `500 Internal Server Error` - Deletion failed

---

### Agent Execution

#### Execute Agent

Execute a PydanticAI agent with a prompt.

**Endpoint:** `POST /api/pydantic-ai/:sessionId/agents/:agentId/execute`

**Parameters:**
- `sessionId` (string, required) - Session ID
- `agentId` (string, required) - Agent ID

**Request Body:**
```json
{
  "userPrompt": "Analyze the authentication module",
  "deps": {
    "filePath": "./src/auth.ts"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "quality_score": 8.5,
    "issues": ["Missing input validation", "No error handling"],
    "suggestions": ["Add try-catch blocks", "Validate user input"]
  },
  "usage": {
    "inputTokens": 1500,
    "outputTokens": 250
  }
}
```

**Status Codes:**
- `200 OK` - Agent executed successfully
- `500 Internal Server Error` - Execution failed

---

### Example Agents

#### Initialize Example Agents

Create example agents for demonstration.

**Endpoint:** `POST /api/pydantic-ai/:sessionId/init-examples`

**Parameters:**
- `sessionId` (string, required) - Session ID

**Response:**
```json
{
  "success": true,
  "agentIds": ["agent_example_1", "agent_example_2"]
}
```

**Status Codes:**
- `200 OK` - Example agents created
- `500 Internal Server Error` - Creation failed

---

## Directory Management API

Manage and validate file system directories.

### Validate Directory

Validate a directory path.

**Endpoint:** `POST /api/validate-directory`

**Request Body:**
```json
{
  "directory": "~/projects/my-app"
}
```

**Response:**
```json
{
  "valid": true,
  "expanded": "/home/user/projects/my-app",
  "error": null
}
```

**Status Codes:**
- `200 OK` - Validation completed

---

### Pick Directory

Open a native directory picker dialog.

**Endpoint:** `POST /api/pick-directory`

**Response:**
```json
{
  "success": true,
  "path": "/home/user/projects/my-app"
}
```

**Error Response:**
```json
{
  "success": false,
  "cancelled": true
}
```

**Status Codes:**
- `200 OK` - Directory selected or cancelled
- `500 Internal Server Error` - Picker failed

---

### Open Chat Folder

Open the chat folder in system file explorer.

**Endpoint:** `POST /api/open-chat-folder`

**Response:**
```json
{
  "success": true,
  "path": "/home/user/.claude-code/sessions"
}
```

**Status Codes:**
- `200 OK` - Folder opened
- `500 Internal Server Error` - Failed to open folder

---

## Commands API

Manage slash commands available in chat sessions.

### Get Session Commands

Get all available slash commands for a session.

**Endpoint:** `GET /api/sessions/:id/commands`

**Parameters:**
- `id` (string, required) - Session ID

**Response:**
```json
{
  "commands": [
    {
      "name": "clear",
      "description": "Clear conversation history and start fresh",
      "argumentHint": ""
    },
    {
      "name": "compact",
      "description": "Compact conversation history to reduce token usage",
      "argumentHint": ""
    },
    {
      "name": "fix",
      "description": "Run typechecking and linting, then fix issues",
      "argumentHint": "[file-pattern]"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Commands retrieved
- `404 Not Found` - Session not found

**Example:**
```typescript
const response = await fetch('http://localhost:3003/api/sessions/session_123/commands');
const { commands } = await response.json();
```

---

## User Configuration API

Retrieve user configuration and preferences.

### Get User Config

Get current user configuration.

**Endpoint:** `GET /api/user-config`

**Response:**
```json
{
  "displayName": "John Doe",
  "theme": "dark",
  "apiKeys": {
    "anthropic": "sk-ant-***"
  },
  "preferences": {
    "autoCompact": true,
    "contextThreshold": 0.8
  }
}
```

**Status Codes:**
- `200 OK` - Configuration retrieved

---

## WebSocket Protocol

Real-time bidirectional communication for chat interactions.

### Connection

**WebSocket URL:** `ws://localhost:3003/ws`

**Connection Example:**
```typescript
const ws = new WebSocket('ws://localhost:3003/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMessage(data);
};
```

---

### Message Types

#### Client → Server Messages

##### Chat Message

Send a user message to Claude.

```json
{
  "type": "chat",
  "sessionId": "session_123",
  "content": "Hello, Claude!",
  "model": "sonnet",
  "timezone": "America/New_York"
}
```

**Parameters:**
- `type` - Always "chat"
- `sessionId` - Session ID
- `content` - Message content (string or array of content blocks)
- `model` - Model ID (e.g., "sonnet", "opus")
- `timezone` - User's timezone (optional)

**Content Blocks (for attachments):**
```json
{
  "type": "chat",
  "sessionId": "session_123",
  "content": [
    {
      "type": "text",
      "text": "Analyze this image"
    },
    {
      "type": "image",
      "source": {
        "type": "base64",
        "media_type": "image/png",
        "data": "iVBORw0KGgoAAAANS..."
      }
    },
    {
      "type": "document",
      "name": "data.csv",
      "data": "base64encodedfile..."
    }
  ],
  "model": "sonnet"
}
```

---

##### Approve Plan

Approve a plan and continue execution.

```json
{
  "type": "approve_plan",
  "sessionId": "session_123"
}
```

---

##### Set Permission Mode

Change permission mode mid-stream.

```json
{
  "type": "set_permission_mode",
  "sessionId": "session_123",
  "mode": "bypassPermissions"
}
```

**Modes:**
- `default` - Ask for permission
- `acceptEdits` - Auto-accept file edits
- `bypassPermissions` - Auto-approve all actions
- `plan` - Plan mode (generate plan before execution)

---

##### Kill Background Process

Terminate a background process.

```json
{
  "type": "kill_background_process",
  "bashId": "bg-123456"
}
```

---

##### Stop Generation

Stop AI response generation.

```json
{
  "type": "stop_generation",
  "sessionId": "session_123"
}
```

---

##### AI Request

Request AI services via WebSocket.

```json
{
  "type": "ai_request",
  "sessionId": "session_123",
  "action": "generate_suggestions",
  "payload": {
    "currentTask": "Building API"
  }
}
```

**Actions:**
- `generate_suggestions` - Generate AI suggestions
- `search_knowledge` - Search knowledge base
- `track_habit` - Track habit completion
- `get_learning_profile` - Get learning profile

---

##### Python Request

Execute Python operations via WebSocket.

```json
{
  "type": "python_request",
  "sessionId": "session_123",
  "action": "execute_code",
  "payload": {
    "code": "print('Hello')",
    "envId": "myenv"
  }
}
```

**Actions:**
- `list_environments` - List Python environments
- `create_environment` - Create new environment
- `execute_code` - Execute Python code
- `install_package` - Install package

---

##### Workflow Request

Execute workflow operations via WebSocket.

```json
{
  "type": "workflow_request",
  "sessionId": "session_123",
  "action": "execute_workflow",
  "payload": {
    "workflowId": "wf_123",
    "input": { "branch": "main" }
  }
}
```

**Actions:**
- `list_workflows` - List workflows
- `execute_workflow` - Execute workflow
- `get_execution_status` - Get execution status
- `cancel_execution` - Cancel execution
- `suggest_workflows` - Get suggestions

---

#### Server → Client Messages

##### Assistant Message

Streaming text from Claude.

```json
{
  "type": "assistant_message",
  "content": "Hello! How can I help you today?",
  "sessionId": "session_123"
}
```

---

##### Thinking Delta

Claude's internal reasoning (extended thinking).

```json
{
  "type": "thinking_delta",
  "content": "Analyzing the problem...",
  "sessionId": "session_123"
}
```

---

##### Thinking Start

Start of thinking block.

```json
{
  "type": "thinking_start",
  "sessionId": "session_123"
}
```

---

##### Tool Use

Claude is using a tool.

```json
{
  "type": "tool_use",
  "toolId": "tool_123",
  "toolName": "Bash",
  "toolInput": {
    "command": "npm install",
    "description": "Install dependencies"
  },
  "sessionId": "session_123"
}
```

---

##### Long Running Command Started

A long-running command has started.

```json
{
  "type": "long_running_command_started",
  "bashId": "bg-123456",
  "command": "npm install",
  "commandType": "install",
  "description": "Install dependencies",
  "startedAt": 1704628800000
}
```

---

##### Command Output Chunk

Streaming output from long-running command.

```json
{
  "type": "command_output_chunk",
  "bashId": "bg-123456",
  "output": "added 142 packages\n"
}
```

---

##### Long Running Command Completed

Long-running command finished.

```json
{
  "type": "long_running_command_completed",
  "bashId": "bg-123456",
  "exitCode": 0
}
```

---

##### Long Running Command Failed

Long-running command failed.

```json
{
  "type": "long_running_command_failed",
  "bashId": "bg-123456",
  "error": "Command timed out"
}
```

---

##### Background Process Started

Background process started (e.g., dev server).

```json
{
  "type": "background_process_started",
  "bashId": "bg-123456",
  "command": "npm run dev",
  "description": "Start dev server",
  "startedAt": 1704628800000
}
```

---

##### Background Process Killed

Background process terminated.

```json
{
  "type": "background_process_killed",
  "bashId": "bg-123456"
}
```

---

##### Exit Plan Mode

Claude has generated a plan and is requesting approval.

```json
{
  "type": "exit_plan_mode",
  "plan": "1. Run tests\n2. Build project\n3. Deploy",
  "sessionId": "session_123"
}
```

---

##### Permission Mode Changed

Permission mode was changed.

```json
{
  "type": "permission_mode_changed",
  "mode": "bypassPermissions"
}
```

---

##### Context Usage

Token usage update.

```json
{
  "type": "context_usage",
  "inputTokens": 5000,
  "outputTokens": 250,
  "contextWindow": 200000,
  "contextPercentage": 2.5,
  "sessionId": "session_123"
}
```

---

##### Token Update

Estimated token count during streaming.

```json
{
  "type": "token_update",
  "outputTokens": 125,
  "sessionId": "session_123"
}
```

---

##### Compact Loading

Compact operation starting.

```json
{
  "type": "compact_loading",
  "sessionId": "session_123"
}
```

---

##### Compact Start

Auto-compact started.

```json
{
  "type": "compact_start",
  "trigger": "auto",
  "preTokens": 180000,
  "sessionId": "session_123"
}
```

---

##### Compact Complete

Compact operation completed.

```json
{
  "type": "compact_complete",
  "preTokens": 180000,
  "sessionId": "session_123"
}
```

---

##### Result

Turn completed.

```json
{
  "type": "result",
  "success": true,
  "sessionId": "session_123"
}
```

---

##### Generation Stopped

Generation stopped by user.

```json
{
  "type": "generation_stopped",
  "sessionId": "session_123"
}
```

---

##### Keepalive

Keepalive ping to prevent timeout.

```json
{
  "type": "keepalive",
  "elapsedSeconds": 45,
  "sessionId": "session_123"
}
```

---

##### Timeout Warning

Operation taking longer than expected.

```json
{
  "type": "timeout_warning",
  "message": "AI is taking longer than usual...",
  "elapsedSeconds": 60,
  "sessionId": "session_123"
}
```

---

##### Retry Attempt

API request being retried.

```json
{
  "type": "retry_attempt",
  "attempt": 2,
  "maxAttempts": 3,
  "delayMs": 4000,
  "errorType": "rate_limit_error",
  "message": "Retrying... (attempt 2/3)",
  "sessionId": "session_123"
}
```

---

##### Error

Error occurred.

```json
{
  "type": "error",
  "errorType": "invalid_api_key",
  "message": "Invalid API key. Please check your configuration.",
  "requestId": "req_abc123",
  "sessionId": "session_123"
}
```

**Error Types:**
- `invalid_api_key` - Invalid or missing API key
- `authentication_error` - Authentication failed
- `rate_limit_error` - Rate limit exceeded
- `insufficient_credits` - Insufficient API credits
- `model_not_found` - Model not available
- `timeout` - Operation timed out
- `network_error` - Network connectivity issue
- `internal_error` - Internal server error

---

##### AI Response

Response to AI request.

```json
{
  "type": "ai_response",
  "action": "suggestions_generated",
  "data": {
    "suggestions": [/* ... */]
  }
}
```

---

##### Python Response

Response to Python request.

```json
{
  "type": "python_response",
  "action": "code_executed",
  "data": {
    "success": true,
    "output": "Hello, World!"
  }
}
```

---

##### Workflow Response

Response to workflow request.

```json
{
  "type": "workflow_response",
  "action": "workflow_started",
  "data": {
    "executionId": "exec_789"
  }
}
```

---

## Error Responses

All error responses follow a consistent format.

### Standard Error Response

```json
{
  "error": "Error message",
  "errorType": "invalid_api_key",
  "requestId": "req_abc123"
}
```

### Common HTTP Status Codes

- `200 OK` - Request succeeded
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Types

| Error Type | Description | HTTP Status | Retryable |
|------------|-------------|-------------|-----------|
| `invalid_api_key` | Invalid or missing API key | 401 | No |
| `authentication_error` | Authentication failed | 401 | No |
| `permission_denied` | Insufficient permissions | 403 | No |
| `rate_limit_error` | Rate limit exceeded | 429 | Yes |
| `insufficient_credits` | Insufficient API credits | 402 | No |
| `model_not_found` | Model not available | 404 | No |
| `timeout` | Operation timed out | 408 | Yes |
| `network_error` | Network connectivity issue | 503 | Yes |
| `internal_error` | Internal server error | 500 | Yes |
| `overloaded_error` | API server overloaded | 529 | Yes |

### Retry Strategy

For retryable errors, the API implements exponential backoff:

- **Initial delay:** 2 seconds
- **Backoff multiplier:** 2x
- **Max retries:** 3
- **Max delay:** 16 seconds

Rate limit errors respect the `Retry-After` header when provided.

---

## Rate Limits

Rate limits vary by API provider and model. The API automatically handles rate limiting with retries.

**Headers:**
- `X-RateLimit-Limit` - Maximum requests per time window
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - Time when rate limit resets (Unix timestamp)
- `Retry-After` - Seconds to wait before retrying (on 429 errors)

---

## Examples

### Complete Chat Session Example

```typescript
// 1. Create session
const sessionResponse = await fetch('http://localhost:3003/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Code Review',
    mode: 'coder'
  })
});
const { id: sessionId } = await sessionResponse.json();

// 2. Connect WebSocket
const ws = new WebSocket('ws://localhost:3003/ws');

ws.onopen = () => {
  // 3. Send message
  ws.send(JSON.stringify({
    type: 'chat',
    sessionId: sessionId,
    content: 'Review the authentication code',
    model: 'sonnet'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'assistant_message':
      console.log('Claude:', data.content);
      break;
    case 'tool_use':
      console.log('Tool:', data.toolName, data.toolInput);
      break;
    case 'result':
      console.log('Turn complete');
      break;
    case 'error':
      console.error('Error:', data.message);
      break;
  }
};

// 4. Clean up
ws.close();
await fetch(`http://localhost:3003/api/sessions/${sessionId}`, {
  method: 'DELETE'
});
```

---

### Python Environment Setup Example

```typescript
// List Python versions
const versionsResponse = await fetch(
  'http://localhost:3003/api/python/versions?sessionId=session_123'
);
const { versions } = await versionsResponse.json();

// Create virtual environment
await fetch('http://localhost:3003/api/python/environments/create?sessionId=session_123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'myenv',
    type: 'venv',
    pythonVersion: '3.11'
  })
});

// Activate environment
await fetch('http://localhost:3003/api/python/environments/activate?sessionId=session_123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'myenv'
  })
});

// Install packages
await fetch('http://localhost:3003/api/python/packages/install?sessionId=session_123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    packages: ['requests', 'numpy', 'pandas']
  })
});
```

---

### Workflow Execution Example

```typescript
// Create workflow
const createResponse = await fetch('http://localhost:3003/api/workflows/session_123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'CI Pipeline',
    description: 'Run tests and build',
    steps: [
      {
        id: 'test',
        name: 'Run Tests',
        type: 'command',
        config: { command: 'npm test' }
      },
      {
        id: 'build',
        name: 'Build',
        type: 'command',
        config: { command: 'npm run build' }
      }
    ]
  })
});
const { workflowId } = await createResponse.json();

// Execute workflow
const executeResponse = await fetch(
  `http://localhost:3003/api/workflows/session_123/${workflowId}/execute`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { branch: 'main' }
    })
  }
);
const { executionId } = await executeResponse.json();

// Poll for status
const checkStatus = async () => {
  const statusResponse = await fetch(
    `http://localhost:3003/api/workflows/session_123/${workflowId}/executions/${executionId}`
  );
  const execution = await statusResponse.json();

  if (execution.status === 'running') {
    setTimeout(checkStatus, 1000);
  } else {
    console.log('Workflow completed:', execution);
  }
};

checkStatus();
```

---

## Changelog

### Version 1.0.0 (2025-01-07)

Initial release with:
- Sessions API (8 endpoints)
- AI Services API (15 endpoints)
- Python Management API (18 endpoints)
- Workflow Orchestration API (10 endpoints)
- PydanticAI API (6 endpoints)
- Directory Management API (3 endpoints)
- Commands API (1 endpoint)
- User Configuration API (1 endpoint)
- WebSocket Protocol (40+ message types)

**Total Endpoints:** 62+ REST endpoints + WebSocket protocol

---

## Support

For issues and questions:
- GitHub Issues: [Agent Ironman Issues](https://github.com/your-repo/agent-ironman/issues)
- Documentation: [Agent Ironman Docs](https://github.com/your-repo/agent-ironman/docs)

---

**Generated:** 2025-01-07
**Last Updated:** 2025-01-07
**API Version:** 1.0.0
