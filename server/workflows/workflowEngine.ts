/**
 * Agent Ironman - Workflow Engine
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: MIT
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getWorkingDirectoryPath } from '../directoryUtils';
import { getProjectMemoryService } from '../server';
import type { ProjectMemory } from '../memory/projectMemoryService';

/**
 * Workflow definition interface
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'deployment' | 'testing' | 'maintenance' | 'analysis' | 'custom';
  version: string;
  author: 'system' | 'user';

  // Trigger configuration
  trigger: WorkflowTrigger;

  // Workflow steps
  steps: WorkflowStep[];

  // Optional conditions and error handling
  conditions?: WorkflowCondition[];
  errorHandling?: WorkflowErrorHandling;

  // Metadata
  tags: string[];
  estimatedDuration: number; // in minutes
  successRate?: number; // percentage

  // When created and last modified
  createdAt: number;
  updatedAt: number;
}

/**
 * Workflow trigger configuration
 */
export interface WorkflowTrigger {
  type: 'manual' | 'git-event' | 'file-change' | 'schedule' | 'conversation' | 'error';
  config: TriggerConfig;
}

export interface TriggerConfig {
  // Git event triggers
  gitEvents?: ('push' | 'commit' | 'pull-request' | 'merge')[];
  gitBranches?: string[];

  // File change triggers
  filePatterns?: string[];
  ignorePatterns?: string[];
  watchSubdirectories?: boolean;

  // Schedule triggers
  cronSchedule?: string;
  timezone?: string;

  // Conversation triggers
  keywords?: string[];
  agentTypes?: string[];
  confidence?: number; // 0-1

  // Error triggers
  errorTypes?: string[];
  errorPatterns?: string[];

  // Manual triggers (no additional config needed)
}

/**
 * Individual workflow step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;

  // Agent configuration
  agent: string;
  agentInput: Record<string, any>;

  // Step configuration
  timeout?: number; // in seconds
  retries?: number;
  retryDelay?: number; // in seconds

  // Dependencies and conditions
  dependsOn?: string[]; // step IDs this step depends on
  condition?: string; // expression to evaluate

  // Input/Output mapping
  inputMapping?: Record<string, string>; // map previous step outputs to this step's input
  outputMapping?: Record<string, string>; // map this step's output for next steps

  // Parallel execution
  parallel?: boolean;
  parallelGroup?: string;
}

/**
 * Workflow condition for complex logic
 */
export interface WorkflowCondition {
  id: string;
  name: string;
  type: 'expression' | 'file-exists' | 'agent-result' | 'memory-pattern';
  expression: string;
  expectedValue?: any;
  operator?: 'equals' | 'contains' | 'greater-than' | 'less-than' | 'exists';
}

/**
 * Error handling configuration
 */
export interface WorkflowErrorHandling {
  strategy: 'stop' | 'continue' | 'retry' | 'fallback';
  maxRetries?: number;
  retryDelay?: number;
  fallbackStep?: string; // step ID to execute on error
  notifyOnError?: boolean;
}

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  sessionId: string;
  trigger: WorkflowTrigger;
  startTime: number;

  // Data passed between steps
  variables: Record<string, any>;

  // Execution state
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];

  // Results from completed steps
  stepResults: Record<string, any>;

  // Project memory for context
  projectMemory?: ProjectMemory;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  executionId: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  startTime: number;
  endTime?: number;
  duration?: number;

  // Step results
  stepResults: Record<string, StepResult>;

  // Overall result
  success: boolean;
  output?: any;
  error?: string;

  // Metrics
  stepsCompleted: number;
  stepsTotal: number;
  agentsUsed: string[];

  // User feedback
  userFeedback?: {
    rating: number; // 1-5
    comment?: string;
    helpful: boolean;
  };
}

/**
 * Individual step result
 */
export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: number;
  endTime?: number;
  duration?: number;

  // Agent execution result
  agent: string;
  input: any;
  output?: any;
  error?: string;

  // Metrics
  tokensUsed?: number;
  executionTime?: number;
  retryCount?: number;
}

/**
 * Workflow Engine - Orchestrates automated multi-agent workflows
 */
