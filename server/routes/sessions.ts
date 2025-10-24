/**
 * Session API Routes
 * Handles all session-related REST endpoints
 */

import { z } from "zod";
import { sessionDb } from "../database";
import { backgroundProcessManager } from "../backgroundProcessManager";
import { sessionStreamManager } from "../sessionStreamManager";
import { setupSessionCommands } from "../commandSetup";

// Validation schemas
const createSessionSchema = z.object({
  title: z.string().optional(),
  workingDirectory: z.string().optional(),
  mode: z.enum(['general', 'coder', 'intense-research', 'spark']).optional()
});

const renameFolderSchema = z.object({
  folderName: z.string().min(1, 'Folder name is required')
});

const updateDirectorySchema = z.object({
  workingDirectory: z.string().min(1, 'Working directory is required')
});

const updateModeSchema = z.object({
  mode: z.enum(['default', 'acceptEdits', 'bypassPermissions', 'plan'])
});

/**
 * Helper function to parse and validate JSON with consistent error handling
 */
async function parseJsonBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<{ success: true; data: T } | { success: false; error: Response }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errorMessages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        success: false,
        error: new Response(JSON.stringify({ error: `Validation failed: ${errorMessages}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('JSON parse error:', error);
    return {
      success: false,
      error: new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
}

/**
 * Handle session-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleSessionRoutes(
  req: Request,
  url: URL,
  activeQueries: Map<string, unknown>
): Promise<Response | undefined> {

  // GET /api/sessions - List all sessions
  if (url.pathname === '/api/sessions' && req.method === 'GET') {
    const { sessions, recreatedDirectories } = sessionDb.getSessions();

    return new Response(JSON.stringify({
      sessions,
      warning: recreatedDirectories.length > 0
        ? `Recreated ${recreatedDirectories.length} missing director${recreatedDirectories.length === 1 ? 'y' : 'ies'}`
        : undefined
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/sessions - Create new session
  if (url.pathname === '/api/sessions' && req.method === 'POST') {
    const parsed = await parseJsonBody(req, createSessionSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { title, workingDirectory, mode } = parsed.data;
    const session = sessionDb.createSession(title || 'New Chat', workingDirectory, mode || 'general');
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET /api/sessions/:id - Get session by ID
  if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'GET') {
    const sessionId = url.pathname.split('/').pop()!;
    const session = sessionDb.getSession(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // DELETE /api/sessions/:id - Delete session
  if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'DELETE') {
    const sessionId = url.pathname.split('/').pop()!;

    // Clean up background processes for this session before deleting
    await backgroundProcessManager.cleanupSession(sessionId);

    // Clean up SDK stream (aborts subprocess, completes message queue)
    sessionStreamManager.cleanupSession(sessionId, 'session_deleted');

    // Also delete the query
    activeQueries.delete(sessionId);

    const success = sessionDb.deleteSession(sessionId);

    return new Response(JSON.stringify({ success }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PATCH /api/sessions/:id - Rename session folder
  if (url.pathname.match(/^\/api\/sessions\/[^/]+$/) && req.method === 'PATCH') {
    const sessionId = url.pathname.split('/').pop()!;

    const parsed = await parseJsonBody(req, renameFolderSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { folderName } = parsed.data;

    console.log('📝 API: Rename folder request:', {
      sessionId,
      folderName
    });

    const result = sessionDb.renameFolderAndSession(sessionId, folderName);

    if (result.success) {
      const session = sessionDb.getSession(sessionId);
      return new Response(JSON.stringify({ success: true, session }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/sessions/:id/messages - Get session messages
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/messages$/) && req.method === 'GET') {
    const sessionId = url.pathname.split('/')[3];
    const messages = sessionDb.getSessionMessages(sessionId);

    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PATCH /api/sessions/:id/directory - Update working directory
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/directory$/) && req.method === 'PATCH') {
    const sessionId = url.pathname.split('/')[3];

    const parsed = await parseJsonBody(req, updateDirectorySchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { workingDirectory } = parsed.data;

    console.log('📁 API: Update working directory request:', {
      sessionId,
      directory: workingDirectory
    });

    const success = sessionDb.updateWorkingDirectory(sessionId, workingDirectory);

    if (success) {
      // Get updated session to retrieve mode
      const session = sessionDb.getSession(sessionId);

      if (session) {
        // Setup slash commands in the new directory
        setupSessionCommands(session.working_directory, session.mode);
      }

      // Clear SDK session ID to prevent resume with old directory's transcript files
      sessionDb.updateSdkSessionId(sessionId, null);

      // Cleanup SDK stream to force respawn with new cwd on next message
      sessionStreamManager.cleanupSession(sessionId, 'directory_changed');
      activeQueries.delete(sessionId);

      console.log(`🔄 SDK subprocess will restart with new cwd on next message (no resume)`);

      return new Response(JSON.stringify({ success: true, session }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid directory or session not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // PATCH /api/sessions/:id/mode - Update permission mode
  if (url.pathname.match(/^\/api\/sessions\/[^/]+\/mode$/) && req.method === 'PATCH') {
    const sessionId = url.pathname.split('/')[3];

    const parsed = await parseJsonBody(req, updateModeSchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { mode } = parsed.data;

    console.log('🔐 API: Update permission mode request:', {
      sessionId,
      mode
    });

    const success = sessionDb.updatePermissionMode(sessionId, mode);

    if (success) {
      const session = sessionDb.getSession(sessionId);
      return new Response(JSON.stringify({ success: true, session }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Session not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Route not handled by this module
  return undefined;
}
