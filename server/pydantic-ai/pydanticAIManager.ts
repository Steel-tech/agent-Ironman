/**
 * Agent Ironman - PydanticAI Integration
 * Manages PydanticAI agents and execution
 *
 * PydanticAI is a Python framework for building production-grade applications with Generative AI
 * This module provides TypeScript bindings to execute PydanticAI agents via Python
 */

import { getPythonManager } from '../server';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { getWorkingDirectoryPath } from '../directoryUtils';

/**
 * PydanticAI Agent Definition
 */
export interface PydanticAIAgent {
  id: string;
  name: string;
  description: string;
  model: string; // e.g., 'openai:gpt-4', 'anthropic:claude-3-5-sonnet-20241022'
  systemPrompt?: string;
  tools?: PydanticAITool[];
  resultType?: string; // Pydantic model name for response validation
  created: number;
  lastUsed: number;
}

/**
 * PydanticAI Tool Definition
 */
export interface PydanticAITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  implementation: string; // Python code
}

/**
 * PydanticAI Execution Result
 */
export interface PydanticAIResult {
  success: boolean;
  data?: any;
  cost?: number;
  timestamp: number;
  messageHistory?: any[];
  allMessages?: any[];
  newMessageIndex?: number;
  usage?: {
    requestTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  error?: string;
}

/**
 * PydanticAI Manager
 * Handles creation, management, and execution of PydanticAI agents
 */
export class PydanticAIManager {
  private sessionId: string;
  private agents: Map<string, PydanticAIAgent> = new Map();
  private pydanticAIDir: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.pydanticAIDir = join(getWorkingDirectoryPath(sessionId), '.pydantic-ai');

    // Ensure PydanticAI directory exists
    if (!existsSync(this.pydanticAIDir)) {
      mkdirSync(this.pydanticAIDir, { recursive: true });
    }

    // Load existing agents
    this.loadAgents();
  }

  /**
   * Create a new PydanticAI agent
   */
  async createAgent(config: {
    name: string;
    description: string;
    model: string;
    systemPrompt?: string;
    tools?: PydanticAITool[];
    resultType?: string;
  }): Promise<string> {
    const agentId = `pydantic_${Date.now()}_${config.name.replace(/\s+/g, '_')}`;

    const agent: PydanticAIAgent = {
      id: agentId,
      name: config.name,
      description: config.description,
      model: config.model,
      systemPrompt: config.systemPrompt,
      tools: config.tools || [],
      resultType: config.resultType,
      created: Date.now(),
      lastUsed: Date.now(),
    };

    this.agents.set(agentId, agent);
    await this.saveAgents();

    // Generate Python agent file
    await this.generateAgentFile(agent);

    return agentId;
  }

  /**
   * Execute a PydanticAI agent
   */
  async executeAgent(
    agentId: string,
    userPrompt: string,
    deps?: Record<string, any>
  ): Promise<PydanticAIResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const pythonManager = getPythonManager(this.sessionId);

    // Ensure PydanticAI is installed
    await this.ensurePydanticAIInstalled();

    // Generate execution script
    const scriptPath = await this.generateExecutionScript(agent, userPrompt, deps);

