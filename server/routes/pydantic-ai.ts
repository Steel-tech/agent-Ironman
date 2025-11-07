/**
 * PydanticAI Services API Routes
 * Handles PydanticAI agent management and execution endpoints
 */

import { getPydanticAIManager } from "../server";
import { initializeExampleAgents } from "../pydantic-ai/exampleAgents";

/**
 * Handle PydanticAI-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handlePydanticAIRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {

  // ============================================================================
  // AGENT MANAGEMENT
  // ============================================================================

  // GET /api/pydantic-ai/:sessionId/agents - List all agents
  if (url.pathname.match(/^\/api\/pydantic-ai\/[^/]+\/agents$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/')[3];
      const manager = getPydanticAIManager(sessionId);
      const agents = manager.getAgents();

      return new Response(JSON.stringify(agents), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get agents'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/pydantic-ai/:sessionId/agents - Create new agent
  if (url.pathname.match(/^\/api\/pydantic-ai\/[^/]+\/agents$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/')[3];
      const agentConfig = await req.json();

      const manager = getPydanticAIManager(sessionId);
      const agentId = await manager.createAgent(agentConfig);

      return new Response(JSON.stringify({ agentId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create agent'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/pydantic-ai/:sessionId/agents/:agentId - Get specific agent
  if (url.pathname.match(/^\/api\/pydantic-ai\/[^/]+\/agents\/[^/]+$/) && req.method === 'GET') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const agentId = parts[5];

      const manager = getPydanticAIManager(sessionId);
      const agent = manager.getAgent(agentId);

      if (!agent) {
        return new Response(JSON.stringify({ error: 'Agent not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(agent), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get agent'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // DELETE /api/pydantic-ai/:sessionId/agents/:agentId - Delete agent
  if (url.pathname.match(/^\/api\/pydantic-ai\/[^/]+\/agents\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const agentId = parts[5];

      const manager = getPydanticAIManager(sessionId);
      await manager.deleteAgent(agentId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to delete agent'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ============================================================================
  // AGENT EXECUTION
  // ============================================================================

  // POST /api/pydantic-ai/:sessionId/agents/:agentId/execute - Execute agent
  if (url.pathname.match(/^\/api\/pydantic-ai\/[^/]+\/agents\/[^/]+\/execute$/) && req.method === 'POST') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const agentId = parts[5];
      const { userPrompt, deps } = await req.json();

      const manager = getPydanticAIManager(sessionId);
      const result = await manager.executeAgent(agentId, userPrompt, deps);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to execute agent'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ============================================================================
  // EXAMPLE AGENTS
  // ============================================================================

  // POST /api/pydantic-ai/:sessionId/init-examples - Initialize example agents
  if (url.pathname.match(/^\/api\/pydantic-ai\/[^/]+\/init-examples$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/')[3];
      const agentIds = await initializeExampleAgents(sessionId);

      return new Response(JSON.stringify({
        success: true,
        agentIds
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to initialize example agents'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // No PydanticAI route matched
  return undefined;
}