export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private scheduledWorkflows: Map<string, ScheduledWorkflow> = new Map();
  private sessionId: string;
  private workflowStore: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.workflowStore = join(getWorkingDirectoryPath(sessionId), 'workflows');
    this.loadWorkflows();
    this.loadBuiltinWorkflows();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(definition: WorkflowDefinition): Promise<string> {
    // Validate workflow definition
    this.validateWorkflow(definition);

    // Set timestamps
    const now = Date.now();
    definition.createdAt = now;
    definition.updatedAt = now;

    // Save workflow
    this.workflows.set(definition.id, definition);
    await this.saveWorkflows();

    console.log(`🔄 Created workflow: ${definition.name} (${definition.id})`);
    return definition.id;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    triggerContext?: Partial<WorkflowTrigger>,
    initialVariables?: Record<string, any>
  ): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const projectMemory = await getProjectMemoryService(this.sessionId).getLatestMemory(this.sessionId);

    const context: WorkflowContext = {
      workflowId,
      executionId,
      sessionId: this.sessionId,
      trigger: triggerContext || workflow.trigger,
      startTime: Date.now(),
      variables: { ...initialVariables },
      completedSteps: [],
      failedSteps: [],
      stepResults: {},
      projectMemory: projectMemory || undefined,
    };

    const execution = new WorkflowExecution(workflow, context);
    this.activeExecutions.set(executionId, execution);

    console.log(`🚀 Starting workflow: ${workflow.name} (${executionId})`);

    try {
      const result = await execution.execute();
      this.activeExecutions.delete(executionId);

      // Learn from successful execution
      if (result.success) {
        await this.learnFromExecution(workflow, context, result);
      }

      return result;
    } catch (error) {
      this.activeExecutions.delete(executionId);
      throw error;
    }
  }

  /**
   * Schedule a workflow for automatic execution
   */
  async scheduleWorkflow(
    workflowId: string,
    cronSchedule: string,
    timezone?: string
  ): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (workflow.trigger.type !== 'manual') {
      throw new Error(`Workflow ${workflowId} already has a non-manual trigger`);
    }

    const scheduledId = `sched_${Date.now()}_${workflowId}`;

    // This would integrate with a cron job scheduler
    // For now, we'll store the schedule and implement basic scheduling
    const scheduledWorkflow: ScheduledWorkflow = {
      id: scheduledId,
      workflowId,
      cronSchedule,
      timezone: timezone || 'UTC',
      nextRun: this.calculateNextRun(cronSchedule, timezone),
      isActive: true,
    };

    this.scheduledWorkflows.set(scheduledId, scheduledWorkflow);
    await this.saveScheduledWorkflows();

    console.log(`⏰ Scheduled workflow: ${workflow.name} (${cronSchedule})`);
    return scheduledId;
  }

  /**
   * Get all available workflows
   */
  getWorkflows(category?: string): WorkflowDefinition[] {
    const workflows = Array.from(this.workflows.values());
    return category ? workflows.filter(w => w.category === category) : workflows;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * Get active workflow executions
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Cancel a running workflow execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    await execution.cancel();
    this.activeExecutions.delete(executionId);
    return true;
  }

  /**
   * Suggest workflows based on current context
   */
  async suggestWorkflows(context: WorkflowSuggestionContext): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];
    const projectMemory = await getProjectMemoryService(this.sessionId).getLatestMemory(this.sessionId);

    for (const workflow of this.workflows.values()) {
      const score = this.calculateWorkflowScore(workflow, context, projectMemory);
      if (score > 0.3) { // Only suggest relevant workflows
        suggestions.push({
          workflow,
          score,
          reason: this.generateSuggestionReason(workflow, context, score),
        });
      }
    }

    // Sort by relevance score
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  // Private methods

  private validateWorkflow(definition: WorkflowDefinition): void {
    if (!definition.id || !definition.name) {
      throw new Error('Workflow must have id and name');
    }

    if (!definition.steps || definition.steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate step dependencies
    const stepIds = new Set(definition.steps.map(s => s.id));
    for (const step of definition.steps) {
      if (step.dependsOn) {
        for (const dep of step.dependsOn) {
          if (!stepIds.has(dep)) {
            throw new Error(`Step ${step.id} depends on non-existent step: ${dep}`);
          }
        }
      }
    }
  }

  private async loadWorkflows(): Promise<void> {
    const workflowFile = join(this.workflowStore, 'workflows.json');
    if (existsSync(workflowFile)) {
      try {
        const data = JSON.parse(readFileSync(workflowFile, 'utf-8'));
        data.forEach((workflow: WorkflowDefinition) => {
          this.workflows.set(workflow.id, workflow);
        });
      } catch (error) {
        console.warn('Failed to load workflows:', error);
      }
    }
  }

  private async saveWorkflows(): Promise<void> {
    const workflowFile = join(this.workflowStore, 'workflows.json');
    const data = Array.from(this.workflows.values());
    writeFileSync(workflowFile, JSON.stringify(data, null, 2));
  }

  private async loadBuiltinWorkflows(): Promise<void> {
    // Load built-in workflows from the builtinWorkflows file
    const { BUILTIN_WORKFLOWS } = await import('./builtinWorkflows');

    for (const workflow of Object.values(BUILTIN_WORKFLOWS)) {
      if (!this.workflows.has(workflow.id)) {
        workflow.author = 'system';
        this.workflows.set(workflow.id, workflow);
      }
    }

    await this.saveWorkflows();
  }

  private async saveScheduledWorkflows(): Promise<void> {
    const scheduleFile = join(this.workflowStore, 'scheduled.json');
    const data = Array.from(this.scheduledWorkflows.values());
    writeFileSync(scheduleFile, JSON.stringify(data, null, 2));
  }

  private calculateNextRun(cronSchedule: string, timezone?: string): number {
    // Simplified cron calculation - would use a proper cron library
    const now = new Date();
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    return nextRun.getTime();
  }

  private calculateWorkflowScore(
    workflow: WorkflowDefinition,
    context: WorkflowSuggestionContext,
    projectMemory?: ProjectMemory | null
  ): number {
    let score = 0;

    // Score based on trigger type matching current context
    if (context.fileChanged && workflow.trigger.type === 'file-change') {
      score += 0.3;
    }

    if (context.gitEvent && workflow.trigger.type === 'git-event') {
      score += 0.4;
    }

    if (context.conversationContext && workflow.trigger.type === 'conversation') {
      score += 0.2;
    }

    // Score based on project memory patterns
    if (projectMemory) {
      const workflowTags = workflow.tags;
      const userPatterns = [
        ...projectMemory.codingStyle.preferredPatterns,
        ...projectMemory.codingStyle.frameworkPreferences,
      ];

      const matchingPatterns = workflowTags.filter(tag =>
        userPatterns.some(pattern => pattern.toLowerCase().includes(tag.toLowerCase()))
      );

      score += matchingPatterns.length * 0.1;
    }

    // Score based on recent success rate
    if (workflow.successRate) {
      score += (workflow.successRate / 100) * 0.2;
    }

    return Math.min(score, 1.0);
  }

  private generateSuggestionReason(
    workflow: WorkflowDefinition,
    context: WorkflowSuggestionContext,
    score: number
  ): string {
    if (context.fileChanged && workflow.trigger.type === 'file-change') {
      return `File changes detected - this workflow can help process ${workflow.trigger.config.filePatterns?.join(', ') || 'files'}`;
    }

    if (context.gitEvent && workflow.trigger.type === 'git-event') {
      return `Git event detected - this workflow can automate ${workflow.trigger.config.gitEvents?.join(', ') || 'git operations'}`;
    }

    if (score > 0.7) {
      return 'Highly relevant to your current work patterns';
    }

    return workflow.description;
  }

  private async learnFromExecution(
    workflow: WorkflowDefinition,
    context: WorkflowContext,
    result: WorkflowResult
  ): Promise<void> {
    // Update workflow success rate
    const totalExecutions = (workflow.successRate || 0) * 10 + 1;
    const successfulExecutions = (workflow.successRate || 0) * 10 + (result.success ? 1 : 0);

    workflow.successRate = (successfulExecutions / totalExecutions) * 100;
    workflow.updatedAt = Date.now();

    await this.saveWorkflows();

    // Store learning patterns in project memory
    const memoryService = getProjectMemoryService(this.sessionId);

    const pattern = {
      type: 'workflow' as const,
      context: 'workflow-execution',
      pattern: `executed-workflow-${workflow.id}`,
      confidence: result.success ? 0.8 : 0.3,
    };

    await memoryService.updateCodingStyle(this.sessionId, [pattern]);
  }
}

