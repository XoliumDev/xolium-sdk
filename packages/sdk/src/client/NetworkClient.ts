import type { AxiosInstance } from "axios";

import { XoliumError } from "../errors/XoliumError.js";
import type { LiquidityGraph } from "../types/liquidity.js";
import type { NetworkHealth, NetworkMetrics } from "../types/metrics.js";
import type { RetryPolicy } from "../utils/retry.js";
import { requestWithRetry } from "../utils/retry.js";
import {
  LiquidityGraphSchema,
  NetworkHealthSchema,
  NetworkMetricsSchema,
  NetworkApiConfigSchema,
} from "../validation/schemas.js";

export type NetworkClientConfig = Readonly<{
  api: unknown;
  retry: RetryPolicy;
  axios: AxiosInstance;
}>;

export class NetworkClient {
  private readonly axios: AxiosInstance;
  private readonly retry: RetryPolicy;
  private readonly api: ReturnType<typeof NetworkApiConfigSchema.parse>;

  public constructor(config: NetworkClientConfig) {
    const parsed = NetworkApiConfigSchema.safeParse(config.api);
    if (!parsed.success) {
      throw XoliumError.invalidInput("Invalid network API configuration", parsed.error.issues);
    }
    this.api = parsed.data;
    this.retry = config.retry;
    this.axios = config.axios;
  }

  public async healthCheck(): Promise<NetworkHealth> {
    const res = await requestWithRetry<unknown>(
      this.axios,
      {
        method: "GET",
        url: this.api.routes.health,
      },
      this.retry,
      { service: "network", route: "health" },
    );
    const parsed = NetworkHealthSchema.safeParse(res.data);
    if (!parsed.success) {
      throw XoliumError.contractMismatch("Network health schema mismatch", {
        issues: parsed.error.issues,
      });
    }
    return parsed.data;
  }

  public async metrics(): Promise<NetworkMetrics> {
    const res = await requestWithRetry<unknown>(
      this.axios,
      {
        method: "GET",
        url: this.api.routes.metrics,
      },
      this.retry,
      { service: "network", route: "metrics" },
    );
    const parsed = NetworkMetricsSchema.safeParse(res.data);
    if (!parsed.success) {
      throw XoliumError.contractMismatch("Network metrics schema mismatch", {
        issues: parsed.error.issues,
      });
    }
    const { timestampMs, slot, latencyMs } = parsed.data;
    return {
      timestampMs,
      ...(slot !== undefined ? { slot } : {}),
      ...(latencyMs !== undefined ? { latencyMs } : {}),
    };
  }

  public async liquidityGraph(): Promise<LiquidityGraph> {
    const res = await requestWithRetry<unknown>(
      this.axios,
      {
        method: "GET",
        url: this.api.routes.liquidityGraph,
      },
      this.retry,
      { service: "network", route: "liquidityGraph" },
    );
    const parsed = LiquidityGraphSchema.safeParse(res.data);
    if (!parsed.success) {
      throw XoliumError.contractMismatch("Liquidity graph schema mismatch", {
        issues: parsed.error.issues,
      });
    }
    return parsed.data;
  }
}