    // Execute via Python manager
    try {
      const result = await pythonManager.executePythonCode(
        `exec(open('${scriptPath}').read())`,
        undefined,
        this.pydanticAIDir
      );

      // Update last used
      agent.lastUsed = Date.now();
      await this.saveAgents();

      // Parse result
      if (result.exitCode === 0) {
        try {
          const data = JSON.parse(result.stdout);
          return {
            success: true,
            data: data.result,
            cost: data.cost,
            timestamp: Date.now(),
            messageHistory: data.message_history,
            allMessages: data.all_messages,
            newMessageIndex: data.new_message_index,
            usage: data.usage,
          };
        } catch (e) {
          return {
            success: true,
            data: result.stdout,
            timestamp: Date.now(),
          };
        }
      } else {
        return {
          success: false,
          error: result.stderr,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get all agents
   */
  getAgents(): PydanticAIAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): PydanticAIAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Delete agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
    await this.saveAgents();
  }

  /**
   * Ensure PydanticAI is installed in the Python environment
   */
  private async ensurePydanticAIInstalled(): Promise<void> {
    const pythonManager = getPythonManager(this.sessionId);
    const environments = pythonManager.getEnvironments();

    let envId: string | undefined;

    if (environments.length > 0) {
      // Use most recent environment
      envId = environments.sort((a, b) => b.lastUsed - a.lastUsed)[0].id;
    } else {
      // Create new environment for PydanticAI
      envId = await pythonManager.createVirtualEnvironment('pydantic-ai-env');
    }

    // Check if pydantic-ai is installed
    try {
      await pythonManager.executePythonCode(
        'import pydantic_ai',
        envId,
        this.pydanticAIDir
      );
    } catch {
      // Install pydantic-ai
      await pythonManager.installPackage(envId, 'pydantic-ai');
      await pythonManager.installPackage(envId, 'pydantic-ai-slim'); // Slim version without LLM SDKs
    }
  }

  /**
   * Generate Python agent file
   */
  private async generateAgentFile(agent: PydanticAIAgent): Promise<void> {
    const agentFilePath = join(this.pydanticAIDir, `${agent.id}.py`);

    const pythonCode = `
# PydanticAI Agent: ${agent.name}
# Generated by Agent Ironman
# Description: ${agent.description}

from pydantic_ai import Agent
from pydantic import BaseModel
import json
import sys

# Configure the agent
agent = Agent(
    '${agent.model}',
    ${agent.systemPrompt ? `system_prompt='${agent.systemPrompt.replace(/'/g, "\\'")}',` : ''}
)

${agent.resultType ? `
# Result type validation
class ${agent.resultType}(BaseModel):
    # Define your result structure here
    pass
` : ''}

${agent.tools && agent.tools.length > 0 ? `
# Register tools
${agent.tools.map(tool => `
@agent.tool
def ${tool.name}(${Object.keys(tool.parameters).map(p => `${p}: ${tool.parameters[p]}`).join(', ')}):
    """${tool.description}"""
    ${tool.implementation}
`).join('\n')}
` : ''}

def run_agent(user_prompt: str, deps=None):
    """Execute the agent with the given prompt"""
    try:
        result = agent.run_sync(user_prompt, deps=deps)

        return {
            'result': result.data,
            'cost': result.cost() if hasattr(result, 'cost') else None,
            'message_history': [msg.model_dump() for msg in result.message_history()],
            'all_messages': [msg.model_dump() for msg in result.all_messages()],
            'new_message_index': result.new_message_index(),
            'usage': {
                'request_tokens': result.usage().request_tokens if hasattr(result, 'usage') else 0,
                'response_tokens': result.usage().response_tokens if hasattr(result, 'usage') else 0,
                'total_tokens': result.usage().total_tokens if hasattr(result, 'usage') else 0,
            }
        }
    except Exception as e:
        return {
            'error': str(e),
            'result': None
        }

if __name__ == '__main__':
    # This will be called by the execution script
    pass
`;

    writeFileSync(agentFilePath, pythonCode, 'utf-8');
  }

  /**
   * Generate execution script
   */
  private async generateExecutionScript(
    agent: PydanticAIAgent,
    userPrompt: string,
    deps?: Record<string, any>
  ): Promise<string> {
    const scriptPath = join(this.pydanticAIDir, `exec_${agent.id}_${Date.now()}.py`);

    const pythonCode = `
import sys
import json
sys.path.insert(0, '${this.pydanticAIDir}')

from ${agent.id} import run_agent

# Execute agent
user_prompt = ${JSON.stringify(userPrompt)}
deps = ${deps ? JSON.stringify(deps) : 'None'}

result = run_agent(user_prompt, deps)
print(json.dumps(result))
`;

    writeFileSync(scriptPath, pythonCode, 'utf-8');
    return scriptPath;
  }

  /**
   * Load agents from storage
   */
  private loadAgents(): void {
    const agentsFile = join(this.pydanticAIDir, 'agents.json');
    if (existsSync(agentsFile)) {
      try {
        const data = JSON.parse(require('fs').readFileSync(agentsFile, 'utf-8'));
        data.forEach((agent: PydanticAIAgent) => {
          this.agents.set(agent.id, agent);
        });
      } catch (error) {
        console.warn('Failed to load PydanticAI agents:', error);
      }
    }
  }

  /**
   * Save agents to storage
   */
  private async saveAgents(): Promise<void> {
    const agentsFile = join(this.pydanticAIDir, 'agents.json');
    const data = Array.from(this.agents.values());
    writeFileSync(agentsFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}