/**
 * Workflow execution instance
 */
class WorkflowExecution {
  private workflow: WorkflowDefinition;
  private context: WorkflowContext;
  private isCancelled = false;
  private currentExecution?: Promise<WorkflowResult>;

  constructor(workflow: WorkflowDefinition, context: WorkflowContext) {
    this.workflow = workflow;
    this.context = context;
  }

  async execute(): Promise<WorkflowResult> {
    this.currentExecution = this.doExecute();
    return this.currentExecution;
  }

  private async doExecute(): Promise<WorkflowResult> {
    const startTime = Date.now();
    const stepResults: Record<string, StepResult> = {};
    let currentStepIndex = 0;

    try {
      // Execute steps in order, respecting dependencies
      while (currentStepIndex < this.workflow.steps.length && !this.isCancelled) {
        const step = this.workflow.steps[currentStepIndex];

        // Check if dependencies are satisfied
        if (step.dependsOn) {
          const dependenciesMet = step.dependsOn.every(depId =>
            stepResults[depId] && stepResults[depId].status === 'completed'
          );

          if (!dependenciesMet) {
            currentStepIndex++;
            continue;
          }
        }

        // Execute step
        const stepResult = await this.executeStep(step, stepResults);
        stepResults[step.id] = stepResult;

        if (stepResult.status === 'failed' && this.workflow.errorHandling?.strategy === 'stop') {
          break;
        }

        currentStepIndex++;
      }

      const endTime = Date.now();
      const success = Object.values(stepResults).every(result =>
        result.status === 'completed' || result.status === 'skipped'
      );

      return {
        executionId: this.context.executionId,
        workflowId: this.workflow.id,
        status: this.isCancelled ? 'cancelled' : (success ? 'completed' : 'failed'),
        startTime,
        endTime,
        duration: endTime - startTime,
        stepResults,
        success,
        stepsCompleted: Object.values(stepResults).filter(r => r.status === 'completed').length,
        stepsTotal: this.workflow.steps.length,
        agentsUsed: this.workflow.steps.map(s => s.agent),
      };
    } catch (error) {
      return {
        executionId: this.context.executionId,
        workflowId: this.workflow.id,
        status: 'failed',
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        stepResults,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stepsCompleted: Object.values(stepResults).filter(r => r.status === 'completed').length,
        stepsTotal: this.workflow.steps.length,
        agentsUsed: this.workflow.steps.map(s => s.agent),
      };
    }
  }

