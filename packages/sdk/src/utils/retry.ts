import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

import { ErrorCode } from "../errors/ErrorCodes.js";
import { XoliumError } from "../errors/XoliumError.js";
import { RetryPolicySchema } from "../validation/schemas.js";

export type RetryPolicy = Readonly<{
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableHttpStatusCodes: readonly number[];
}>;

export function parseRetryPolicy(input: unknown): RetryPolicy {
  const parsed = RetryPolicySchema.safeParse(input);
  if (!parsed.success) {
    throw XoliumError.invalidInput("Invalid retry policy", parsed.error.issues);
  }
  return parsed.data;
}

export function computeDeterministicDelayMs(
  attemptIndex: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  if (!Number.isInteger(attemptIndex) || attemptIndex < 0) {
    throw XoliumError.invalidInputDetails("attemptIndex must be a non-negative integer", {
      attemptIndex,
    });
  }
  const raw = baseDelayMs * 2 ** attemptIndex;
  return Math.min(maxDelayMs, raw);
}

export async function sleepMs(ms: number): Promise<void> {
  if (!Number.isFinite(ms) || ms < 0) {
    throw XoliumError.invalidInputDetails("sleepMs requires a non-negative finite ms", { ms });
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function requestWithRetry<T>(
  axiosInstance: AxiosInstance,
  cfg: AxiosRequestConfig,
  retryPolicy: RetryPolicy,
  context: Readonly<Record<string, unknown>>,
): Promise<AxiosResponse<T>> {
  const policy = parseRetryPolicy(retryPolicy);
  const normalizedCfg = normalizeAxiosConfig(cfg);

  let lastError: unknown = undefined;

  for (let attempt = 0; attempt < policy.maxAttempts; attempt += 1) {
    try {
      return await axiosInstance.request<T>(normalizedCfg);
    } catch (err) {
      lastError = err;
      const parsed = parseAxiosError(err);
      const retryable = isRetryableAxiosError(parsed, policy);
      const finalAttempt = attempt === policy.maxAttempts - 1;

      if (!retryable || finalAttempt) {
        throw XoliumError.networkUnavailable("Network request failed", {
          ...context,
          attempt,
          maxAttempts: policy.maxAttempts,
          axios: parsed,
        });
      }

      const delayMs = computeDeterministicDelayMs(attempt, policy.baseDelayMs, policy.maxDelayMs);
      await sleepMs(delayMs);
    }
  }

  throw XoliumError.fromUnknown(lastError, "Network request failed", {
    ...context,
    code: ErrorCode.NETWORK_UNAVAILABLE,
  });
}

function normalizeAxiosConfig(cfg: AxiosRequestConfig): AxiosRequestConfig {
  return {
    ...cfg,
    headers: cfg.headers ?? {},
    // prevent axios from applying its own implicit transforms in a way that changes determinism
    transitional: {
      silentJSONParsing: false,
      forcedJSONParsing: true,
      clarifyTimeoutError: true,
    },
    validateStatus: (status) => status >= 200 && status < 300,
  };
}

type ParsedAxiosError = Readonly<{
  name: string;
  message: string;
  code?: string;
  status?: number;
  url?: string;
  method?: string;
}>;

function parseAxiosError(err: unknown): ParsedAxiosError {
  if (!axios.isAxiosError(err)) {
    return {
      name: err instanceof Error ? err.name : "UnknownError",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
  const e = err as AxiosError;
  const base: { name: string; message: string } = { name: e.name, message: e.message };
  return {
    ...base,
    ...(e.code !== undefined ? { code: e.code } : {}),
    ...(e.response?.status !== undefined ? { status: e.response.status } : {}),
    ...(e.config?.url !== undefined ? { url: e.config.url } : {}),
    ...(e.config?.method !== undefined ? { method: e.config.method } : {}),
  };
}

function isRetryableAxiosError(err: ParsedAxiosError, policy: RetryPolicy): boolean {
  if (err.status !== undefined) {
    return policy.retryableHttpStatusCodes.includes(err.status);
  }
  // No status: treat as transport failure (DNS, timeout, connection reset)
  return true;
}
