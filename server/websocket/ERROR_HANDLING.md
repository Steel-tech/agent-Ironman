# WebSocket Error Handling Documentation

## Overview

This document describes the improved error handling system for WebSocket message handlers, implemented to provide better error classification, debugging context, and user feedback.

## Architecture

### Error Type Hierarchy

```
WebSocketError (base class)
├── JsonParseError        - Invalid JSON in WebSocket messages
├── ValidationError       - Missing/invalid fields in messages
├── SessionError          - Session not found/invalid/expired
├── SdkError             - Errors from Claude SDK operations
├── NetworkError         - WebSocket/network connection issues
└── InternalError        - Unexpected server errors
```

## Error Types

### 1. JsonParseError

**When:** Failed to parse incoming JSON message
**Retryable:** No
**Context:**
- `rawMessage`: First 200 chars of the invalid message
- `parseError`: Original parse error message

**Example:**
```typescript
throw new JsonParseError(
  "Unexpected token",
  message,
  parseError,
  sessionId
);
```

### 2. ValidationError

**When:** Missing required fields or invalid field values
**Retryable:** No
**Context:**
- `missingFields`: Array of missing field names
- `receivedFields`: Fields that were actually present
- `messageType`: Type of message being validated

**Example:**
```typescript
throw new ValidationError(
  'Missing required fields',
  ['content', 'sessionId'],
  data,
  sessionId
);
```

### 3. SessionError

**When:** Session not found, invalid, or expired
**Retryable:** No
**Context:**
- `reason`: 'not_found' | 'invalid' | 'expired'

**Example:**
```typescript
throw new SessionError(sessionId, 'not_found');
```

### 4. SdkError

**When:** Errors from Claude SDK operations
**Retryable:** Depends on underlying error
**Context:**
- `originalError`: Original error message
- `originalStack`: Stack trace from original error
- `parsedErrorType`: API error type (if applicable)
- `apiRequestId`: Request ID from API (if available)
- `stderrContext`: stderr output from SDK subprocess

**Example:**
```typescript
throw new SdkError(
  'Provider configuration failed',
  error,
  sessionId,
  false // not retryable
);
```

### 5. NetworkError

**When:** WebSocket or network connection issues
**Retryable:** Yes
**Context:**
- `originalError`: Original network error message

**Example:**
```typescript
throw new NetworkError(
  'Connection failed',
  error,
  sessionId
);
```

### 6. InternalError

**When:** Unexpected server errors
**Retryable:** No
**Context:**
- Custom context object provided at creation
- `originalError`: Original error message
- `originalStack`: Stack trace from original error

**Example:**
```typescript
throw new InternalError(
  'Unexpected error in handler',
  error,
  { phase: 'pre_sdk_initialization' },
  sessionId
);
```

## Error Flow

### 1. Main WebSocket Handler

```typescript
handleWebSocketMessage(ws, message, activeQueries)
  │
  ├─► Parse JSON ───► JsonParseError if fails
  │
  ├─► Validate type ───► ValidationError if missing
  │
  ├─► Route to handler ───► InternalError if handler fails
  │
  └─► Centralized error handling ───► sendError()
```

### 2. Individual Handlers

Each handler validates inputs and wraps errors appropriately:

```typescript
async function handleChatMessage(ws, data, activeQueries) {
  // Validate fields
  if (!content || !sessionId) {
    throw new ValidationError(...);
  }

  // Check session exists
  if (!session) {
    throw new SessionError(sessionId, 'not_found');
  }

  // Try SDK operation
  try {
    await configureProvider(providerType);
  } catch (error) {
    throw new SdkError(...);
  }
}
```

## Error Response Format

### Client Response Structure

```typescript
{
  type: 'error',
  errorType: 'validation_error' | 'sdk_error' | ...,
  message: 'User-friendly error message',
  context: {
    // Error-specific context
    missingFields?: string[],
    parsedErrorType?: string,
    ...
  },
  sessionId: string,
  timestamp: number,
  requestId: string,
  isRetryable: boolean
}
```

### Server Logging Structure

```typescript
❌ [WebSocket Error] {
  timestamp: '2025-01-24T...',
  errorType: 'sdk_error',
  message: 'Provider configuration failed',
  sessionId: 'abcd1234',
  context: {
    originalError: 'Invalid API key',
    phase: 'provider_config'
  },
  stack: '...'
}
```

## Error Recovery

### Retry Strategy

The `ErrorRecovery` utility provides retry logic:

```typescript
// Check if error should be retried
const shouldRetry = ErrorRecovery.shouldRetry(
  error,
  attemptNumber,
  maxAttempts
);

// Calculate backoff delay
const delayMs = ErrorRecovery.getRetryDelay(
  attemptNumber,
  baseDelayMs,   // Default: 1000ms
  maxDelayMs     // Default: 16000ms
);
```

