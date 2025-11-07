# Workflow Orchestration System

<metadata>
purpose: Complete guide to the Agent Ironman workflow orchestration system
type: system-documentation
language: TypeScript
dependencies: ["@anthropic-ai/claude-agent-sdk"]
last-updated: 2025-11-07
</metadata>

<overview>
The Workflow Orchestration System enables automated, multi-agent task execution with sophisticated dependency management, parallel execution, and intelligent error handling. The system coordinates multiple AI agents to complete complex development tasks through structured workflows with configurable triggers, steps, and error recovery strategies.
</overview>

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Workflow Definition Structure](#workflow-definition-structure)
4. [Trigger Types](#trigger-types)
5. [Step Dependencies and Execution](#step-dependencies-and-execution)
6. [Built-in Workflows](#built-in-workflows)
7. [API Reference](#api-reference)
8. [Creating Custom Workflows](#creating-custom-workflows)
9. [Error Handling Strategies](#error-handling-strategies)
10. [Code Examples](#code-examples)

---

## Architecture Overview

<architecture>
The workflow system consists of three primary layers:

1. **WorkflowEngine** - Core orchestration logic, workflow lifecycle management, scheduling
2. **WorkflowOrchestrator** - Agent execution bridge, connects workflows to agent system
3. **BuiltinWorkflows** - Pre-configured workflows for common development tasks

```
┌─────────────────────────────────────────────────────────┐
│                    Workflow Engine                      │
│  - Workflow Registry                                    │
│  - Execution Management                                 │
│  - Scheduling & Triggers                                │
│  - Learning & Optimization                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                Workflow Orchestrator                    │
│  - Agent Execution                                      │
│  - Step Coordination                                    │
│  - Context Management                                   │
│  - Input/Output Mapping                                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   Agent System                          │
│  Regular Agents  │  Python Agents  │  Specialized Tools │
└─────────────────────────────────────────────────────────┘
```
</architecture>

---

## Core Components

### WorkflowEngine (workflowEngine.ts)

<component name="WorkflowEngine">
  <purpose>Central orchestrator for workflow lifecycle management</purpose>

  <responsibilities>
    - Create, validate, and store workflow definitions
    - Execute workflows with proper context and dependencies
    - Manage active executions and cancellation
    - Schedule recurring workflows with cron expressions
    - Suggest relevant workflows based on context
    - Learn from execution patterns to improve success rates
  </responsibilities>

  <key-methods>
    - createWorkflow(definition): Create new workflow
    - executeWorkflow(workflowId, triggerContext, initialVariables): Start execution
    - scheduleWorkflow(workflowId, cronSchedule, timezone): Schedule recurring execution
    - getWorkflows(category?): List available workflows
    - suggestWorkflows(context): AI-powered workflow suggestions
    - cancelExecution(executionId): Stop running workflow
  </key-methods>
</component>

### WorkflowOrchestrator (workflowOrchestrator.ts)

<component name="WorkflowOrchestrator">
  <purpose>Bridge between workflow steps and agent execution system</purpose>

  <responsibilities>
    - Execute individual workflow steps with appropriate agents
    - Build context-aware system prompts for agents
    - Handle both regular and Python agents
    - Extract structured output from agent responses
    - Manage Python environments for data science workflows
  </responsibilities>

  <key-methods>
    - executeStep(step, context): Execute single workflow step
    - executeAgent(agentType, input, context): Run agent with input
    - executeRegularAgent(): Handle standard agents
    - executePythonAgent(): Handle Python-specific agents
    - buildWorkflowSystemPrompt(): Create context-aware prompts
  </key-methods>
</component>

### BuiltinWorkflows (builtinWorkflows.ts)

<component name="BuiltinWorkflows">
  <purpose>Pre-configured workflows for common development scenarios</purpose>

  <categories>
    - Development: Code commits, project setup
    - Analysis: Data analysis, ML training
    - Testing: Comprehensive test generation and execution
    - Maintenance: Dependency updates, code quality audits
  </categories>

  <count>7 production-ready workflows</count>
</component>

---

## Workflow Definition Structure

<schema name="WorkflowDefinition">

```typescript
interface WorkflowDefinition {
  // Identification
  id: string;                    // Unique workflow identifier
  name: string;                  // Human-readable name
  description: string;           // What this workflow does

  // Classification
  category: 'development' | 'deployment' | 'testing' | 'maintenance' | 'analysis' | 'custom';
  version: string;               // Semantic versioning
  author: 'system' | 'user';     // Built-in or custom

  // Configuration
  trigger: WorkflowTrigger;      // When to execute
  steps: WorkflowStep[];         // Sequential/parallel steps

  // Optional Features
  conditions?: WorkflowCondition[];          // Complex conditional logic
  errorHandling?: WorkflowErrorHandling;     // Error recovery strategy

  // Metadata
  tags: string[];                // Searchable tags
  estimatedDuration: number;     // Minutes (for UI/planning)
  successRate?: number;          // Learned success percentage

  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

</schema>

### Workflow Steps

<schema name="WorkflowStep">

```typescript
interface WorkflowStep {
  // Identification
  id: string;                    // Unique step ID within workflow
  name: string;                  // Human-readable step name
  description: string;           // What this step accomplishes

  // Agent Configuration
  agent: string;                 // Agent type to execute
  agentInput: Record<string, any>; // Input parameters for agent

  // Execution Control
  timeout?: number;              // Seconds before timeout
  retries?: number;              // Retry attempts on failure
  retryDelay?: number;           // Seconds between retries

  // Dependencies
  dependsOn?: string[];          // Step IDs that must complete first
  condition?: string;            // JavaScript expression for conditional execution

  // Data Flow
  inputMapping?: Record<string, string>;   // Map previous outputs to inputs
  outputMapping?: Record<string, string>;  // Map outputs for next steps

  // Parallel Execution
  parallel?: boolean;            // Can run in parallel with others
  parallelGroup?: string;        // Group identifier for parallel steps
}
```

**Input/Output Mapping Example:**

```typescript
{
  inputMapping: {
    'commitMessage': 'generate-commit-message.output.message',
    'reviewFindings': 'review-staged.output.findings'
  }
}
```

Format: `'targetKey': 'sourceStepId.output.path.to.value'`

</schema>

---

## Trigger Types

<triggers>

### 1. Manual Trigger

<trigger type="manual">
  <description>User-initiated execution via API or UI</description>
  <use-cases>
    - On-demand workflows
    - User-controlled processes
    - Interactive development tasks
  </use-cases>

  <config>
    ```typescript
    {
      type: 'manual',
      config: {}  // No additional configuration
    }
    ```
  </config>
</trigger>

### 2. Git Event Trigger

<trigger type="git-event">
  <description>Triggered by Git operations (push, commit, PR, merge)</description>
  <use-cases>
    - Automated testing on push
    - Code review on pull requests
    - Deployment on merge to main
  </use-cases>

  <config>
    ```typescript
    {
      type: 'git-event',
      config: {
        gitEvents: ['push', 'commit', 'pull-request', 'merge'],
        gitBranches: ['main', 'develop', 'feature/*']
      }
    }
    ```
  </config>

  <example>
    ```typescript
    trigger: {
      type: 'git-event',
      config: {
        gitEvents: ['push', 'pull-request'],
        gitBranches: ['main', 'develop']
      }
    }
    // Triggers on push or PR to main/develop branches
    ```
  </example>
</trigger>

### 3. File Change Trigger

<trigger type="file-change">
  <description>Triggered when specified files are modified</description>
  <use-cases>
    - Auto-analyze new data files
    - Regenerate documentation on code changes
    - Run tests when test files change
  </use-cases>

  <config>
    ```typescript
    {
      type: 'file-change',
      config: {
        filePatterns: ['**/*.csv', '**/*.json', 'src/**/*.ts'],
        ignorePatterns: ['*_backup.*', 'temp_*', 'node_modules/**'],
        watchSubdirectories: true
      }
    }
    ```
  </config>

  <example>
    ```typescript
    trigger: {
      type: 'file-change',
      config: {
        filePatterns: ['**/*.csv', '**/*.json', '**/*.xlsx'],
        ignorePatterns: ['*_backup.*', 'temp_*'],
        watchSubdirectories: true
      }
    }
    // Triggers when data files are added/modified
    ```
  </example>
</trigger>

### 4. Schedule Trigger

<trigger type="schedule">
  <description>Time-based execution using cron expressions</description>
  <use-cases>
    - Weekly dependency updates
    - Daily backups
    - Regular code quality audits
  </use-cases>

  <config>
    ```typescript
    {
      type: 'schedule',
      config: {
        cronSchedule: '0 9 * * 1',  // Monday 9 AM
        timezone: 'UTC'
      }
    }
    ```
  </config>

  <cron-examples>
    - '0 9 * * 1': Every Monday at 9:00 AM
    - '0 */6 * * *': Every 6 hours
    - '0 0 * * 0': Every Sunday at midnight
    - '30 14 1 * *': First day of month at 2:30 PM
  </cron-examples>
</trigger>

### 5. Conversation Trigger

<trigger type="conversation">
  <description>Triggered by keywords or patterns in user conversation</description>
  <use-cases>
    - Suggest workflows based on user intent
    - Auto-start workflows from natural language
    - Context-aware automation
  </use-cases>

  <config>
    ```typescript
    {
      type: 'conversation',
      config: {
        keywords: ['deploy', 'test', 'analyze'],
        agentTypes: ['general-purpose', 'code-reviewer'],
        confidence: 0.8  // 0-1 threshold for trigger
      }
    }
    ```
  </config>
</trigger>

### 6. Error Trigger

<trigger type="error">
  <description>Triggered when specific errors occur in the system</description>
  <use-cases>
    - Auto-debug on test failures
    - Recovery workflows for known errors
    - Incident response automation
  </use-cases>

  <config>
    ```typescript
    {
      type: 'error',
      config: {
        errorTypes: ['TypeError', 'ValidationError', 'DatabaseError'],
        errorPatterns: ['connection refused', 'timeout', 'permission denied']
      }
    }
    ```
  </config>
</trigger>

</triggers>

---

## Step Dependencies and Execution

### Sequential Execution

<execution-model type="sequential">

Steps with `dependsOn` execute only after dependencies complete:

```typescript
steps: [
  {
    id: 'step-1',
    name: 'First Step',
    agent: 'researcher',
    agentInput: { action: 'analyze' }
  },
  {
    id: 'step-2',
    name: 'Second Step',
    agent: 'code-reviewer',
    agentInput: { action: 'review' },
    dependsOn: ['step-1']  // Waits for step-1
  },
  {
    id: 'step-3',
    name: 'Third Step',
    agent: 'documenter',
    agentInput: { action: 'document' },
    dependsOn: ['step-2']  // Waits for step-2
  }
]
```

Execution Order: `step-1 → step-2 → step-3`

</execution-model>

### Parallel Execution

<execution-model type="parallel">

Steps without dependencies or in the same parallelGroup run concurrently:

```typescript
steps: [
  {
    id: 'setup-env',
    name: 'Setup Environment',
    agent: 'general-purpose',
    agentInput: { action: 'setup' }
  },
  {
    id: 'unit-tests',
    name: 'Generate Unit Tests',
    agent: 'test-writer',
    agentInput: { testType: 'unit' },
    dependsOn: ['setup-env'],
    parallel: true,
    parallelGroup: 'test-generation'
  },
  {
    id: 'integration-tests',
    name: 'Generate Integration Tests',
    agent: 'test-writer',
    agentInput: { testType: 'integration' },
    dependsOn: ['setup-env'],
    parallel: true,
    parallelGroup: 'test-generation'
  },
  {
    id: 'run-all-tests',
    name: 'Run All Tests',
    agent: 'general-purpose',
    agentInput: { action: 'test' },
    dependsOn: ['unit-tests', 'integration-tests']
  }
]
```

Execution Flow:
```
setup-env
    ├─→ unit-tests ───┐
    └─→ integration-tests ─┘
            ↓
        run-all-tests
```

Benefits:
- Faster workflow completion
- Efficient resource utilization
- Independent tasks don't block each other

</execution-model>

### Conditional Execution

<execution-model type="conditional">

Steps with conditions evaluate before execution:

```typescript
{
  id: 'deploy-production',
  name: 'Deploy to Production',
  agent: 'deployment-specialist',
  agentInput: { target: 'production' },
  condition: 'context.variables.branch === "main" && context.variables.testsPass === true',
  dependsOn: ['run-tests']
}
```

Condition evaluation:
- Has access to `context.variables`
- Has access to previous step results via `context.stepResults`
- JavaScript expression that returns boolean
- If false, step is marked as 'skipped'

</execution-model>

---

## Built-in Workflows

### 1. Smart Git Commit Automation

<workflow id="smart-commit-automation">
  <category>Development</category>
  <duration>3 minutes</duration>
  <success-rate>95%</success-rate>

  <description>
  Automatically stage relevant changes, review for issues, generate intelligent commit messages, and create commits following conventional commit format.
  </description>

  <steps>
    1. **Stage Changes** - Stage relevant source files, exclude build artifacts
    2. **Review Staged Changes** - Analyze for security, performance, best practices
    3. **Generate Commit Message** - Create conventional commit message with scope
    4. **Create Commit** - Execute git commit with generated message
  </steps>

  <trigger>Manual</trigger>

  <agents-used>
    - git-specialist
    - code-reviewer
    - documenter
  </agents-used>

  <example-usage>
    ```bash
    POST /api/workflows/:sessionId/smart-commit-automation/execute
    {
      "initialVariables": {
        "commitScope": "feat",
        "focusFiles": ["src/**/*.ts"]
      }
    }
    ```
  </example-usage>
</workflow>

### 2. Python API Project Setup

<workflow id="project-setup-python-api">
  <category>Development</category>
  <duration>10 minutes</duration>
  <success-rate>98%</success-rate>

  <description>
  Complete Python FastAPI project initialization with best practices, testing infrastructure, documentation, Docker setup, and configured virtual environment.
  </description>

  <steps>
    1. **Research Requirements** - Latest FastAPI patterns and best practices
    2. **Create Structure** - Project folders, modules, API structure
    3. **Setup Configs** - pyproject.toml, .env.example, .gitignore, docker-compose.yml
    4. **Create Tests** - Pytest suite with unit, integration, API tests
    5. **Setup Environment** - Virtual environment with all dependencies
  </steps>

  <trigger>Manual</trigger>

  <agents-used>
    - build-researcher
    - python-backend-developer
    - config-writer
    - python-test-engineer
    - PythonEnvironmentManage
  </agents-used>

  <output>
    - Complete FastAPI project structure
    - Configured virtual environment
    - Test suite ready to run
    - Docker configuration
    - Documentation templates
  </output>
</workflow>

### 3. Automated Data Analysis Pipeline

<workflow id="data-analysis-pipeline">
  <category>Analysis</category>
  <duration>15 minutes</duration>
  <success-rate>92%</success-rate>

  <description>
  Complete data analysis workflow triggered by new data files. Loads data, performs exploration, creates visualizations, and generates comprehensive analysis report.
  </description>

  <steps>
    1. **Detect Data File** - Identify and validate new data file
    2. **Setup Python Env** - Ensure pandas, numpy, matplotlib, seaborn, plotly
    3. **Load and Explore** - Load data, generate summary statistics, detect issues
    4. **Create Visualizations** - Distribution, correlation, categorical charts
    5. **Generate Report** - Comprehensive markdown report with embedded charts
  </steps>

  <trigger>
    File Change
    - Patterns: **/*.csv, **/*.json, **/*.xlsx
    - Excludes: *_backup.*, temp_*
  </trigger>

  <agents-used>
    - researcher
    - python-data-scientist
    - documenter
    - PythonEnvironmentManage
  </agents-used>

  <output>
    - Data summary statistics
    - Multiple visualization images
    - Markdown analysis report
    - Data quality assessment
  </output>
</workflow>

### 4. Machine Learning Model Training Pipeline

<workflow id="ml-model-training">
  <category>Analysis</category>
  <duration>25 minutes</duration>
  <success-rate>88%</success-rate>

  <description>
  Complete ML workflow from data preparation through model evaluation. Includes feature engineering, model selection with hyperparameter tuning, cross-validation, and performance analysis.
  </description>

  <steps>
    1. **Analyze Dataset** - ML suitability, feature analysis, target variable
    2. **Setup ML Environment** - scikit-learn, pandas, numpy, joblib
    3. **Feature Engineering** - Scaling, selection, encoding
    4. **Model Selection** - Train multiple algorithms with hyperparameter tuning
    5. **Evaluate Models** - Compare performance metrics, cross-validation
    6. **Generate ML Report** - Model cards, recommendations, best model
  </steps>

  <trigger>Manual</trigger>

  <agents-used>
    - python-data-scientist
    - python-ml-engineer
    - documenter
    - PythonEnvironmentManage
  </agents-used>

  <algorithms>
    - Random Forest
    - Gradient Boosting
    - Logistic Regression
  </algorithms>

  <metrics>
    - Accuracy
    - Precision
    - Recall
    - F1-Score
    - ROC-AUC
  </metrics>
</workflow>

### 5. Comprehensive Testing Workflow

<workflow id="comprehensive-testing">
  <category>Testing</category>
  <duration>20 minutes</duration>
  <success-rate>94%</success-rate>

  <description>
  Complete test suite generation and execution. Analyzes project, generates unit and integration tests, sets up test environment, runs tests with coverage, and validates results against quality gates.
  </description>

  <steps>
    1. **Analyze Project** - Identify testing needs, test gaps, suggested types
    2. **Generate Unit Tests** - High coverage, mocking, edge cases
    3. **Generate Integration Tests** - Critical paths, database, API testing
    4. **Setup Test Environment** - Dependencies, database, configuration
    5. **Run Tests** - Execute with coverage, parallel execution, JUnit format
    6. **Analyze Results** - Validate against 80% coverage threshold, quality gates
  </steps>

  <trigger>
    Git Event
    - Events: push, pull-request
    - Branches: main, develop
  </trigger>

  <agents-used>
    - researcher
    - test-writer
    - general-purpose
    - validator
  </agents-used>

  <quality-gates>
    - Minimum 80% code coverage
    - All tests must pass
    - No critical issues in coverage report
  </quality-gates>
</workflow>

### 6. Automated Dependency Management

<workflow id="dependency-management">
  <category>Maintenance</category>
  <duration>12 minutes</duration>
  <success-rate>96%</success-rate>

  <description>
  Scheduled workflow for dependency updates. Checks for updates and vulnerabilities, analyzes compatibility and breaking changes, updates safe dependencies, runs tests, and generates update report.
  </description>

  <steps>
    1. **Check Dependencies** - Available updates, security vulnerabilities
    2. **Analyze Compatibility** - Breaking changes, security focus
    3. **Update Dependencies** - Safe updates only, always fix vulnerabilities
    4. **Run Compatibility Tests** - Quick test suite validation
    5. **Generate Update Report** - Security status, compatibility notes
  </steps>

  <trigger>
    Schedule
    - Cron: 0 9 * * 1 (Monday 9 AM UTC)
  </trigger>

  <agents-used>
    - general-purpose
    - security-auditor
    - test-writer
    - documenter
  </agents-used>

  <safety-features>
    - Only updates non-breaking versions automatically
    - Always applies security patches
    - Runs tests before finalizing
    - Creates detailed report of changes
  </safety-features>
</workflow>

### 7. Comprehensive Code Quality Audit

<workflow id="code-quality-audit">
  <category>Maintenance</category>
  <duration>18 minutes</duration>
  <success-rate>91%</success-rate>

  <description>
  Weekly code quality analysis covering static analysis, performance bottlenecks, security vulnerabilities, and architecture review. Generates comprehensive quality report with actionable recommendations.
  </description>

  <steps>
    1. **Code Analysis** - Static analysis, security, performance, maintainability
    2. **Performance Analysis** - Identify bottlenecks, suggest optimizations
    3. **Security Audit** - OWASP Top 10, dependency scan
    4. **Architecture Review** - Design patterns, scalability, maintainability
    5. **Generate Quality Report** - Aggregated results, recommendations, metrics
  </steps>

  <trigger>
    Schedule
    - Cron: 0 10 * * 5 (Friday 10 AM UTC)
  </trigger>

  <agents-used>
    - code-reviewer
    - performance-optimizer
    - security-auditor
    - architect
    - documenter
  </agents-used>

  <audit-areas>
    - Code quality and maintainability
    - Performance bottlenecks
    - Security vulnerabilities (OWASP Top 10)
    - Architecture and design patterns
    - Scalability concerns
  </audit-areas>
</workflow>

---

## API Reference

### Workflow Management

<api-endpoints>

#### List All Workflows

```http
GET /api/workflows/:sessionId
```

**Response:**
```json
[
  {
    "id": "smart-commit-automation",
    "name": "Smart Git Commit Automation",
    "description": "Automatically stage, review, and commit changes",
    "category": "development",
    "estimatedDuration": 3,
    "successRate": 95,
    "trigger": { "type": "manual", "config": {} },
    "steps": [...],
    "tags": ["git", "automation", "commit"]
  }
]
```

#### Get Workflow Details

```http
GET /api/workflows/:sessionId/:workflowId
```

**Response:**
```json
{
  "id": "smart-commit-automation",
  "name": "Smart Git Commit Automation",
  "steps": [
    {
      "id": "stage-changes",
      "name": "Stage Changes",
      "agent": "git-specialist",
      "agentInput": {...},
      "timeout": 30
    }
  ],
  "errorHandling": {
    "strategy": "stop",
    "maxRetries": 1
  }
}
```

#### Create Custom Workflow

```http
POST /api/workflows/:sessionId
Content-Type: application/json

{
  "id": "my-custom-workflow",
  "name": "My Custom Workflow",
  "description": "Custom workflow description",
  "category": "custom",
  "version": "1.0.0",
  "author": "user",
  "trigger": {
    "type": "manual",
    "config": {}
  },
  "steps": [
    {
      "id": "step-1",
      "name": "First Step",
      "description": "Description",
      "agent": "general-purpose",
      "agentInput": {
        "action": "do-something"
      }
    }
  ],
  "tags": ["custom"],
  "estimatedDuration": 5
}
```

**Response:**
```json
{
  "workflowId": "my-custom-workflow"
}
```

#### Delete Workflow

```http
DELETE /api/workflows/:sessionId/:workflowId
```

**Response:**
```json
{
  "success": true
}
```

</api-endpoints>

### Workflow Execution

<api-endpoints>

#### Execute Workflow

```http
POST /api/workflows/:sessionId/:workflowId/execute
Content-Type: application/json

{
  "triggerContext": {
    "type": "manual",
    "config": {}
  },
  "initialVariables": {
    "customVar": "value",
    "branch": "main"
  }
}
```

**Response:**
```json
{
  "executionId": "exec_1699999999999_abc123xyz"
}
```

#### Get Execution Status

```http
GET /api/workflows/:sessionId/:workflowId/executions/:executionId
```

**Response:**
```json
{
  "executionId": "exec_1699999999999_abc123xyz",
  "workflowId": "smart-commit-automation",
  "status": "running",
  "startTime": 1699999999999,
  "duration": 45000,
  "stepsCompleted": 2,
  "stepsTotal": 4,
  "stepResults": {
    "stage-changes": {
      "stepId": "stage-changes",
      "status": "completed",
      "duration": 15000,
      "output": {...}
    },
    "review-staged": {
      "stepId": "review-staged",
      "status": "completed",
      "duration": 30000,
      "output": {...}
    }
  },
  "agentsUsed": ["git-specialist", "code-reviewer"]
}
```

#### Get Execution History

```http
GET /api/workflows/:sessionId/:workflowId/executions
```

**Response:**
```json
[
  {
    "executionId": "exec_1699999999999_abc123xyz",
    "status": "completed",
    "success": true,
    "startTime": 1699999999999,
    "duration": 180000,
    "stepsCompleted": 4,
    "stepsTotal": 4
  }
]
```

#### Cancel Execution

```http
POST /api/workflows/:sessionId/:workflowId/executions/:executionId/cancel
```

**Response:**
```json
{
  "success": true
}
```

</api-endpoints>

### Workflow Suggestions

<api-endpoints>

#### Get Workflow Suggestions

```http
POST /api/workflows/:sessionId/suggest
Content-Type: application/json

{
  "fileChanged": "data/new_dataset.csv",
  "conversationContext": "analyze this data",
  "currentAgent": "general-purpose"
}
```

**Response:**
```json
[
  {
    "workflow": {
      "id": "data-analysis-pipeline",
      "name": "Automated Data Analysis Pipeline",
      "description": "Complete data analysis workflow"
    },
    "score": 0.85,
    "reason": "File changes detected - this workflow can help process *.csv files"
  }
]
```

#### Get Built-in Workflows

```http
GET /api/workflows/:sessionId/builtin
```

**Response:**
```json
[
  {
    "id": "smart-commit-automation",
    "name": "Smart Git Commit Automation",
    "category": "development"
  },
  {
    "id": "data-analysis-pipeline",
    "name": "Automated Data Analysis Pipeline",
    "category": "analysis"
  }
]
```

</api-endpoints>

---

## Creating Custom Workflows

### Step-by-Step Guide

<guide name="create-custom-workflow">

#### Step 1: Define Workflow Metadata

```typescript
const myWorkflow: WorkflowDefinition = {
  id: 'my-api-deployment',
  name: 'Deploy API to Production',
  description: 'Build, test, and deploy API to production with rollback capability',
  category: 'deployment',
  version: '1.0.0',
  author: 'user',
  tags: ['deployment', 'api', 'production', 'ci-cd'],
  estimatedDuration: 15,
  createdAt: Date.now(),
  updatedAt: Date.now(),
```

#### Step 2: Configure Trigger

```typescript
  trigger: {
    type: 'git-event',
    config: {
      gitEvents: ['push'],
      gitBranches: ['main']
    }
  },
```

**Trigger Options:**
- `manual` - User-initiated
- `git-event` - Git operations
- `file-change` - File modifications
- `schedule` - Cron-based timing
- `conversation` - Keyword detection
- `error` - Error patterns

#### Step 3: Design Workflow Steps

```typescript
  steps: [
    // Step 1: Run tests
    {
      id: 'run-tests',
      name: 'Run Test Suite',
      description: 'Execute all tests before deployment',
      agent: 'test-writer',
      agentInput: {
        action: 'run-all-tests',
        coverage: true
      },
      timeout: 180,
      retries: 1
    },

    // Step 2: Build application
    {
      id: 'build-app',
      name: 'Build Application',
      description: 'Build production-ready application',
      agent: 'general-purpose',
      agentInput: {
        action: 'build',
        target: 'production'
      },
      dependsOn: ['run-tests'],  // Only build if tests pass
      timeout: 300
    },

    // Step 3: Deploy to production
    {
      id: 'deploy',
      name: 'Deploy to Production',
      description: 'Deploy built application to production',
      agent: 'deployment-specialist',
      agentInput: {
        environment: 'production',
        strategy: 'blue-green'
      },
      dependsOn: ['build-app'],
      condition: 'context.stepResults["run-tests"].output.allTestsPassed === true',
      timeout: 600
    },

    // Step 4: Health check
    {
      id: 'health-check',
      name: 'Production Health Check',
      description: 'Verify deployment health',
      agent: 'validator',
      agentInput: {
        action: 'health-check',
        endpoint: 'https://api.production.com/health'
      },
      dependsOn: ['deploy'],
      timeout: 60,
      retries: 3,
      retryDelay: 10
    }
  ],
```

#### Step 4: Configure Error Handling

```typescript
  errorHandling: {
    strategy: 'fallback',
    maxRetries: 2,
    retryDelay: 30,
    fallbackStep: 'rollback-deployment',
    notifyOnError: true
  }
};
```

**Error Strategies:**
- `stop` - Halt workflow immediately on error
- `continue` - Continue to next steps despite errors
- `retry` - Retry failed step with delay
- `fallback` - Execute fallback step on error

#### Step 5: Create Workflow via API

```typescript
const response = await fetch(`/api/workflows/${sessionId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(myWorkflow)
});

const { workflowId } = await response.json();
console.log(`Created workflow: ${workflowId}`);
```

#### Step 6: Execute Workflow

```typescript
const execResponse = await fetch(`/api/workflows/${sessionId}/${workflowId}/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    initialVariables: {
      deploymentTarget: 'production',
      notificationEmail: 'team@company.com'
    }
  })
});

const { executionId } = await execResponse.json();
```

#### Step 7: Monitor Execution

```typescript
async function pollExecution(executionId: string) {
  const response = await fetch(
    `/api/workflows/${sessionId}/${workflowId}/executions/${executionId}`
  );
  const execution = await response.json();

  console.log(`Status: ${execution.status}`);
  console.log(`Completed: ${execution.stepsCompleted}/${execution.stepsTotal}`);

  if (execution.status === 'running') {
    setTimeout(() => pollExecution(executionId), 5000);
  } else {
    console.log('Workflow complete:', execution);
  }
}

pollExecution(executionId);
```

</guide>

### Advanced Features

#### Input/Output Mapping

<feature name="input-output-mapping">

Pass data between steps using mapping configuration:

```typescript
steps: [
  {
    id: 'fetch-config',
    name: 'Fetch Configuration',
    agent: 'researcher',
    agentInput: {
      action: 'fetch-config',
      source: 'production'
    },
    outputMapping: {
      'apiKey': 'config.apiKey',
      'databaseUrl': 'config.database.url'
    }
  },
  {
    id: 'deploy-service',
    name: 'Deploy Service',
    agent: 'deployment-specialist',
    agentInput: {
      service: 'api-gateway'
    },
    dependsOn: ['fetch-config'],
    inputMapping: {
      // Map previous step's outputs to current step's inputs
      'apiKey': 'fetch-config.output.apiKey',
      'databaseUrl': 'fetch-config.output.databaseUrl'
    }
  }
]
```

The `deploy-service` step receives:
```typescript
{
  service: 'api-gateway',
  apiKey: '<value from fetch-config>',
  databaseUrl: '<value from fetch-config>'
}
```

</feature>

#### Conditional Steps

<feature name="conditional-steps">

Execute steps based on runtime conditions:

```typescript
{
  id: 'notify-slack',
  name: 'Send Slack Notification',
  agent: 'general-purpose',
  agentInput: {
    action: 'notify-slack',
    channel: '#deployments'
  },
  condition: `
    context.stepResults["deploy"].status === "completed" &&
    context.variables.notifyOnSuccess === true
  `,
  dependsOn: ['deploy']
}
```

Condition expressions have access to:
- `context.variables` - Initial variables and runtime data
- `context.stepResults` - Results from completed steps
- `context.projectMemory` - Project memory data

</feature>

#### Parallel Execution Groups

<feature name="parallel-groups">

Execute multiple steps concurrently:

```typescript
steps: [
  {
    id: 'setup',
    name: 'Setup',
    agent: 'general-purpose',
    agentInput: { action: 'setup' }
  },
  {
    id: 'lint-code',
    name: 'Lint Code',
    agent: 'code-reviewer',
    agentInput: { action: 'lint' },
    dependsOn: ['setup'],
    parallel: true,
    parallelGroup: 'quality-checks'
  },
  {
    id: 'run-tests',
    name: 'Run Tests',
    agent: 'test-writer',
    agentInput: { action: 'test' },
    dependsOn: ['setup'],
    parallel: true,
    parallelGroup: 'quality-checks'
  },
  {
    id: 'security-scan',
    name: 'Security Scan',
    agent: 'security-auditor',
    agentInput: { action: 'scan' },
    dependsOn: ['setup'],
    parallel: true,
    parallelGroup: 'quality-checks'
  },
  {
    id: 'aggregate-results',
    name: 'Aggregate Results',
    agent: 'general-purpose',
    agentInput: { action: 'aggregate' },
    dependsOn: ['lint-code', 'run-tests', 'security-scan']
  }
]
```

Execution: All three quality checks run simultaneously after setup.

</feature>

---

## Error Handling Strategies

<error-handling>

### Strategy: Stop

<strategy type="stop">
  <description>Immediately halt workflow execution on any step failure</description>

  <use-cases>
    - Critical operations where partial completion is unacceptable
    - Deployment workflows that require all steps to succeed
    - Data migrations where integrity is paramount
  </use-cases>

  <config>
    ```typescript
    errorHandling: {
      strategy: 'stop',
      maxRetries: 0,
      notifyOnError: true
    }
    ```
  </config>

  <behavior>
    - First step failure stops entire workflow
    - No subsequent steps execute
    - Workflow status: 'failed'
    - Error details captured in result
  </behavior>
</strategy>

### Strategy: Continue

<strategy type="continue">
  <description>Continue executing remaining steps despite failures</description>

  <use-cases>
    - Analysis workflows where partial results are valuable
    - Maintenance tasks where some failures are acceptable
    - Multi-target deployments where one failure shouldn't block others
  </use-cases>

  <config>
    ```typescript
    errorHandling: {
      strategy: 'continue',
      maxRetries: 1,
      notifyOnError: false
    }
    ```
  </config>

  <behavior>
    - Failed steps marked as 'failed'
    - Subsequent steps still execute (if dependencies met)
    - Workflow completes with partial success
    - Overall status: 'completed' if at least one step succeeds
  </behavior>
</strategy>

### Strategy: Retry

<strategy type="retry">
  <description>Automatically retry failed steps with configurable delay</description>

  <use-cases>
    - Network-dependent operations
    - External API calls that may be temporarily unavailable
    - Resource contention scenarios
  </use-cases>

  <config>
    ```typescript
    errorHandling: {
      strategy: 'retry',
      maxRetries: 3,
      retryDelay: 30,  // seconds
      notifyOnError: true
    }
    ```
  </config>

  <behavior>
    - Failed step retries up to maxRetries times
    - Waits retryDelay seconds between attempts
    - If all retries fail, workflow stops
    - Retry count tracked in step result
  </behavior>

  <example>
    ```typescript
    // Step-level retry configuration
    {
      id: 'deploy-to-cloud',
      name: 'Deploy to Cloud',
      agent: 'deployment-specialist',
      agentInput: { target: 'aws' },
      timeout: 300,
      retries: 5,        // Step-specific retries
      retryDelay: 60     // Step-specific delay
    }
    ```
  </example>
</strategy>

### Strategy: Fallback

<strategy type="fallback">
  <description>Execute alternative recovery step on failure</description>

  <use-cases>
    - Deployments with rollback capability
    - Multi-strategy operations (try primary, fall back to secondary)
    - Operations requiring cleanup after failure
  </use-cases>

  <config>
    ```typescript
    errorHandling: {
      strategy: 'fallback',
      maxRetries: 1,
      fallbackStep: 'rollback-deployment',
      notifyOnError: true
    }
    ```
  </config>

  <behavior>
    - On step failure, execute specified fallback step
    - Fallback step receives error context
    - If fallback succeeds, workflow marked as 'failed' but recovered
    - If fallback fails, workflow marked as 'failed' completely
  </behavior>

  <example>
    ```typescript
    steps: [
      {
        id: 'deploy-new-version',
        name: 'Deploy New Version',
        agent: 'deployment-specialist',
        agentInput: { version: '2.0.0' }
      },
      {
        id: 'rollback-deployment',
        name: 'Rollback Deployment',
        agent: 'deployment-specialist',
        agentInput: {
          action: 'rollback',
          targetVersion: '1.9.0'
        }
        // This step only runs if specified as fallback
      }
    ],
    errorHandling: {
      strategy: 'fallback',
      fallbackStep: 'rollback-deployment',
      notifyOnError: true
    }
    ```
  </example>
</strategy>

### Error Context

<error-context>

Failed steps provide detailed error information:

```typescript
interface StepResult {
  stepId: string;
  status: 'failed';
  error: string;           // Error message
  startTime: number;
  endTime: number;
  duration: number;
  retryCount: number;      // Number of retries attempted

  // Agent execution details
  agent: string;
  input: any;
  output?: any;            // Partial output if available
}
```

Access error information in subsequent steps:

```typescript
{
  id: 'handle-error',
  name: 'Handle Error',
  agent: 'general-purpose',
  agentInput: {
    action: 'log-error'
  },
  inputMapping: {
    'errorMessage': 'failed-step.error',
    'failedAgent': 'failed-step.agent'
  }
}
```

</error-context>

</error-handling>

---

## Code Examples

### Example 1: Simple Linear Workflow

<example name="simple-workflow">

```typescript
import { WorkflowEngine } from './workflows/workflowEngine';

const engine = new WorkflowEngine(sessionId);

const simpleWorkflow = await engine.createWorkflow({
  id: 'code-review-workflow',
  name: 'Code Review Workflow',
  description: 'Review code changes for quality and security',
  category: 'development',
  version: '1.0.0',
  author: 'user',
  tags: ['code-review', 'quality'],
  estimatedDuration: 5,
  trigger: {
    type: 'git-event',
    config: {
      gitEvents: ['pull-request'],
      gitBranches: ['main', 'develop']
    }
  },
  steps: [
    {
      id: 'fetch-changes',
      name: 'Fetch Changes',
      description: 'Get list of changed files',
      agent: 'git-specialist',
      agentInput: {
        action: 'diff',
        branch: 'main'
      },
      timeout: 30
    },
    {
      id: 'review-code',
      name: 'Review Code',
      description: 'Analyze code for issues',
      agent: 'code-reviewer',
      agentInput: {
        focusAreas: ['security', 'performance', 'best-practices']
      },
      dependsOn: ['fetch-changes'],
      inputMapping: {
        'changedFiles': 'fetch-changes.output.files'
      },
      timeout: 120
    },
    {
      id: 'post-comment',
      name: 'Post Review Comment',
      description: 'Post review findings as PR comment',
      agent: 'general-purpose',
      agentInput: {
        action: 'post-pr-comment'
      },
      dependsOn: ['review-code'],
      inputMapping: {
        'findings': 'review-code.output.issues'
      },
      timeout: 20
    }
  ],
  errorHandling: {
    strategy: 'stop',
    notifyOnError: true
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Execute workflow
const result = await engine.executeWorkflow('code-review-workflow');
console.log('Workflow result:', result);
```

</example>

### Example 2: Parallel Execution Workflow

<example name="parallel-workflow">

```typescript
const parallelWorkflow = await engine.createWorkflow({
  id: 'multi-environment-test',
  name: 'Multi-Environment Testing',
  description: 'Test application across multiple environments in parallel',
  category: 'testing',
  version: '1.0.0',
  author: 'user',
  tags: ['testing', 'parallel', 'multi-env'],
  estimatedDuration: 10,
  trigger: {
    type: 'manual',
    config: {}
  },
  steps: [
    {
      id: 'build',
      name: 'Build Application',
      description: 'Build application for testing',
      agent: 'general-purpose',
      agentInput: {
        action: 'build',
        mode: 'test'
      },
      timeout: 180
    },
    {
      id: 'test-dev',
      name: 'Test in Dev Environment',
      description: 'Run tests in dev environment',
      agent: 'test-writer',
      agentInput: {
        environment: 'development',
        testSuite: 'full'
      },
      dependsOn: ['build'],
      parallel: true,
      parallelGroup: 'env-tests',
      timeout: 300
    },
    {
      id: 'test-staging',
      name: 'Test in Staging Environment',
      description: 'Run tests in staging environment',
      agent: 'test-writer',
      agentInput: {
        environment: 'staging',
        testSuite: 'full'
      },
      dependsOn: ['build'],
      parallel: true,
      parallelGroup: 'env-tests',
      timeout: 300
    },
    {
      id: 'test-prod-mirror',
      name: 'Test in Prod Mirror',
      description: 'Run tests in production mirror',
      agent: 'test-writer',
      agentInput: {
        environment: 'prod-mirror',
        testSuite: 'smoke'
      },
      dependsOn: ['build'],
      parallel: true,
      parallelGroup: 'env-tests',
      timeout: 300
    },
    {
      id: 'aggregate-results',
      name: 'Aggregate Test Results',
      description: 'Combine results from all environments',
      agent: 'validator',
      agentInput: {
        action: 'aggregate-test-results'
      },
      dependsOn: ['test-dev', 'test-staging', 'test-prod-mirror'],
      inputMapping: {
        'devResults': 'test-dev.output.results',
        'stagingResults': 'test-staging.output.results',
        'prodMirrorResults': 'test-prod-mirror.output.results'
      },
      timeout: 60
    },
    {
      id: 'generate-report',
      name: 'Generate Test Report',
      description: 'Create comprehensive test report',
      agent: 'documenter',
      agentInput: {
        action: 'generate-test-report',
        format: 'html'
      },
      dependsOn: ['aggregate-results'],
      inputMapping: {
        'testResults': 'aggregate-results.output.summary'
      },
      timeout: 30
    }
  ],
  errorHandling: {
    strategy: 'continue',
    maxRetries: 1,
    notifyOnError: true
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Execute with custom variables
const result = await engine.executeWorkflow(
  'multi-environment-test',
  undefined,
  {
    notificationEmail: 'team@company.com',
    slackChannel: '#test-results'
  }
);
```

</example>

### Example 3: Data Processing with Python Agents

<example name="python-workflow">

```typescript
const dataWorkflow = await engine.createWorkflow({
  id: 'customer-churn-analysis',
  name: 'Customer Churn Analysis',
  description: 'Analyze customer data to predict churn',
  category: 'analysis',
  version: '1.0.0',
  author: 'user',
  tags: ['python', 'data-science', 'ml', 'churn'],
  estimatedDuration: 20,
  trigger: {
    type: 'file-change',
    config: {
      filePatterns: ['data/customers/*.csv'],
      watchSubdirectories: true
    }
  },
  steps: [
    {
      id: 'setup-env',
      name: 'Setup Python Environment',
      description: 'Create Python environment with required packages',
      agent: 'PythonEnvironmentManage',
      agentInput: {
        action: 'create',
        name: 'churn-analysis-env',
        packages: [
          'pandas',
          'numpy',
          'scikit-learn',
          'matplotlib',
          'seaborn',
          'imbalanced-learn'
        ]
      },
      timeout: 180
    },
    {
      id: 'load-data',
      name: 'Load and Clean Data',
      description: 'Load customer data and perform cleaning',
      agent: 'python-data-scientist',
      agentInput: {
        action: 'load-clean-data',
        dataPath: 'data/customers/current.csv',
        handleMissing: true,
        removeOutliers: true
      },
      dependsOn: ['setup-env'],
      timeout: 120
    },
    {
      id: 'feature-engineering',
      name: 'Feature Engineering',
      description: 'Create features for churn prediction',
      agent: 'python-data-scientist',
      agentInput: {
        action: 'engineer-features',
        targetColumn: 'churned',
        createInteractions: true,
        scalingMethod: 'standard'
      },
      dependsOn: ['load-data'],
      inputMapping: {
        'cleanData': 'load-data.output.data'
      },
      timeout: 180
    },
    {
      id: 'train-model',
      name: 'Train Churn Model',
      description: 'Train machine learning model',
      agent: 'python-ml-engineer',
      agentInput: {
        action: 'train-classification-model',
        algorithms: ['random-forest', 'xgboost', 'logistic-regression'],
        handleImbalance: true,
        crossValidation: 5
      },
      dependsOn: ['feature-engineering'],
      inputMapping: {
        'features': 'feature-engineering.output.X',
        'target': 'feature-engineering.output.y'
      },
      timeout: 600
    },
    {
      id: 'evaluate-model',
      name: 'Evaluate Model',
      description: 'Evaluate model performance',
      agent: 'python-ml-engineer',
      agentInput: {
        action: 'evaluate-model',
        metrics: ['accuracy', 'precision', 'recall', 'f1', 'auc-roc'],
        createConfusionMatrix: true,
        featureImportance: true
      },
      dependsOn: ['train-model'],
      inputMapping: {
        'model': 'train-model.output.bestModel',
        'testData': 'train-model.output.testData'
      },
      timeout: 120
    },
    {
      id: 'generate-insights',
      name: 'Generate Business Insights',
      description: 'Create actionable business insights',
      agent: 'python-data-scientist',
      agentInput: {
        action: 'generate-insights',
        includeRecommendations: true,
        visualizations: true
      },
      dependsOn: ['evaluate-model'],
      inputMapping: {
        'modelResults': 'evaluate-model.output',
        'featureImportance': 'evaluate-model.output.featureImportance'
      },
      timeout: 90
    },
    {
      id: 'create-report',
      name: 'Create Analysis Report',
      description: 'Generate comprehensive report',
      agent: 'documenter',
      agentInput: {
        action: 'generate-ml-report',
        includeVisualizations: true,
        format: 'pdf'
      },
      dependsOn: ['generate-insights'],
      inputMapping: {
        'insights': 'generate-insights.output.insights',
        'metrics': 'evaluate-model.output.metrics',
        'visualizations': 'generate-insights.output.charts'
      },
      timeout: 60
    }
  ],
  errorHandling: {
    strategy: 'continue',
    maxRetries: 1,
    notifyOnError: true
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

</example>

### Example 4: Conditional Workflow with Fallback

<example name="conditional-workflow">

```typescript
const deploymentWorkflow = await engine.createWorkflow({
  id: 'production-deployment',
  name: 'Production Deployment with Rollback',
  description: 'Deploy to production with automatic rollback on failure',
  category: 'deployment',
  version: '1.0.0',
  author: 'user',
  tags: ['deployment', 'production', 'rollback'],
  estimatedDuration: 15,
  trigger: {
    type: 'manual',
    config: {}
  },
  steps: [
    {
      id: 'run-tests',
      name: 'Run Full Test Suite',
      description: 'Ensure all tests pass before deployment',
      agent: 'test-writer',
      agentInput: {
        action: 'run-all-tests',
        coverage: true,
        failOnLowCoverage: true
      },
      timeout: 300,
      retries: 1
    },
    {
      id: 'build-production',
      name: 'Build Production Artifacts',
      description: 'Create production build',
      agent: 'general-purpose',
      agentInput: {
        action: 'build',
        environment: 'production',
        optimize: true
      },
      dependsOn: ['run-tests'],
      condition: 'context.stepResults["run-tests"].output.allPassed === true',
      timeout: 300
    },
    {
      id: 'backup-current',
      name: 'Backup Current Version',
      description: 'Backup current production version',
      agent: 'deployment-specialist',
      agentInput: {
        action: 'backup',
        target: 'production'
      },
      dependsOn: ['build-production'],
      timeout: 120
    },
    {
      id: 'deploy',
      name: 'Deploy to Production',
      description: 'Deploy new version to production',
      agent: 'deployment-specialist',
      agentInput: {
        action: 'deploy',
        environment: 'production',
        strategy: 'blue-green'
      },
      dependsOn: ['backup-current'],
      inputMapping: {
        'artifacts': 'build-production.output.artifacts',
        'backupId': 'backup-current.output.backupId'
      },
      timeout: 600,
      retries: 2,
      retryDelay: 30
    },
    {
      id: 'health-check',
      name: 'Production Health Check',
      description: 'Verify deployment health',
      agent: 'validator',
      agentInput: {
        action: 'health-check',
        endpoint: 'https://api.production.com/health',
        expectedStatus: 200,
        timeout: 10
      },
      dependsOn: ['deploy'],
      timeout: 60,
      retries: 5,
      retryDelay: 10
    },
    {
      id: 'smoke-tests',
      name: 'Production Smoke Tests',
      description: 'Run critical smoke tests',
      agent: 'test-writer',
      agentInput: {
        action: 'run-smoke-tests',
        environment: 'production'
      },
      dependsOn: ['health-check'],
      condition: 'context.stepResults["health-check"].status === "completed"',
      timeout: 180
    },
    {
      id: 'notify-success',
      name: 'Notify Success',
      description: 'Send success notifications',
      agent: 'general-purpose',
      agentInput: {
        action: 'notify',
        channels: ['slack', 'email'],
        message: 'Production deployment successful'
      },
      dependsOn: ['smoke-tests'],
      condition: 'context.stepResults["smoke-tests"].output.allPassed === true',
      timeout: 30
    },
    {
      id: 'rollback',
      name: 'Rollback Deployment',
      description: 'Rollback to previous version',
      agent: 'deployment-specialist',
      agentInput: {
        action: 'rollback',
        environment: 'production'
      },
      inputMapping: {
        'backupId': 'backup-current.output.backupId'
      },
      timeout: 300
      // This step only runs if specified as fallback
    }
  ],
  errorHandling: {
    strategy: 'fallback',
    fallbackStep: 'rollback',
    maxRetries: 1,
    notifyOnError: true
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Execute deployment
const result = await engine.executeWorkflow(
  'production-deployment',
  undefined,
  {
    version: '2.1.0',
    notificationChannel: '#deployments'
  }
);

if (result.success) {
  console.log('Deployment successful!');
} else {
  console.log('Deployment failed, rollback executed:', result.error);
}
```

</example>

### Example 5: Monitoring Workflow Execution

<example name="monitoring">

```typescript
// Execute workflow and monitor progress
async function executeAndMonitor(workflowId: string, sessionId: string) {
  const engine = new WorkflowEngine(sessionId);

  // Start execution
  const result = await engine.executeWorkflow(workflowId);
  const executionId = result.executionId;

  console.log(`Started workflow execution: ${executionId}`);

  // Poll for status updates
  const pollInterval = 5000; // 5 seconds

  const interval = setInterval(async () => {
    const execution = await fetch(
      `/api/workflows/${sessionId}/${workflowId}/executions/${executionId}`
    ).then(res => res.json());

    console.log('\n--- Workflow Status ---');
    console.log(`Status: ${execution.status}`);
    console.log(`Progress: ${execution.stepsCompleted}/${execution.stepsTotal}`);
    console.log(`Duration: ${(execution.duration / 1000).toFixed(1)}s`);

    // Show current step
    if (execution.status === 'running' && execution.currentStep) {
      console.log(`Current Step: ${execution.currentStep}`);
    }

    // Show completed steps
    if (Object.keys(execution.stepResults).length > 0) {
      console.log('\nCompleted Steps:');
      for (const [stepId, result] of Object.entries(execution.stepResults)) {
        const status = result.status === 'completed' ? '✓' : '✗';
        console.log(`  ${status} ${stepId} (${(result.duration / 1000).toFixed(1)}s)`);
      }
    }

    // Check if workflow finished
    if (['completed', 'failed', 'cancelled', 'timeout'].includes(execution.status)) {
      clearInterval(interval);

      console.log('\n--- Workflow Complete ---');
      console.log(`Final Status: ${execution.status}`);
      console.log(`Total Duration: ${(execution.duration / 1000).toFixed(1)}s`);
      console.log(`Agents Used: ${execution.agentsUsed.join(', ')}`);

      if (execution.success) {
        console.log('✓ Workflow completed successfully');
        if (execution.output) {
          console.log('Output:', JSON.stringify(execution.output, null, 2));
        }
      } else {
        console.log('✗ Workflow failed');
        console.log('Error:', execution.error);
      }
    }
  }, pollInterval);
}

// Usage
executeAndMonitor('smart-commit-automation', sessionId);
```

</example>

---

## Setup Instructions

### 1. Initialize Workflow Engine

```typescript
import { WorkflowEngine } from './server/workflows/workflowEngine';

// Create engine instance for your session
const engine = new WorkflowEngine(sessionId);
```

The engine automatically:
- Creates workflow storage directory
- Loads existing workflows from disk
- Loads all built-in workflows
- Initializes execution tracking

### 2. Access Built-in Workflows

```typescript
// List all built-in workflows
const workflows = engine.getWorkflows();
console.log(`Available workflows: ${workflows.length}`);

// Filter by category
const devWorkflows = engine.getWorkflows('development');
const testWorkflows = engine.getWorkflows('testing');
const analysisWorkflows = engine.getWorkflows('analysis');

// Get specific workflow
const commitWorkflow = engine.getWorkflow('smart-commit-automation');
```

### 3. Execute a Workflow

```typescript
// Simple execution
const result = await engine.executeWorkflow('smart-commit-automation');

// With initial variables
const result = await engine.executeWorkflow(
  'data-analysis-pipeline',
  undefined,
  {
    dataFile: 'data/sales_2024.csv',
    generatePDF: true
  }
);

// With custom trigger context
const result = await engine.executeWorkflow(
  'comprehensive-testing',
  {
    type: 'git-event',
    config: {
      gitEvents: ['pull-request'],
      branch: 'feature/new-api'
    }
  }
);
```

### 4. Schedule Recurring Workflows

```typescript
// Schedule weekly dependency check
const scheduleId = await engine.scheduleWorkflow(
  'dependency-management',
  '0 9 * * 1',  // Every Monday at 9 AM
  'UTC'
);

console.log(`Scheduled workflow: ${scheduleId}`);
```

### 5. Get Workflow Suggestions

```typescript
// Get AI-powered workflow suggestions based on context
const suggestions = await engine.suggestWorkflows({
  fileChanged: 'data/new_dataset.csv',
  conversationContext: 'analyze this data for patterns',
  currentAgent: 'general-purpose'
});

console.log('Suggested workflows:');
suggestions.forEach(suggestion => {
  console.log(`- ${suggestion.workflow.name} (score: ${suggestion.score})`);
  console.log(`  Reason: ${suggestion.reason}`);
});
```

### 6. Monitor Active Executions

```typescript
// Get all active workflow executions
const activeExecutions = engine.getActiveExecutions();

console.log(`Active executions: ${activeExecutions.length}`);
activeExecutions.forEach(execution => {
  console.log(`- ${execution.workflow.name}: ${execution.context.currentStep}`);
});

// Cancel a running execution
await engine.cancelExecution(executionId);
```

---

## Best Practices

<best-practices>

### 1. Workflow Design

- **Single Responsibility**: Each workflow should accomplish one clear objective
- **Modular Steps**: Keep steps focused and reusable
- **Clear Naming**: Use descriptive names for workflows and steps
- **Proper Dependencies**: Only add dependencies when truly needed
- **Reasonable Timeouts**: Set realistic timeouts based on expected duration

### 2. Error Handling

- Use `stop` strategy for critical workflows where partial completion is unacceptable
- Use `continue` strategy for analysis workflows where partial results are valuable
- Use `retry` strategy for network-dependent operations
- Use `fallback` strategy for deployments with rollback capability
- Always set `notifyOnError: true` for production workflows

### 3. Performance Optimization

- Leverage parallel execution for independent steps
- Use `parallelGroup` to organize concurrent operations
- Set appropriate timeouts to prevent hanging
- Consider estimated duration when scheduling workflows

### 4. Data Flow

- Use `inputMapping` to pass data between steps
- Use `outputMapping` to structure step outputs
- Store intermediate results in workflow variables
- Access project memory for learned patterns

### 5. Testing

- Test workflows with `manual` trigger before automating
- Validate error handling with intentional failures
- Monitor execution duration to adjust timeouts
- Review step results to ensure proper data flow

### 6. Security

- Never hardcode sensitive data in workflow definitions
- Use environment variables for credentials
- Validate user input in initial variables
- Restrict workflow execution permissions appropriately

### 7. Monitoring

- Track workflow success rates
- Monitor execution duration trends
- Review failed executions for patterns
- Adjust retry and timeout settings based on metrics

</best-practices>

---

## Troubleshooting

<troubleshooting>

### Common Issues

#### Workflow Not Found

**Error**: `Workflow not found: <workflowId>`

**Solutions**:
- Verify workflow ID is correct
- Check if workflow was successfully created
- Ensure workflow file exists in `workflows/workflows.json`
- Try reloading workflows with engine restart

#### Step Timeout

**Error**: `Step <stepId> timed out after <timeout> seconds`

**Solutions**:
- Increase step timeout value
- Check if agent is stuck on complex operation
- Verify network connectivity for external operations
- Review step logic for infinite loops

#### Dependency Not Met

**Error**: `Step <stepId> dependency not satisfied: <depId>`

**Solutions**:
- Verify dependency step exists in workflow
- Check if dependency step completed successfully
- Review step execution order
- Ensure no circular dependencies

#### Agent Execution Failed

**Error**: `Agent execution failed: <error message>`

**Solutions**:
- Verify agent type is valid
- Check agent input parameters
- Review agent-specific error message
- Ensure required tools/packages are available

#### Parallel Execution Issues

**Error**: Steps in parallel group not executing concurrently

**Solutions**:
- Verify `parallel: true` is set
- Ensure `parallelGroup` names match
- Check dependencies don't prevent parallelization
- Review engine execution logs

</troubleshooting>

---

## Appendix

### Available Agent Types

<agents>

**Development Agents:**
- `general-purpose` - Multi-purpose development tasks
- `git-specialist` - Git operations and version control
- `code-reviewer` - Code review and quality analysis
- `test-writer` - Test generation and execution
- `documenter` - Documentation generation

**Python Agents:**
- `python-backend-developer` - Python backend development
- `python-data-scientist` - Data analysis and exploration
- `python-ml-engineer` - Machine learning and model training
- `python-test-engineer` - Python testing
- `PythonEnvironmentManage` - Python environment management

**Specialized Agents:**
- `performance-optimizer` - Performance analysis and optimization
- `security-auditor` - Security scanning and audits
- `architect` - Architecture review and design
- `validator` - Validation and verification
- `deployment-specialist` - Deployment operations
- `build-researcher` - Research and investigation
- `config-writer` - Configuration file generation

</agents>

### Workflow Status Values

<status-values>

**Workflow Status:**
- `running` - Currently executing
- `completed` - Finished successfully
- `failed` - Encountered unrecoverable error
- `cancelled` - User-cancelled execution
- `timeout` - Exceeded maximum execution time

**Step Status:**
- `pending` - Waiting to execute
- `running` - Currently executing
- `completed` - Finished successfully
- `failed` - Encountered error
- `skipped` - Skipped due to condition or error

</status-values>

### Version History

<version-history>

**1.0.0** (2025-11-07)
- Initial workflow system implementation
- 7 built-in workflows
- 6 trigger types
- Parallel execution support
- Error handling strategies
- Input/output mapping
- Workflow suggestions
- Scheduled workflows

</version-history>

---

## Summary

The Workflow Orchestration System provides a powerful framework for automating complex multi-agent tasks with sophisticated dependency management, parallel execution, and intelligent error recovery. With 7 production-ready built-in workflows and comprehensive support for custom workflow creation, the system enables automation of development, testing, analysis, and maintenance tasks with minimal configuration.

**Key Features:**
- Multi-agent coordination with 15+ agent types
- 6 trigger types for flexible automation
- Parallel and sequential execution models
- 4 error handling strategies
- Input/output mapping between steps
- AI-powered workflow suggestions
- Cron-based scheduling
- Real-time execution monitoring

**Get Started:**
1. Initialize WorkflowEngine with your session ID
2. Explore built-in workflows with `getWorkflows()`
3. Execute workflows with `executeWorkflow()`
4. Create custom workflows for your specific needs
5. Monitor executions with the API endpoints

For questions or issues, refer to the troubleshooting section or review the code examples for common patterns.
