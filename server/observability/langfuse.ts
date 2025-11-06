/**
 * Langfuse Observability Integration
 * Provides LLM tracing, cost tracking, and performance monitoring
 */

import Langfuse from 'langfuse';

/**
 * Initialize Langfuse client (lazy initialization)
 */
let langfuseClient: Langfuse | null = null;

function getLangfuse(): Langfuse | null {
  // Only initialize if credentials are provided
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) {
    return null;
  }

  if (!langfuseClient) {
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    });

    console.log('✅ Langfuse observability initialized');
  }

  return langfuseClient;
}

/**
 * Check if Langfuse is enabled
 */
export function isLangfuseEnabled(): boolean {
  return !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
}

/**
 * Create a new trace for a conversation session
 *
 * @param sessionId - Unique session identifier
 * @param userId - Optional user identifier
 * @param metadata - Additional metadata
 * @returns Langfuse trace object or null if not configured
 */
export function createTrace(
  sessionId: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  const client = getLangfuse();
  if (!client) return null;

  return client.trace({
    sessionId,
    userId,
    metadata: {
      application: 'agent-ironman',
      version: '6.3.0',
      ...metadata,
    },
  });
}

/**
 * Create a generation span for LLM calls
 *
 * Usage:
 * ```typescript
 * const trace = createTrace(sessionId);
 * if (trace) {
 *   const generation = createGeneration(trace, {
 *     name: 'claude-agent-query',
 *     model: 'claude-3-5-sonnet-20241022',
 *     input: { prompt: '...' }
 *   });
 *
 *   // ... make LLM call ...
 *
 *   generation.end({
 *     output: response,
 *     usage: { input: 100, output: 50 }
 *   });
 * }
 * ```
 */
export function createGeneration(
  trace: ReturnType<typeof createTrace>,
  options: {
    name: string;
    model: string;
    input: any;
    modelParameters?: Record<string, any>;
  }
) {
  if (!trace) return null;

  return trace.generation({
    name: options.name,
    model: options.model,
    input: options.input,
    modelParameters: options.modelParameters,
  });
}

/**
 * Log an event within a trace
 *
 * @param trace - Parent trace
 * @param name - Event name
 * @param metadata - Event metadata
 */
export function logEvent(
  trace: ReturnType<typeof createTrace>,
  name: string,
  metadata?: Record<string, any>
) {
  if (!trace) return;

  trace.event({
    name,
    metadata,
  });
}

/**
 * Flush pending events (call on shutdown)
 */
export async function flushLangfuse(): Promise<void> {
  const client = getLangfuse();
  if (client) {
    await client.flushAsync();
    console.log('✅ Langfuse events flushed');
  }
}

/**
 * Shutdown Langfuse client gracefully
 */
export async function shutdownLangfuse(): Promise<void> {
  const client = getLangfuse();
  if (client) {
    await client.shutdownAsync();
    langfuseClient = null;
    console.log('✅ Langfuse client shutdown');
  }
}

// Export singleton
export const langfuse = { getLangfuse };
