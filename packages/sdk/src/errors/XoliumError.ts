import type { ZodIssue } from "zod";

import { ErrorCode } from "./ErrorCodes.js";

export type XoliumErrorDetails = Readonly<Record<string, unknown>>;

export class XoliumError extends Error {
  public readonly code: ErrorCode;
  public readonly details: XoliumErrorDetails;

  public constructor(code: ErrorCode, message: string, details: XoliumErrorDetails = {}) {
    super(message);
    this.name = "XoliumError";
    this.code = code;
    this.details = details;
  }

  public static invalidInput(message: string, issues?: readonly ZodIssue[]): XoliumError {
    const details: XoliumErrorDetails = issues ? { issues } : {};
    return new XoliumError(ErrorCode.INVALID_INPUT, message, details);
  }

  public static invalidInputDetails(message: string, details: XoliumErrorDetails): XoliumError {
    return new XoliumError(ErrorCode.INVALID_INPUT, message, details);
  }

  public static networkUnavailable(message: string, details: XoliumErrorDetails = {}): XoliumError {
    return new XoliumError(ErrorCode.NETWORK_UNAVAILABLE, message, details);
  }

  public static executionDenied(message: string, details: XoliumErrorDetails = {}): XoliumError {
    return new XoliumError(ErrorCode.EXECUTION_DENIED, message, details);
  }

  public static riskLimitExceeded(message: string, details: XoliumErrorDetails = {}): XoliumError {
    return new XoliumError(ErrorCode.RISK_LIMIT_EXCEEDED, message, details);
  }

  public static contractMismatch(message: string, details: XoliumErrorDetails = {}): XoliumError {
    return new XoliumError(ErrorCode.CONTRACT_MISMATCH, message, details);
  }

  public static unauthorizedSigner(message: string, details: XoliumErrorDetails = {}): XoliumError {
    return new XoliumError(ErrorCode.UNAUTHORIZED_SIGNER, message, details);
  }

  public static fromUnknown(
    err: unknown,
    fallbackMessage: string,
    details: XoliumErrorDetails = {},
  ): XoliumError {
    if (err instanceof XoliumError) return err;
    const message = err instanceof Error ? err.message : fallbackMessage;
    return new XoliumError(ErrorCode.CONTRACT_MISMATCH, message, {
      ...details,
      original: serializeUnknown(err),
    });
  }
}

function serializeUnknown(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return { type: "object", note: "non-serializable" };
    }
  }
  return value;
}
