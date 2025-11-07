/**
 * Example PydanticAI Agents
 * Pre-configured agents that demonstrate PydanticAI capabilities
 */

import { PydanticAIManager } from './pydanticAIManager';

/**
 * Create a code reviewer agent using PydanticAI
 */
export async function createCodeReviewerAgent(manager: PydanticAIManager): Promise<string> {
  return await manager.createAgent({
    name: 'PydanticAI Code Reviewer',
    description: 'Reviews code for bugs, performance issues, and best practices using PydanticAI',
    model: 'anthropic:claude-3-5-sonnet-20241022',
    systemPrompt: `You are an expert code reviewer. Analyze code for:
- Bugs and potential errors
- Performance issues
- Security vulnerabilities
- Best practices and code style
- Type safety and error handling

Provide specific, actionable feedback with code examples.`,
    resultType: 'CodeReview',
  });
}

/**
 * Create a data analyst agent using PydanticAI
 */
export async function createDataAnalystAgent(manager: PydanticAIManager): Promise<string> {
  return await manager.createAgent({
    name: 'PydanticAI Data Analyst',
    description: 'Analyzes data and provides insights using PydanticAI with type-safe responses',
    model: 'anthropic:claude-3-5-sonnet-20241022',
    systemPrompt: `You are a data analyst. Analyze data and provide:
- Statistical summaries
- Trends and patterns
- Anomaly detection
- Visualiz

ation recommendations
- Actionable insights

Always structure your responses with clear metrics and confidence levels.`,
    resultType: 'DataAnalysis',
  });
}

/**
 * Create a documentation generator agent using PydanticAI
 */
export async function createDocGeneratorAgent(manager: PydanticAIManager): Promise<string> {
  return await manager.createAgent({
    name: 'PydanticAI Doc Generator',
    description: 'Generates comprehensive documentation using PydanticAI',
    model: 'anthropic:claude-3-5-sonnet-20241022',
    systemPrompt: `You are a technical documentation expert. Generate:
- Clear, concise documentation
- Code examples with explanations
- API reference documentation
- Usage guides
- Troubleshooting sections

Use markdown formatting and include examples.`,
  });
}

/**
 * Create a research assistant agent with web search capabilities
 */
export async function createResearchAgent(manager: PydanticAIManager): Promise<string> {
  return await manager.createAgent({
    name: 'PydanticAI Research Assistant',
    description: 'Conducts research and synthesizes information using PydanticAI',
    model: 'anthropic:claude-3-5-sonnet-20241022',
    systemPrompt: `You are a research assistant. Provide:
- Comprehensive research on topics
- Cited sources and references
- Comparative analysis
- Pros and cons evaluation
- Actionable recommendations

Always fact-check and provide confidence levels.`,
  });
}

/**
 * Create a SQL query generator agent
 */
export async function createSQLAgent(manager: PydanticAIManager): Promise<string> {
  return await manager.createAgent({
    name: 'PydanticAI SQL Generator',
    description: 'Generates and explains SQL queries using PydanticAI',
    model: 'anthropic:claude-3-5-sonnet-20241022',
    systemPrompt: `You are a database expert. Generate:
- Optimized SQL queries
- Query explanations
- Performance recommendations
- Index suggestions
- Database schema advice

Always validate query syntax and explain the logic.`,
  });
}

/**
 * Initialize all example agents for a session
 */
export async function initializeExampleAgents(sessionId: string): Promise<{
  codeReviewer: string;
  dataAnalyst: string;
  docGenerator: string;
  researcher: string;
  sqlAgent: string;
}> {
  const manager = new PydanticAIManager(sessionId);

  const [codeReviewer, dataAnalyst, docGenerator, researcher, sqlAgent] = await Promise.all([
    createCodeReviewerAgent(manager),
    createDataAnalystAgent(manager),
    createDocGeneratorAgent(manager),
    createResearchAgent(manager),
    createSQLAgent(manager),
  ]);

  return {
    codeReviewer,
    dataAnalyst,
    docGenerator,
    researcher,
    sqlAgent,
  };
}
