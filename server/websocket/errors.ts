/**
 * WebSocket Message Handler Error Classes
 * Custom error types for better error classification and debugging
 */

import type { ServerWebSocket } from "bun";
import type { ChatWebSocketData } from "./messageHandlers";

// Error types specific to WebSocket message handling
export type WebSocketErrorType =
  | 'json_parse_error'          // Failed to parse incoming JSON
  | 'validation_error'          // Invalid message structure/missing fields
  | 'sdk_error'                 // Error from Claude SDK
  | 'network_error'             // WebSocket/network issues
  | 'internal_error'            // Unexpected server errors
  | 'session_error'             // Session not found/invalid
  | 'permission_error'          // Permission/auth issues
  | 'timeout_error'             // Request timeout
  | 'abort_error';              // User-triggered abort

/**
 * Base class for all WebSocket errors with structured context
 */
export class WebSocketError extends Error {
  public readonly errorType: WebSocketErrorType;
  public readonly context: Record<string, unknown>;
  public readonly timestamp: number;
  public readonly sessionId?: string;
  public readonly isRetryable: boolean;

  constructor(
    errorType: WebSocketErrorType,
    message: string,
    context: Record<string, unknown> = {},
    sessionId?: string,
    isRetryable = false
  ) {
    super(message);
    this.name = 'WebSocketError';
    this.errorType = errorType;
    this.context = context;
    this.timestamp = Date.now();
    this.sessionId = sessionId;
    this.isRetryable = isRetryable;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to JSON for logging and client transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      errorType: this.errorType,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      sessionId: this.sessionId,
      isRetryable: this.isRetryable,
      stack: this.stack,
    };
  }

  /**
   * Get user-friendly message for client
   */
  getUserMessage(): string {
    return this.message;
  }
}

/**
 * JSON parse error - invalid message format
 */
export class JsonParseError extends WebSocketError {
  constructor(
    message: string,
    rawMessage: string,
    parseError: unknown,
    sessionId?: string
  ) {
    super(
      'json_parse_error',
      `Failed to parse JSON message: ${message}`,
      {
        rawMessage: rawMessage.substring(0, 200), // Limit raw message length
        parseError: parseError instanceof Error ? parseError.message : String(parseError),
      },
      sessionId,
      false
    );
    this.name = 'JsonParseError';
  }

  getUserMessage(): string {
    return 'Invalid message format. Please try again.';
  }
}

/**
 * Validation error - missing or invalid fields
 */
export class ValidationError extends WebSocketError {
  constructor(
    message: string,
    missingFields: string[],
    receivedData: Record<string, unknown>,
    sessionId?: string
  ) {
    super(
      'validation_error',
      message,
      {
        missingFields,
        receivedFields: Object.keys(receivedData),
        messageType: receivedData.type,
      },
      sessionId,
      false
    );
    this.name = 'ValidationError';
  }

  getUserMessage(): string {
    const fields = (this.context.missingFields as string[]).join(', ');
    return `Missing required fields: ${fields}`;
  }
}

/**
 * SDK error - error from Claude SDK operations
 */
export class SdkError extends WebSocketError {
  constructor(
    message: string,
    originalError: unknown,
    sessionId?: string,
    isRetryable = false
  ) {
    const errorMessage = originalError instanceof Error ? originalError.message : String(originalError);
    const errorStack = originalError instanceof Error ? originalError.stack : undefined;

    super(
      'sdk_error',
      message,
      {
        originalError: errorMessage,
        originalStack: errorStack,
      },
      sessionId,
      isRetryable
    );
    this.name = 'SdkError';
  }

  getUserMessage(): string {
    return this.message;
  }
}

/**
 * Session error - session not found or invalid
 */
export class SessionError extends WebSocketError {
  constructor(
    sessionId: string,
    reason: 'not_found' | 'invalid' | 'expired'
  ) {
    const messages = {
      not_found: 'Session not found',
      invalid: 'Invalid session',
      expired: 'Session has expired',
    };

    super(
      'session_error',
      messages[reason],
      { reason },
      sessionId,
      false
    );
    this.name = 'SessionError';
  }

  getUserMessage(): string {
    return `${this.message}. Please refresh the page.`;
  }
}

/**
 * Network error - WebSocket or connection issues
 */
export class NetworkError extends WebSocketError {
  constructor(
    message: string,
    originalError: unknown,
    sessionId?: string
  ) {
    super(
      'network_error',
      message,
      {
        originalError: originalError instanceof Error ? originalError.message : String(originalError),
      },
      sessionId,
      true // Network errors are typically retryable
    );
    this.name = 'NetworkError';
  }

  getUserMessage(): string {
    return 'Network connection issue. Retrying...';
  }
}

/**
 * Internal error - unexpected server errors
 */
