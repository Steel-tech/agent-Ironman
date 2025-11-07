/**
 * Workflow Services API Routes
 * Handles workflow orchestration and execution endpoints
 */

import { getWorkflowEngine } from "../server";

/**
 * Handle Workflow-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleWorkflowRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {

  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================

  // GET /api/workflows/:sessionId - Get all workflows
  if (url.pathname.match(/^\/api\/workflows\/[^/]+$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/').pop()!;
      const workflowEngine = getWorkflowEngine(sessionId);
      const workflows = await workflowEngine.listWorkflows();

      return new Response(JSON.stringify(workflows), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get workflows'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/workflows/:sessionId - Create workflow
  if (url.pathname.match(/^\/api\/workflows\/[^/]+$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/').pop()!;
      const workflowDefinition = await req.json();

      const workflowEngine = getWorkflowEngine(sessionId);
      const workflowId = await workflowEngine.createWorkflow(workflowDefinition);

      return new Response(JSON.stringify({ workflowId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create workflow'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/workflows/:sessionId/:workflowId - Get workflow details
  if (url.pathname.match(/^\/api\/workflows\/[^/]+\/[^/]+$/) && req.method === 'GET') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const workflowId = parts[4];

      const workflowEngine = getWorkflowEngine(sessionId);
      const workflow = await workflowEngine.getWorkflow(workflowId);

      if (!workflow) {
        return new Response(JSON.stringify({ error: 'Workflow not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(workflow), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get workflow'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // DELETE /api/workflows/:sessionId/:workflowId - Delete workflow
  if (url.pathname.match(/^\/api\/workflows\/[^/]+\/[^/]+$/) && req.method === 'DELETE') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const workflowId = parts[4];

      const workflowEngine = getWorkflowEngine(sessionId);
      await workflowEngine.deleteWorkflow(workflowId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to delete workflow'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  // POST /api/workflows/:sessionId/:workflowId/execute - Execute workflow
  if (url.pathname.match(/^\/api\/workflows\/[^/]+\/[^/]+\/execute$/) && req.method === 'POST') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const workflowId = parts[4];
      const input = await req.json();

      const workflowEngine = getWorkflowEngine(sessionId);
      const executionId = await workflowEngine.executeWorkflow(workflowId, input);

      return new Response(JSON.stringify({ executionId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to execute workflow'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/workflows/:sessionId/:workflowId/executions - Get execution history
  if (url.pathname.match(/^\/api\/workflows\/[^/]+\/[^/]+\/executions$/) && req.method === 'GET') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const workflowId = parts[4];

      const workflowEngine = getWorkflowEngine(sessionId);
      const executions = await workflowEngine.getExecutions(workflowId);

      return new Response(JSON.stringify(executions), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get executions'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/workflows/:sessionId/:workflowId/executions/:executionId - Get execution status
  if (url.pathname.match(/^\/api\/workflows\/[^/]+\/[^/]+\/executions\/[^/]+$/) && req.method === 'GET') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const workflowId = parts[4];
      const executionId = parts[6];

      const workflowEngine = getWorkflowEngine(sessionId);
      const execution = await workflowEngine.getExecution(executionId);

      if (!execution) {
        return new Response(JSON.stringify({ error: 'Execution not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(execution), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get execution'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // POST /api/workflows/:sessionId/:workflowId/executions/:executionId/cancel - Cancel execution
  if (url.pathname.match(/^\/api\/workflows\/[^/]+\/[^/]+\/executions\/[^/]+\/cancel$/) && req.method === 'POST') {
    try {
      const parts = url.pathname.split('/');
      const sessionId = parts[3];
      const executionId = parts[6];

      const workflowEngine = getWorkflowEngine(sessionId);
      await workflowEngine.cancelExecution(executionId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to cancel execution'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ============================================================================
  // WORKFLOW SUGGESTIONS
  // ============================================================================

  // POST /api/workflows/:sessionId/suggest - Get workflow suggestions
  if (url.pathname.match(/^\/api\/workflows\/[^/]+\/suggest$/) && req.method === 'POST') {
    try {
      const sessionId = url.pathname.split('/')[3];
      const context = await req.json();

      const workflowEngine = getWorkflowEngine(sessionId);
      const suggestions = await workflowEngine.suggestWorkflows(context);

      return new Response(JSON.stringify(suggestions), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to suggest workflows'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/workflows/:sessionId/builtin - Get built-in workflows
  if (url.pathname.match(/^\/api\/workflows\/[^/]+\/builtin$/) && req.method === 'GET') {
    try {
      const sessionId = url.pathname.split('/')[3];
      const workflowEngine = getWorkflowEngine(sessionId);
      const builtinWorkflows = await workflowEngine.getBuiltinWorkflows();

      return new Response(JSON.stringify(builtinWorkflows), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to get built-in workflows'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // No workflow route matched
  return undefined;
}
