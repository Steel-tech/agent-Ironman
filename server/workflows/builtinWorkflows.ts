/**
 * Agent Ironman - Built-in Workflows
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: MIT
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import type { WorkflowDefinition } from './workflowEngine';

/**
 * Built-in workflows for common development tasks
 * These workflows showcase the power of connecting multiple agents
 */
export const BUILTIN_WORKFLOWS: Record<string, WorkflowDefinition> = {
  // ============================================================================
  // DEVELOPMENT WORKFLOWS
  // ============================================================================

  'smart-commit-automation': {
    id: 'smart-commit-automation',
    name: 'Smart Git Commit Automation',
    description: 'Automatically stage, review, and commit changes with intelligent commit messages',
    category: 'development',
    version: '1.0.0',
    author: 'system',
    tags: ['git', 'automation', 'commit', 'code-review'],
    estimatedDuration: 3,
    successRate: 95,
    trigger: {
      type: 'manual',
      config: {},
    },
    steps: [
      {
        id: 'stage-changes',
        name: 'Stage Changes',
        description: 'Stage relevant changes for commit',
        agent: 'git-specialist',
        agentInput: {
          action: 'stage-changes',
          patterns: ['src/**/*', 'server/**/*', 'client/**/*'],
          ignorePatterns: ['*.log', 'node_modules/', '.git/', 'dist/'],
        },
        timeout: 30,
        retries: 1,
      },
      {
        id: 'review-staged',
        name: 'Review Staged Changes',
        description: 'Review staged changes for issues and improvements',
        agent: 'code-reviewer',
        agentInput: {
          action: 'review-staged-changes',
          focusAreas: ['security', 'performance', 'best-practices'],
        },
        dependsOn: ['stage-changes'],
        timeout: 60,
        retries: 2,
      },
      {
        id: 'generate-commit-message',
        name: 'Generate Commit Message',
        description: 'Generate intelligent commit message based on changes',
        agent: 'documenter',
        agentInput: {
          action: 'generate-commit-message',
          style: 'conventional',
          includeScope: true,
        },
        dependsOn: ['review-staged'],
        inputMapping: {
          'reviewFindings': 'review-staged.output.findings',
        },
        timeout: 30,
      },
      {
        id: 'create-commit',
        name: 'Create Commit',
        description: 'Create the final commit with generated message',
        agent: 'git-specialist',
        agentInput: {
          action: 'create-commit',
        },
        dependsOn: ['generate-commit-message'],
        inputMapping: {
          'commitMessage': 'generate-commit-message.output.message',
        },
        timeout: 20,
      },
    ],
    errorHandling: {
      strategy: 'stop',
      maxRetries: 1,
      notifyOnError: true,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  'project-setup-python-api': {
    id: 'project-setup-python-api',
    name: 'Python API Project Setup',
    description: 'Create a complete Python API project with FastAPI, testing, and best practices',
    category: 'development',
    version: '1.0.0',
    author: 'system',
    tags: ['python', 'fastapi', 'project-setup', 'api'],
    estimatedDuration: 10,
    successRate: 98,
    trigger: {
      type: 'manual',
      config: {},
    },
    steps: [
      {
        id: 'research-requirements',
        name: 'Research Project Requirements',
        description: 'Research latest FastAPI best practices and project structure',
        agent: 'build-researcher',
        agentInput: {
          framework: 'FastAPI',
          projectType: 'REST API',
          includeTesting: true,
          includeDocumentation: true,
        },
        timeout: 60,
      },
      {
        id: 'create-structure',
        name: 'Create Project Structure',
        description: 'Create FastAPI project structure with proper organization',
        agent: 'python-backend-developer',
        agentInput: {
          action: 'create-project-structure',
          framework: 'FastAPI',
          features: ['authentication', 'database', 'testing', 'documentation'],
        },
        dependsOn: ['research-requirements'],
        inputMapping: {
          'latestVersion': 'research-requirements.output.version',
          'bestPractices': 'research-requirements.output.bestPractices',
        },
        timeout: 90,
      },
      {
        id: 'setup-configs',
        name: 'Setup Configuration Files',
        description: 'Create configuration files for the project',
        agent: 'config-writer',
        agentInput: {
          configs: ['pyproject.toml', '.env.example', '.gitignore', 'docker-compose.yml'],
          framework: 'FastAPI',
        },
        dependsOn: ['create-structure'],
        timeout: 45,
      },
      {
        id: 'create-tests',
        name: 'Create Test Suite',
        description: 'Create comprehensive test suite with pytest',
        agent: 'python-test-engineer',
        agentInput: {
          framework: 'pytest',
          coverage: true,
          testTypes: ['unit', 'integration', 'api'],
        },
        dependsOn: ['create-structure'],
        timeout: 60,
      },
      {
        id: 'setup-environment',
        name: 'Setup Python Environment',
        description: 'Create and configure Python virtual environment',
        agent: 'PythonEnvironmentManage',
        agentInput: {
          action: 'create',
          name: 'fastapi-project',
          type: 'venv',
          packages: ['fastapi', 'uvicorn', 'sqlalchemy', 'pydantic', 'pytest'],
        },
        timeout: 120,
      },
    ],
    errorHandling: {
      strategy: 'continue',
      maxRetries: 2,
      notifyOnError: true,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ============================================================================
  // DATA ANALYSIS WORKFLOWS
  // ============================================================================

  'data-analysis-pipeline': {
    id: 'data-analysis-pipeline',
    name: 'Automated Data Analysis Pipeline',
    description: 'Complete data analysis workflow from loading to visualization',
    category: 'analysis',
    version: '1.0.0',
    author: 'system',
    tags: ['python', 'data-analysis', 'pandas', 'visualization'],
    estimatedDuration: 15,
    successRate: 92,
    trigger: {
      type: 'file-change',
      config: {
        filePatterns: ['**/*.csv', '**/*.json', '**/*.xlsx'],
        ignorePatterns: ['*_backup.*', 'temp_*'],
        watchSubdirectories: true,
      },
    },
    steps: [
      {
        id: 'detect-data-file',
        name: 'Detect Data File',
        description: 'Identify and validate the new data file',
        agent: 'researcher',
        agentInput: {
          action: 'analyze-file',
          fileType: 'data',
          extractSchema: true,
        },
        timeout: 30,
      },
      {
        id: 'setup-python-env',
        name: 'Setup Data Science Environment',
        description: 'Ensure Python environment has required packages',
        agent: 'PythonEnvironmentManage',
        agentInput: {
          action: 'create',
          name: 'data-analysis-env',
          packages: ['pandas', 'numpy', 'matplotlib', 'seaborn', 'plotly', 'scipy'],
        },
        timeout: 120,
      },
      {
        id: 'load-explore-data',
        name: 'Load and Explore Data',
        description: 'Load data and perform initial exploration',
        agent: 'python-data-scientist',
        agentInput: {
          action: 'load-and-explore',
          generateSummary: true,
          detectIssues: true,
        },
        dependsOn: ['detect-data-file', 'setup-python-env'],
        inputMapping: {
          'filePath': 'detect-data-file.output.filePath',
          'fileSchema': 'detect-data-file.output.schema',
        },
        timeout: 180,
      },
      {
        id: 'create-visualizations',
        name: 'Create Visualizations',
        description: 'Generate appropriate visualizations for the data',
        agent: 'python-data-scientist',
        agentInput: {
          action: 'create-visualizations',
          chartTypes: ['distribution', 'correlation', 'categorical'],
          saveImages: true,
        },
        dependsOn: ['load-explore-data'],
        inputMapping: {
          'dataSummary': 'load-explore-data.output.summary',
          'dataTypes': 'load-explore-data.output.types',
        },
        timeout: 120,
      },
      {
        id: 'generate-report',
        name: 'Generate Analysis Report',
        description: 'Create comprehensive analysis report',
        agent: 'documenter',
        agentInput: {
          action: 'generate-data-report',
          includeVisualizations: true,
          format: 'markdown',
        },
        dependsOn: ['load-explore-data', 'create-visualizations'],
        inputMapping: {
          'analysisResults': 'load-explore-data.output.analysis',
          'visualizationPaths': 'create-visualizations.output.imagePaths',
        },
        timeout: 90,
      },
    ],
    errorHandling: {
      strategy: 'continue',
      maxRetries: 1,
      notifyOnError: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  'ml-model-training': {
    id: 'ml-model-training',
    name: 'Machine Learning Model Training Pipeline',
    description: 'Complete ML workflow from data preparation to model evaluation',
    category: 'analysis',
    version: '1.0.0',
    author: 'system',
    tags: ['python', 'machine-learning', 'scikit-learn', 'data-science'],
    estimatedDuration: 25,
    successRate: 88,
    trigger: {
      type: 'manual',
      config: {},
    },
    steps: [
      {
        id: 'analyze-dataset',
        name: 'Analyze Dataset for ML',
        description: 'Analyze dataset characteristics and ML suitability',
        agent: 'python-data-scientist',
        agentInput: {
          action: 'ml-data-analysis',
          targetVariable: 'user-specified',
          featureAnalysis: true,
        },
        timeout: 120,
      },
      {
        id: 'setup-ml-environment',
        name: 'Setup ML Environment',
        description: 'Create environment with ML packages',
        agent: 'PythonEnvironmentManage',
        agentInput: {
          action: 'create',
          name: 'ml-training-env',
          packages: ['scikit-learn', 'pandas', 'numpy', 'matplotlib', 'joblib'],
        },
        timeout: 150,
      },
      {
        id: 'feature-engineering',
        name: 'Feature Engineering',
        description: 'Perform feature engineering and selection',
        agent: 'python-ml-engineer',
        agentInput: {
          action: 'feature-engineering',
          scaling: true,
          selection: true,
          encoding: 'auto',
        },
        dependsOn: ['analyze-dataset'],
        inputMapping: {
          'dataCharacteristics': 'analyze-dataset.output.characteristics',
          'recommendedFeatures': 'analyze-dataset.output.features',
        },
        timeout: 180,
      },
      {
        id: 'model-selection',
        name: 'Model Selection and Training',
        description: 'Select and train appropriate ML models',
        agent: 'python-ml-engineer',
        agentInput: {
          action: 'train-models',
          algorithms: ['random-forest', 'gradient-boosting', 'logistic-regression'],
          crossValidation: true,
          hyperparameterTuning: true,
        },
        dependsOn: ['feature-engineering', 'setup-ml-environment'],
        inputMapping: {
          'processedFeatures': 'feature-engineering.output.features',
          'targetData': 'feature-engineering.output.target',
        },
        timeout: 300,
      },
      {
        id: 'evaluate-models',
        name: 'Evaluate Model Performance',
        description: 'Evaluate and compare model performance',
        agent: 'python-ml-engineer',
        agentInput: {
          action: 'evaluate-models',
          metrics: ['accuracy', 'precision', 'recall', 'f1-score', 'roc-auc'],
          crossValidation: true,
        },
        dependsOn: ['model-selection'],
        inputMapping: {
          'trainedModels': 'model-selection.output.models',
        },
        timeout: 120,
      },
      {
        id: 'generate-ml-report',
        name: 'Generate ML Report',
        description: 'Create comprehensive ML model report',
        agent: 'documenter',
        agentInput: {
          action: 'generate-ml-report',
          includeModelCards: true,
          includeRecommendations: true,
        },
        dependsOn: ['evaluate-models'],
        inputMapping: {
          'modelResults': 'evaluate-models.output.results',
          'bestModel': 'evaluate-models.output.bestModel',
        },
        timeout: 90,
      },
    ],
    errorHandling: {
      strategy: 'continue',
      maxRetries: 1,
      fallbackStep: 'generate-ml-report',
      notifyOnError: true,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ============================================================================
  // TESTING WORKFLOWS
  // ============================================================================

  'comprehensive-testing': {
    id: 'comprehensive-testing',
    name: 'Comprehensive Testing Workflow',
    description: 'Create and run comprehensive test suite for any project',
    category: 'testing',
    version: '1.0.0',
    author: 'system',
    tags: ['testing', 'automation', 'quality-assurance', 'ci-cd'],
    estimatedDuration: 20,
    successRate: 94,
    trigger: {
      type: 'git-event',
      config: {
        gitEvents: ['push', 'pull-request'],
        gitBranches: ['main', 'develop'],
      },
    },
    steps: [
      {
        id: 'analyze-project',
        name: 'Analyze Project Structure',
        description: 'Analyze project to determine testing requirements',
        agent: 'researcher',
        agentInput: {
          action: 'analyze-project-for-testing',
          identifyTestGaps: true,
          suggestTestTypes: true,
        },
        timeout: 60,
      },
      {
        id: 'generate-unit-tests',
        name: 'Generate Unit Tests',
        description: 'Generate comprehensive unit tests',
        agent: 'test-writer',
        agentInput: {
          action: 'generate-unit-tests',
          coverage: 'high',
          mocking: true,
          edgeCases: true,
        },
        dependsOn: ['analyze-project'],
        inputMapping: {
          'projectStructure': 'analyze-project.output.structure',
          'testRequirements': 'analyze-project.output.testingNeeds',
        },
        timeout: 180,
      },
      {
        id: 'generate-integration-tests',
        name: 'Generate Integration Tests',
        description: 'Generate integration tests for critical paths',
        agent: 'test-writer',
        agentInput: {
          action: 'generate-integration-tests',
          criticalPaths: true,
          databaseTesting: true,
          apiTesting: true,
        },
        dependsOn: ['analyze-project'],
        inputMapping: {
          'apiEndpoints': 'analyze-project.output.apiEndpoints',
          'databaseSchema': 'analyze-project.output.databaseSchema',
        },
        timeout: 150,
      },
      {
        id: 'setup-test-environment',
        name: 'Setup Test Environment',
        description: 'Setup test environment and dependencies',
        agent: 'general-purpose',
        agentInput: {
          action: 'setup-test-environment',
          installDependencies: true,
          setupDatabase: true,
        },
        dependsOn: ['generate-unit-tests', 'generate-integration-tests'],
        timeout: 120,
      },
      {
        id: 'run-tests',
        name: 'Run Test Suite',
        description: 'Execute all tests and generate coverage report',
        agent: 'general-purpose',
        agentInput: {
          action: 'run-tests',
          coverage: true,
          parallel: true,
          format: 'junit',
        },
        dependsOn: ['setup-test-environment'],
        timeout: 300,
      },
      {
        id: 'analyze-test-results',
        name: 'Analyze Test Results',
        description: 'Analyze test results and create quality report',
        agent: 'validator',
        agentInput: {
          action: 'validate-test-results',
          coverageThreshold: 80,
          qualityGates: true,
        },
        dependsOn: ['run-tests'],
        inputMapping: {
          'testResults': 'run-tests.output.results',
          'coverageReport': 'run-tests.output.coverage',
        },
        timeout: 60,
      },
    ],
    errorHandling: {
      strategy: 'continue',
      maxRetries: 1,
      notifyOnError: true,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ============================================================================
  // MAINTENANCE WORKFLOWS
  // ============================================================================

  'dependency-management': {
    id: 'dependency-management',
    name: 'Automated Dependency Management',
    description: 'Check for updates and manage project dependencies',
    category: 'maintenance',
    version: '1.0.0',
    author: 'system',
    tags: ['dependencies', 'maintenance', 'security', 'updates'],
    estimatedDuration: 12,
    successRate: 96,
    trigger: {
      type: 'schedule',
      config: {
        cronSchedule: '0 9 * * 1', // Monday 9 AM
        timezone: 'UTC',
      },
    },
    steps: [
      {
        id: 'check-dependencies',
        name: 'Check for Updates',
        description: 'Check for available updates and security vulnerabilities',
        agent: 'general-purpose',
        agentInput: {
          action: 'check-dependencies',
          security: true,
          outdated: true,
          vulnerabilityScan: true,
        },
        timeout: 90,
      },
      {
        id: 'analyze-compatibility',
        name: 'Analyze Compatibility',
        description: 'Analyze update compatibility and breaking changes',
        agent: 'security-auditor',
        agentInput: {
          action: 'analyze-compatibility',
          checkBreakingChanges: true,
          securityFocus: true,
        },
        dependsOn: ['check-dependencies'],
        inputMapping: {
          'availableUpdates': 'check-dependencies.output.updates',
          'vulnerabilities': 'check-dependencies.output.vulnerabilities',
        },
        timeout: 60,
      },
      {
        id: 'update-dependencies',
        name: 'Update Dependencies',
        description: 'Update safe dependencies automatically',
        agent: 'general-purpose',
        agentInput: {
          action: 'update-dependencies',
          safeUpdatesOnly: true,
          skipVulnerable: false,
        },
        dependsOn: ['analyze-compatibility'],
        inputMapping: {
          'safeUpdates': 'analyze-compatibility.output.safeUpdates',
        },
        timeout: 120,
      },
      {
        id: 'run-compatibility-tests',
        name: 'Run Compatibility Tests',
        description: 'Run tests to ensure updates don't break anything',
        agent: 'test-writer',
        agentInput: {
          action: 'run-compatibility-tests',
          quickTests: true,
        },
        dependsOn: ['update-dependencies'],
        timeout: 180,
      },
      {
        id: 'generate-update-report',
        name: 'Generate Update Report',
        description: 'Generate report on dependency updates and status',
        agent: 'documenter',
        agentInput: {
          action: 'generate-update-report',
          includeSecurity: true,
          includeCompatibility: true,
        },
        dependsOn: ['run-compatibility-tests'],
        inputMapping: {
          'updateResults': 'update-dependencies.output.results',
          'testResults': 'run-compatibility-tests.output.results',
          'remainingVulnerabilities': 'analyze-compatibility.output.vulnerabilities',
        },
        timeout: 45,
      },
    ],
    errorHandling: {
      strategy: 'continue',
      maxRetries: 2,
      notifyOnError: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  'code-quality-audit': {
    id: 'code-quality-audit',
    name: 'Comprehensive Code Quality Audit',
    description: 'Perform thorough code quality analysis and generate improvement report',
    category: 'maintenance',
    version: '1.0.0',
    author: 'system',
    tags: ['code-quality', 'audit', 'best-practices', 'refactoring'],
    estimatedDuration: 18,
    successRate: 91,
    trigger: {
      type: 'schedule',
      config: {
        cronSchedule: '0 10 * * 5', // Friday 10 AM
        timezone: 'UTC',
      },
    },
    steps: [
      {
        id: 'code-analysis',
        name: 'Static Code Analysis',
        description: 'Perform static code analysis and identify issues',
        agent: 'code-reviewer',
        agentInput: {
          action: 'comprehensive-review',
          includeSecurity: true,
          includePerformance: true,
          includeMaintainability: true,
        },
        timeout: 150,
      },
      {
        id: 'performance-analysis',
        name: 'Performance Analysis',
        description: 'Analyze code for performance bottlenecks',
        agent: 'performance-optimizer',
        agentInput: {
          action: 'analyze-performance',
          identifyBottlenecks: true,
          suggestOptimizations: true,
        },
        timeout: 120,
      },
      {
        id: 'security-audit',
        name: 'Security Audit',
        description: 'Perform security audit and vulnerability scan',
        agent: 'security-auditor',
        agentInput: {
          action: 'comprehensive-audit',
          owaspTop10: true,
          dependencyScan: true,
        },
        timeout: 90,
      },
      {
        id: 'architecture-review',
        name: 'Architecture Review',
        description: 'Review code architecture and design patterns',
        agent: 'architect',
        agentInput: {
          action: 'review-architecture',
          designPatterns: true,
          scalability: true,
          maintainability: true,
        },
        timeout: 100,
      },
      {
        id: 'generate-quality-report',
        name: 'Generate Quality Report',
        description: 'Generate comprehensive code quality report',
        agent: 'documenter',
        agentInput: {
          action: 'generate-quality-report',
          includeRecommendations: true,
          includeMetrics: true,
        },
        dependsOn: ['code-analysis', 'performance-analysis', 'security-audit', 'architecture-review'],
        inputMapping: {
          'codeReviewResults': 'code-analysis.output.results',
          'performanceResults': 'performance-analysis.output.bottlenecks',
          'securityResults': 'security-audit.output.vulnerabilities',
          'architectureResults': 'architecture-review.output.issues',
        },
        timeout: 60,
      },
    ],
    errorHandling: {
      strategy: 'continue',
      maxRetries: 1,
      notifyOnError: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
};