/**
 * Agent Ironman - Workflow Orchestrator
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: MIT
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { HookInput, SDKCompactBoundaryMessage } from '@anthropic-ai/claude-agent-sdk';
import { getSystemPrompt } from '../systemPrompt';
import { configureProvider } from '../providers';
import { AGENT_REGISTRY } from '../agents';
import { getPythonAgentDefinition } from '../agents/pythonAgents';
import { getProjectMemoryService } from '../memory/projectMemoryService';
import { getPythonManager } from '../server';
import type { WorkflowStep, WorkflowContext, StepResult } from './workflowEngine';

/**
 * Workflow execution result from agent
 */
export interface AgentExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  tokensUsed?: number;
  executionTime?: number;
  agentType: string;
}

/**
 * Workflow Orchestrator - Connects workflows with the agent execution system
 */
export class WorkflowOrchestrator {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Execute a single workflow step using the appropriate agent
   */
  async executeStep(
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<StepResult> {
    const startTime = Date.now();

    try {
      console.log(`🤖 Executing step: ${step.name} with agent: ${step.agent}`);

      // Execute the agent with the provided input
      const result = await this.executeAgent(step.agent, step.agentInput, context);

      return {
        stepId: step.id,
        status: result.success ? 'completed' : 'failed',
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        agent: step.agent,
        input: step.agentInput,
        output: result.output,
        error: result.error,
        tokensUsed: result.tokensUsed,
        executionTime: result.executionTime,
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

  /**
   * Execute an agent with the provided input
   */
  private async executeAgent(
    agentType: string,
    input: Record<string, any>,
    context: WorkflowContext
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    try {
      // Determine if this is a Python agent or regular agent
      const isPythonAgent = agentType.startsWith('python-') || this.isPythonAgent(agentType);

      if (isPythonAgent) {
        return await this.executePythonAgent(agentType, input, context);
      } else {
        return await this.executeRegularAgent(agentType, input, context);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
        agentType,
      };
    }
  }

  /**
   * Execute a regular (non-Python) agent
   */
  private async executeRegularAgent(
    agentType: string,
    input: Record<string, any>,
    context: WorkflowContext
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // Get agent definition
    let agentDefinition = AGENT_REGISTRY[agentType];
    if (!agentDefinition) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    // Build enhanced system prompt with workflow context
    const systemPrompt = this.buildWorkflowSystemPrompt(agentDefinition, context);

    // Build user message with task instructions
    const userMessage = this.buildWorkflowUserMessage(agentDefinition, input, context);

    // Get user config and configure provider
    const userConfig = await this.getUserConfig();
    const provider = configureProvider(userConfig);

    // Execute the agent
    const response = await query({
      messages: [
        { role: 'user', content: userMessage },
      ],
      system: systemPrompt,
      model: agentDefinition.model || 'sonnet',
      max_tokens: 4000,
      tools: this.getAvailableTools(agentDefinition),
      agents: {
        [agentType]: agentDefinition,
      },
      provider,
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Process response
    if (response.type === 'success') {
      return {
        success: true,
        output: this.extractOutputFromResponse(response),
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
        executionTime,
        agentType,
      };
    } else {
      return {
        success: false,
        error: `Agent execution failed: ${response.error}`,
        executionTime,
        agentType,
      };
    }
  }

  /**
   * Execute a Python agent with Python environment support
   */
  private async executePythonAgent(
    agentType: string,
    input: Record<string, any>,
    context: WorkflowContext
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // Get Python agent definition
    const agentDefinition = getPythonAgentDefinition(agentType);
    if (!agentDefinition) {
      throw new Error(`Unknown Python agent type: ${agentType}`);
    }

    // Ensure Python environment is available
    const pythonManager = getPythonManager(this.sessionId);
    const environments = pythonManager.getEnvironments();

    let environmentId: string | undefined;

    // Try to find an appropriate environment
    if (environments.length > 0) {
      // Use the most recently used environment
      environmentId = environments
        .sort((a, b) => b.lastUsed - a.lastUsed)[0].id;
    } else {
      // Create a default Python environment
      environmentId = await pythonManager.createVirtualEnvironment('default-workflow-env');
      await pythonManager.installPackage(environmentId, 'requests');
      await pythonManager.installPackage(environmentId, 'python-dotenv');
    }

    // Build system prompt with Python context
    const systemPrompt = this.buildPythonWorkflowSystemPrompt(agentDefinition, context, environmentId);

    // Build user message
    const userMessage = this.buildWorkflowUserMessage(agentDefinition, input, context);

    // Get user config and configure provider
    const userConfig = await this.getUserConfig();
    const provider = configureProvider(userConfig);

    // Execute the Python agent
    const response = await query({
      messages: [
        { role: 'user', content: userMessage },
      ],
      system: systemPrompt,
      model: agentDefinition.model || 'sonnet',
      max_tokens: 4000,
      tools: [
        ...this.getAvailableTools(agentDefinition),
        'PythonExecute', // Python agents always have access to Python execution
        'PythonPackageManage',
        'PythonEnvironmentManage',
      ],
      agents: {
        [agentType]: agentDefinition,
      },
      provider,
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Process response
    if (response.type === 'success') {
      return {
        success: true,
        output: this.extractOutputFromResponse(response),
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
        executionTime,
        agentType,
      };
    } else {
      return {
        success: false,
        error: `Python agent execution failed: ${response.error}`,
        executionTime,
        agentType,
      };
    }
  }

  /**
   * Build system prompt for workflow execution
   */
  private buildWorkflowSystemPrompt(
    agentDefinition: any,
    context: WorkflowContext
  ): string {
    let prompt = agentDefinition.prompt;

    // Add workflow context
    prompt += `\n\n## Workflow Context\nYou are executing as part of an automated workflow.\n`;
    prompt += `- Workflow ID: ${context.workflowId}\n`;
    prompt += `- Execution ID: ${context.executionId}\n`;
    prompt += `- Current Step: Part of a multi-step automated process\n`;

    // Add project memory context
    if (context.projectMemory) {
      prompt += `\n## Project Memory\nYou have access to learned patterns from previous sessions:\n`;
      prompt += `- Preferred patterns: ${context.projectMemory.codingStyle.preferredPatterns.slice(0, 5).join(', ')}\n`;
      prompt += `- Framework preferences: ${context.projectMemory.codingStyle.frameworkPreferences.join(', ')}\n`;
      prompt += `- Architecture choices: ${context.projectMemory.codingStyle.architectureChoices.slice(0, 3).join(', ')}\n`;
    }

    // Add workflow variables
    if (Object.keys(context.variables).length > 0) {
      prompt += `\n## Workflow Variables\n`;
      Object.entries(context.variables).forEach(([key, value]) => {
        prompt += `- ${key}: ${JSON.stringify(value)}\n`;
      });
    }

    return prompt;
  }

  /**
   * Build system prompt for Python workflow execution
   */
  private buildPythonWorkflowSystemPrompt(
    agentDefinition: any,
    context: WorkflowContext,
    environmentId: string
  ): string {
    let prompt = this.buildWorkflowSystemPrompt(agentDefinition, context);

    // Add Python environment information
    prompt += `\n\n## Python Environment\n`;
    prompt += `You have access to a Python environment (${environmentId}) for execution.\n`;
    prompt += `Use PythonExecute for running Python code.\n`;
    prompt += `Use PythonPackageManage for installing packages.\n`;
    prompt += `Use PythonEnvironmentManage for managing environments.\n`;

    return prompt;
  }

  /**
   * Build user message for workflow execution
   */
  private buildWorkflowUserMessage(
    agentDefinition: any,
    input: Record<string, any>,
    context: WorkflowContext
  ): string {
    let message = `Execute the following task as part of a workflow:\n\n`;

    // Add the main task
    if (input.task) {
      message += `**Task:** ${input.task}\n\n`;
    }

    // Add action-specific instructions
    if (input.action) {
      message += `**Action:** ${input.action}\n\n`;
    }

    // Add specific parameters
    const parameters = { ...input };
    delete parameters.task;
    delete parameters.action;

    if (Object.keys(parameters).length > 0) {
      message += `**Parameters:**\n`;
      Object.entries(parameters).forEach(([key, value]) => {
        message += `- ${key}: ${JSON.stringify(value)}\n`;
      });
      message += '\n';
    }

    // Add context from previous steps if available
    const stepContext = this.getStepContext(context);
    if (stepContext) {
      message += `**Context from Previous Steps:**\n${stepContext}\n\n`;
    }

    // Add workflow-specific instructions
    message += `**Workflow Instructions:**\n`;
    message += `- You are part of an automated workflow\n`;
    message += `- Focus on the specific task assigned to you\n`;
    message += `- Provide clear, actionable output that can be used by subsequent steps\n`;
    message += `- If you encounter errors, provide detailed error information\n`;
    message += `- Follow the agent-specific guidelines and best practices\n`;

    return message;
  }

  /**
   * Get context from previous workflow steps
   */
  private getStepContext(context: WorkflowContext): string {
    const contextLines: string[] = [];

    for (const [stepId, result] of Object.entries(context.stepResults)) {
      if (result && result.output) {
        contextLines.push(`- **${stepId}**: ${JSON.stringify(result.output).substring(0, 200)}...`);
      }
    }

    return contextLines.length > 0 ? contextLines.join('\n') : '';
  }

  /**
   * Get available tools for an agent
   */
  private getAvailableTools(agentDefinition: any): string[] {
    const baseTools = ['Read', 'Write', 'Grep', 'Glob', 'Bash'];

    if (agentDefinition.tools) {
      return [...baseTools, ...agentDefinition.tools];
    }

    return baseTools;
  }

  /**
   * Check if an agent is a Python agent
   */
  private isPythonAgent(agentType: string): boolean {
    return getPythonAgentDefinition(agentType) !== null;
  }

  /**
   * Extract meaningful output from agent response
   */
  private extractOutputFromResponse(response: any): any {
    // Extract the main content from the response
    if (response.content && response.content.length > 0) {
      const textContent = response.content
        .filter((content: any) => content.type === 'text')
        .map((content: any) => content.text)
        .join('\n');

      // Try to extract structured data if possible
      try {
        // Look for JSON blocks in the response
        const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }

        // Look for other structured formats
        const lines = textContent.split('\n');
        const structuredOutput: Record<string, any> = {};

        lines.forEach(line => {
          const match = line.match(/^(\w+):\s*(.+)$/);
          if (match) {
            structuredOutput[match[1]] = match[2];
          }
        });

        if (Object.keys(structuredOutput).length > 0) {
          return {
            text: textContent,
            structured: structuredOutput,
          };
        }

        return { text: textContent };
      } catch (error) {
        // If parsing fails, return raw text
        return { text: textContent };
      }
    }

    return { text: 'No content available' };
  }

  /**
   * Get user configuration
   */
  private async getUserConfig(): Promise<any> {
    // This should import the actual user config
    // For now, return a default config
    try {
      const { loadUserConfig } = await import('../userConfig');
      return loadUserConfig();
    } catch (error) {
      return {
        apiProvider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
      };
    }
  }
}