export class InternalError extends WebSocketError {
  constructor(
    message: string,
    originalError: unknown,
    context: Record<string, unknown> = {},
    sessionId?: string
  ) {
    super(
      'internal_error',
      message,
      {
        ...context,
        originalError: originalError instanceof Error ? originalError.message : String(originalError),
        originalStack: originalError instanceof Error ? originalError.stack : undefined,
      },
      sessionId,
      false
    );
    this.name = 'InternalError';
  }

  getUserMessage(): string {
    return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Error response builder
 */
export interface ErrorResponse {
  type: 'error';
  errorType: WebSocketErrorType;
  message: string;
  context?: Record<string, unknown>;
  sessionId?: string;
  timestamp: number;
  requestId?: string;
  isRetryable?: boolean;
}

/**
 * Build structured error response for client
 */
export function buildErrorResponse(
  error: WebSocketError | Error | unknown,
  sessionId?: string,
  requestId?: string
): ErrorResponse {
  // WebSocketError instances
  if (error instanceof WebSocketError) {
    return {
      type: 'error',
      errorType: error.errorType,
      message: error.getUserMessage(),
      context: error.context,
      sessionId: error.sessionId || sessionId,
      timestamp: error.timestamp,
      requestId,
      isRetryable: error.isRetryable,
    };
  }

  // Generic Error instances
  if (error instanceof Error) {
    return {
      type: 'error',
      errorType: 'internal_error',
      message: error.message || 'An unexpected error occurred',
      context: { errorName: error.name },
      sessionId,
      timestamp: Date.now(),
      requestId,
      isRetryable: false,
    };
  }

  // Unknown error types
  return {
    type: 'error',
    errorType: 'internal_error',
    message: 'An unexpected error occurred',
    context: { rawError: String(error) },
    sessionId,
    timestamp: Date.now(),
    requestId,
    isRetryable: false,
  };
}

/**
 * Structured error logger with context
 */
export function logError(
  error: WebSocketError | Error | unknown,
  additionalContext: Record<string, unknown> = {}
): void {
  const timestamp = new Date().toISOString();
  const logPrefix = '❌ [WebSocket Error]';

  if (error instanceof WebSocketError) {
    console.error(logPrefix, {
      timestamp,
      errorType: error.errorType,
      message: error.message,
      sessionId: error.sessionId?.substring(0, 8),
      context: { ...error.context, ...additionalContext },
      stack: error.stack,
    });
  } else if (error instanceof Error) {
    console.error(logPrefix, {
      timestamp,
      errorType: 'unknown',
      message: error.message,
      name: error.name,
      context: additionalContext,
      stack: error.stack,
    });
  } else {
    console.error(logPrefix, {
      timestamp,
      errorType: 'unknown',
      message: String(error),
      context: additionalContext,
    });
  }
}

/**
 * Send error to client with proper formatting
 */
export function sendError(
  ws: ServerWebSocket<ChatWebSocketData>,
  error: WebSocketError | Error | unknown,
  sessionId?: string,
  requestId?: string
): void {
  try {
    const errorResponse = buildErrorResponse(error, sessionId, requestId);

    // Log the error with full context
    logError(error, { requestId });

    // Send to client if WebSocket is open
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(errorResponse));
    } else {
      console.warn('⚠️ WebSocket not open, cannot send error:', {
        readyState: ws.readyState,
        errorType: errorResponse.errorType,
      });
    }
  } catch (sendError) {
    // Fallback if sending fails
    console.error('❌ Failed to send error to client:', sendError);
    console.error('❌ Original error:', error);
  }
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  /**
   * Determine if error should trigger retry
   */
  shouldRetry(error: WebSocketError | Error | unknown, attemptNumber: number, maxAttempts: number): boolean {
    if (attemptNumber >= maxAttempts) {
      return false;
    }

    if (error instanceof WebSocketError) {
      return error.isRetryable;
    }

    // Check for retryable error patterns
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('rate limit')
    );
  },

  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(attemptNumber: number, baseDelayMs = 1000, maxDelayMs = 16000): number {
    const delay = baseDelayMs * Math.pow(2, attemptNumber - 1);
    return Math.min(delay, maxDelayMs);
  },

  /**
   * Handle specific error types with appropriate recovery
   */
  async handleError(
    error: WebSocketError | Error | unknown,
    ws: ServerWebSocket<ChatWebSocketData>,
    sessionId?: string
  ): Promise<void> {
    if (error instanceof SessionError) {
      // Session errors - inform user to refresh
      sendError(ws, error, sessionId);
    } else if (error instanceof ValidationError) {
      // Validation errors - send detailed feedback
      sendError(ws, error, sessionId);
    } else if (error instanceof JsonParseError) {
      // JSON parse errors - likely client issue
      sendError(ws, error, sessionId);
    } else if (error instanceof NetworkError) {
      // Network errors - retry automatically handled elsewhere
      sendError(ws, error, sessionId);
    } else {
      // Generic error handling
      sendError(ws, error, sessionId);
    }
  },
};