### Exponential Backoff

| Attempt | Delay (1s base) | Delay (2s base) |
|---------|-----------------|-----------------|
| 1       | 1000ms          | 2000ms          |
| 2       | 2000ms          | 4000ms          |
| 3       | 4000ms          | 8000ms          |
| 4       | 8000ms          | 16000ms (cap)   |
| 5+      | 16000ms (cap)   | 16000ms (cap)   |

## Debugging Features

### 1. Request ID Tracking

Every WebSocket message gets a unique request ID:

```typescript
const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
```

This ID appears in:
- Error responses to client
- Server logs
- Retry attempt notifications

### 2. Session ID Context

All errors include the session ID (truncated in logs):

```typescript
sessionId: sessionId.toString().substring(0, 8)
```

### 3. Structured Logging

Errors are logged with full context:

```typescript
logError(error, {
  attemptNumber: 2,
  maxRetries: 3,
  sessionId: 'abcd1234',
  parsedErrorType: 'authentication_error',
  requestId: 'req_xyz'
});
```

### 4. Error Context Preservation

Each error type captures relevant context:

- **JsonParseError**: Raw message snippet, parse error
- **ValidationError**: Missing fields, received fields
- **SdkError**: Original error, stderr output, API details
- **InternalError**: Custom context, stack traces

## Usage Examples

### Example 1: Handling Chat Message

```typescript
async function handleChatMessage(ws, data, activeQueries) {
  // Validate inputs
  const missingFields = [];
  if (!data.content) missingFields.push('content');
  if (!data.sessionId) missingFields.push('sessionId');

  if (missingFields.length > 0) {
    throw new ValidationError(
      'Missing required fields',
      missingFields,
      data,
      data.sessionId
    );
  }

  // Check session
  const session = sessionDb.getSession(data.sessionId);
  if (!session) {
    throw new SessionError(data.sessionId, 'not_found');
  }

  // Configure provider
  try {
    await configureProvider(providerType);
  } catch (error) {
    throw new SdkError(
      'Provider configuration failed',
      error,
      data.sessionId,
      false
    );
  }
}
```

### Example 2: Retry Loop with Error Recovery

```typescript
let attemptNumber = 0;
const MAX_RETRIES = 3;

while (attemptNumber < MAX_RETRIES) {
  attemptNumber++;

  try {
    // Attempt operation
    await someOperation();
    break; // Success
  } catch (error) {
    // Log with context
    logError(error, {
      attemptNumber,
      maxRetries: MAX_RETRIES,
      sessionId: sessionId.substring(0, 8)
    });

    // Check if retryable
    if (!ErrorRecovery.shouldRetry(error, attemptNumber, MAX_RETRIES)) {
      sendError(ws, error, sessionId, requestId);
      break;
    }

    // Calculate backoff
    const delayMs = ErrorRecovery.getRetryDelay(attemptNumber);

    // Notify client
    ws.send(JSON.stringify({
      type: 'retry_attempt',
      attempt: attemptNumber,
      maxAttempts: MAX_RETRIES,
      delayMs
    }));

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
```

## Migration Guide

### Before (Generic Error Handling)

```typescript
try {
  const data = JSON.parse(message);
  // ... handle message
} catch (error) {
  console.error('WebSocket error:', error);
  ws.send(JSON.stringify({
    type: 'error',
    error: error.message
  }));
}
```

### After (Structured Error Handling)

```typescript
const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
let sessionId;

try {
  // Parse with specific error
  let data;
  try {
    data = JSON.parse(message);
  } catch (parseError) {
    throw new JsonParseError(
      parseError.message,
      message,
      parseError,
      ws.data?.sessionId
    );
  }

  sessionId = data.sessionId;

  // Validate with specific error
  if (!data.type) {
    throw new ValidationError(
      'Missing message type',
      ['type'],
      data,
      sessionId
    );
  }

  // ... handle message

} catch (error) {
  // Centralized error handling
  sendError(ws, error, sessionId, requestId);
}
```

## Benefits

### 1. Better Error Classification

- Clear error types instead of generic "Error occurred"
- Distinguishes between validation, SDK, network, and internal errors

### 2. Improved Debugging

- Request IDs for tracking specific errors
- Session context in all errors
- Structured logging with full context
- Error-specific metadata (missing fields, stderr output, etc.)

### 3. Better User Experience

- User-friendly error messages
- Retry notifications with progress
- Detailed error information for troubleshooting

### 4. Maintainability

- Consistent error handling across all handlers
- Reusable error classes and utilities
- Type-safe error structures
- Comprehensive test coverage

## Testing

Run the error handling tests:

```bash
bun test server/websocket/errors.test.ts
```

Tests cover:
- All error class constructors
- Error serialization (toJSON)
- User message generation
- Error response building
- Retry strategy logic
- Exponential backoff calculation
