/**
 * Tests for WebSocket Error Handling
 */

import { describe, test, expect } from "bun:test";
import {
  WebSocketError,
  JsonParseError,
  ValidationError,
  SessionError,
  SdkError,
  InternalError,
  NetworkError,
  buildErrorResponse,
  ErrorRecovery,
} from "./errors";

describe("WebSocket Error Classes", () => {
  test("JsonParseError creates proper error structure", () => {
    const error = new JsonParseError(
      "Unexpected token",
      '{"invalid: json}',
      new SyntaxError("Unexpected token"),
      "session123"
    );

    expect(error.errorType).toBe("json_parse_error");
    expect(error.sessionId).toBe("session123");
    expect(error.isRetryable).toBe(false);
    expect(error.context.rawMessage).toBeDefined();
    expect(error.context.parseError).toBeDefined();
    expect(error.getUserMessage()).toContain("Invalid message format");
  });

  test("ValidationError captures missing fields", () => {
    const error = new ValidationError(
      "Missing required fields",
      ["content", "sessionId"],
      { type: "chat" },
      "session123"
    );

    expect(error.errorType).toBe("validation_error");
    expect(error.context.missingFields).toEqual(["content", "sessionId"]);
    expect(error.getUserMessage()).toContain("content, sessionId");
  });

  test("SessionError handles different error reasons", () => {
    const notFoundError = new SessionError("session123", "not_found");
    expect(notFoundError.getUserMessage()).toContain("Session not found");

    const expiredError = new SessionError("session456", "expired");
    expect(expiredError.getUserMessage()).toContain("expired");
  });

  test("SdkError properly wraps SDK errors", () => {
    const originalError = new Error("API key invalid");
    const sdkError = new SdkError(
      "Provider configuration failed",
      originalError,
      "session123",
      false
    );

    expect(sdkError.errorType).toBe("sdk_error");
    expect(sdkError.isRetryable).toBe(false);
    expect(sdkError.context.originalError).toBe("API key invalid");
  });

  test("NetworkError is marked as retryable", () => {
    const error = new NetworkError(
      "Connection failed",
      new Error("ECONNREFUSED"),
      "session123"
    );

    expect(error.errorType).toBe("network_error");
    expect(error.isRetryable).toBe(true);
    expect(error.getUserMessage()).toContain("Network");
  });

  test("InternalError captures full context", () => {
    const error = new InternalError(
      "Unexpected failure",
      new Error("Something broke"),
      { phase: "initialization", component: "SDK" },
      "session123"
    );

    expect(error.errorType).toBe("internal_error");
    expect(error.context.phase).toBe("initialization");
    expect(error.context.component).toBe("SDK");
    expect(error.context.originalError).toBe("Something broke");
  });
});

describe("Error Response Builder", () => {
  test("buildErrorResponse handles WebSocketError", () => {
    const error = new ValidationError(
      "Missing field",
      ["sessionId"],
      { type: "chat" },
      "session123"
    );

    const response = buildErrorResponse(error, undefined, "req_12345");

    expect(response.type).toBe("error");
    expect(response.errorType).toBe("validation_error");
    expect(response.sessionId).toBe("session123");
    expect(response.requestId).toBe("req_12345");
    expect(response.isRetryable).toBe(false);
  });

  test("buildErrorResponse handles generic Error", () => {
    const error = new Error("Something went wrong");
    const response = buildErrorResponse(error, "session456");

    expect(response.type).toBe("error");
    expect(response.errorType).toBe("internal_error");
    expect(response.message).toBe("Something went wrong");
    expect(response.sessionId).toBe("session456");
  });

  test("buildErrorResponse handles unknown error types", () => {
    const error = "String error";
    const response = buildErrorResponse(error, "session789");

    expect(response.type).toBe("error");
    expect(response.errorType).toBe("internal_error");
    expect(response.context?.rawError).toBe("String error");
  });
});

describe("Error Recovery Strategies", () => {
  test("shouldRetry returns false when max attempts reached", () => {
    const error = new NetworkError("Network failed", new Error(), "session123");
    expect(ErrorRecovery.shouldRetry(error, 5, 3)).toBe(false);
  });

  test("shouldRetry respects error isRetryable flag", () => {
    const retryableError = new NetworkError("Network failed", new Error(), "session123");
    expect(ErrorRecovery.shouldRetry(retryableError, 1, 3)).toBe(true);

    const nonRetryableError = new ValidationError("Bad request", [], {}, "session123");
    expect(ErrorRecovery.shouldRetry(nonRetryableError, 1, 3)).toBe(false);
  });

  test("shouldRetry detects retryable error patterns in Error objects", () => {
    const networkError = new Error("Network timeout occurred");
    expect(ErrorRecovery.shouldRetry(networkError, 1, 3)).toBe(true);

    const validationError = new Error("Invalid input format");
    expect(ErrorRecovery.shouldRetry(validationError, 1, 3)).toBe(false);
  });

  test("getRetryDelay calculates exponential backoff", () => {
    expect(ErrorRecovery.getRetryDelay(1, 1000, 16000)).toBe(1000);
    expect(ErrorRecovery.getRetryDelay(2, 1000, 16000)).toBe(2000);
    expect(ErrorRecovery.getRetryDelay(3, 1000, 16000)).toBe(4000);
    expect(ErrorRecovery.getRetryDelay(4, 1000, 16000)).toBe(8000);
    expect(ErrorRecovery.getRetryDelay(5, 1000, 16000)).toBe(16000); // Capped at max
    expect(ErrorRecovery.getRetryDelay(10, 1000, 16000)).toBe(16000); // Still capped
  });

  test("getRetryDelay respects custom base and max delays", () => {
    expect(ErrorRecovery.getRetryDelay(1, 2000, 10000)).toBe(2000);
    expect(ErrorRecovery.getRetryDelay(2, 2000, 10000)).toBe(4000);
    expect(ErrorRecovery.getRetryDelay(3, 2000, 10000)).toBe(8000);
    expect(ErrorRecovery.getRetryDelay(4, 2000, 10000)).toBe(10000); // Capped at custom max
  });
});

describe("Error toJSON serialization", () => {
  test("WebSocketError serializes all fields", () => {
    const error = new SdkError(
      "SDK failed",
      new Error("Original error"),
      "session123",
      true
    );

    const json = error.toJSON();

    expect(json.errorType).toBe("sdk_error");
    expect(json.message).toBe("SDK failed");
    expect(json.sessionId).toBe("session123");
    expect(json.isRetryable).toBe(true);
    expect(json.timestamp).toBeDefined();
    expect(json.context).toBeDefined();
    expect(json.stack).toBeDefined();
  });
});
