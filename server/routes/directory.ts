/**
 * Directory API Routes
 * Handles directory validation and picker endpoints
 */

import { z } from "zod";
import { validateDirectory } from "../directoryUtils";
import { openDirectoryPicker } from "../directoryPicker";

// Validation schemas
const validateDirectorySchema = z.object({
  directory: z.string().min(1, 'Directory path is required')
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
 * Handle directory-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleDirectoryRoutes(req: Request, url: URL): Promise<Response | undefined> {

  // POST /api/validate-directory - Validate directory path
  if (url.pathname === '/api/validate-directory' && req.method === 'POST') {
    const parsed = await parseJsonBody(req, validateDirectorySchema);
    if (!parsed.success) {
      return parsed.error;
    }

    const { directory } = parsed.data;

    console.log('🔍 API: Validate directory request:', directory);

    const validation = validateDirectory(directory);

    return new Response(JSON.stringify({
      valid: validation.valid,
      expanded: validation.expanded,
      error: validation.error
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/pick-directory - Open directory picker dialog
  if (url.pathname === '/api/pick-directory' && req.method === 'POST') {
    console.log('📂 API: Opening directory picker dialog...');

    try {
      const selectedPath = await openDirectoryPicker();

      if (selectedPath) {
        console.log('✅ Directory selected:', selectedPath);
        return new Response(JSON.stringify({
          success: true,
          path: selectedPath
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        console.log('⚠️  Directory picker cancelled');
        return new Response(JSON.stringify({
          success: false,
          cancelled: true
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Directory picker error:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Route not handled by this module
  return undefined;
}