  private async executeStep(step: WorkflowStep, previousResults: Record<string, StepResult>): Promise<StepResult> {
    const startTime = Date.now();

    try {
      // Prepare input for this step
      const input = this.prepareStepInput(step, previousResults);

      // This would integrate with the agent execution system
      // For now, we'll simulate the execution
      const output = await this.executeAgent(step.agent, input);

      return {
        stepId: step.id,
        status: 'completed',
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        agent: step.agent,
        input,
        output,
      };
    } catch (error) {
      return {
        stepId: step.id,
        status: 'failed',
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        agent: step.agent,
        input: step.agentInput,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private prepareStepInput(step: WorkflowStep, previousResults: Record<string, StepResult>): any {
    let input = { ...step.agentInput };

    // Apply input mapping from previous step results
    if (step.inputMapping) {
      for (const [targetKey, sourcePath] of Object.entries(step.inputMapping)) {
        const [stepId, resultPath] = sourcePath.split('.');
        const sourceResult = previousResults[stepId];

        if (sourceResult && sourceResult.output) {
          const value = this.getNestedValue(sourceResult.output, resultPath);
          if (value !== undefined) {
            this.setNestedValue(input, targetKey, value);
          }
        }
      }
    }

    // Add context variables
    input.context = this.context;
    input.workflowVariables = this.context.variables;

    return input;
  }

  private async executeAgent(agentType: string, input: any): Promise<any> {
    // This would integrate with the actual agent execution system
    // For now, simulate execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: `Agent ${agentType} executed successfully`,
      output: `Simulated output from ${agentType}`,
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => current[key] = current[key] || {}, obj);
    target[lastKey] = value;
  }

  async cancel(): Promise<void> {
    this.isCancelled = true;
  }
}

// Supporting interfaces

export interface WorkflowSuggestionContext {
  fileChanged?: string;
  gitEvent?: string;
  conversationContext?: string;
  currentAgent?: string;
  userIntent?: string;
}

export interface WorkflowSuggestion {
  workflow: WorkflowDefinition;
  score: number;
  reason: string;
}

export interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  cronSchedule: string;
  timezone: string;
  nextRun: number;
  isActive: boolean;
}