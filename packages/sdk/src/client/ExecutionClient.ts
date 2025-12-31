import type { AxiosInstance } from "axios";

import { XoliumError } from "../errors/XoliumError.js";
import type {
  ExecutionCreditBalance,
  ExecutionExecuteRequest,
  ExecutionExecuteResponse,
  ExecutionQuoteRequest,
  ExecutionQuoteResponse,
} from "../types/execution.js";
import type { LiquidityGraph, LiquidityRoute, LiquidityRoutingPolicy } from "../types/liquidity.js";
import type { YieldOperationRequest, YieldOperationResult } from "../types/yield.js";
import type { RetryPolicy } from "../utils/retry.js";
import { requestWithRetry } from "../utils/retry.js";
import {
  ExecutionApiConfigSchema,
  ExecutionCreditBalanceSchema,
  ExecutionExecuteRequestSchema,
  ExecutionExecuteResponseSchema,
  ExecutionQuoteRequestSchema,
  ExecutionQuoteResponseSchema,
  LiquidityGraphSchema,
  YieldOperationRequestSchema,
  YieldOperationResultSchema,
} from "../validation/schemas.js";

export type ExecutionClientConfig = Readonly<{
  api: unknown;
  retry: RetryPolicy;
  axios: AxiosInstance;
}>;

export class ExecutionClient {
  private readonly axios: AxiosInstance;
  private readonly retry: RetryPolicy;
  private readonly api: ReturnType<typeof ExecutionApiConfigSchema.parse>;

  public constructor(config: ExecutionClientConfig) {
    const parsed = ExecutionApiConfigSchema.safeParse(config.api);
    if (!parsed.success) {
      throw XoliumError.invalidInput("Invalid execution API configuration", parsed.error.issues);
    }
    this.api = parsed.data;
    this.retry = config.retry;
    this.axios = config.axios;
  }

  public async credits(): Promise<ExecutionCreditBalance> {
    const res = await requestWithRetry<unknown>(
      this.axios,
      { method: "GET", url: this.api.routes.credits },
      this.retry,
      { service: "execution", route: "credits" },
    );
    const parsed = ExecutionCreditBalanceSchema.safeParse(res.data);
    if (!parsed.success) {
      throw XoliumError.contractMismatch("Execution credits schema mismatch", {
        issues: parsed.error.issues,
      });
    }
    return parsed.data;
  }

  public computeLiquidityRoute(
    graphInput: unknown,
    policy: LiquidityRoutingPolicy,
    fromMint: string,
    toMint: string,
  ): LiquidityRoute {
    const graphParsed = LiquidityGraphSchema.safeParse(graphInput);
    if (!graphParsed.success) {
      throw XoliumError.invalidInput("Invalid liquidity graph", graphParsed.error.issues);
    }
    validateRoutingPolicy(policy);
    if (fromMint === toMint) {
      throw XoliumError.invalidInputDetails("fromMint and toMint must be different", {
        fromMint,
        toMint,
      });
    }

    const graph: LiquidityGraph = graphParsed.data;

    const candidateEdges = graph.edges
      .filter((e) => policy.allowVenues.includes(e.venue))
      .filter((e) => e.liquidityUsd >= policy.minLiquidityUsd)
      .filter((e) => e.volatilityBps <= policy.volatilityFilter.maxBps);

    // Deterministic ordering
    const edges = [...candidateEdges].sort((a, b) => {
      const ak = `${a.fromMint}|${a.toMint}|${a.venue}`;
      const bk = `${b.fromMint}|${b.toMint}|${b.venue}`;
      return ak.localeCompare(bk);
    });

    const route = findBestRouteDeterministic(edges, fromMint, toMint, policy.maxHops);
    if (route === null) {
      throw XoliumError.executionDenied("Liquidity safety rejection: no valid route", {
        fromMint,
        toMint,
        maxHops: policy.maxHops,
      });
    }
    return route;
  }

  public async quote(requestInput: unknown): Promise<ExecutionQuoteResponse> {
    const reqParsed = ExecutionQuoteRequestSchema.safeParse(requestInput);
    if (!reqParsed.success) {
      throw XoliumError.invalidInput("Invalid quote request", reqParsed.error.issues);
    }
    const request: ExecutionQuoteRequest = reqParsed.data;

    const res = await requestWithRetry<unknown>(
      this.axios,
      {
        method: "POST",
        url: this.api.routes.quote,
        data: request,
      },
      this.retry,
      { service: "execution", route: "quote" },
    );
    const parsed = ExecutionQuoteResponseSchema.safeParse(res.data);
    if (!parsed.success) {
      throw XoliumError.contractMismatch("Execution quote schema mismatch", {
        issues: parsed.error.issues,
      });
    }
    return parsed.data;
  }

  public async execute(requestInput: unknown): Promise<ExecutionExecuteResponse> {
    const reqParsed = ExecutionExecuteRequestSchema.safeParse(requestInput);
    if (!reqParsed.success) {
      throw XoliumError.invalidInput("Invalid execute request", reqParsed.error.issues);
    }

    const request: ExecutionExecuteRequest = reqParsed.data;

    const res = await requestWithRetry<unknown>(
      this.axios,
      {
        method: "POST",
        url: this.api.routes.execute,
        data: request,
      },
      this.retry,
      { service: "execution", route: "execute" },
    );
    const parsed = ExecutionExecuteResponseSchema.safeParse(res.data);
    if (!parsed.success) {
      throw XoliumError.contractMismatch("Execution execute schema mismatch", {
        issues: parsed.error.issues,
      });
    }
    return parsed.data;
  }

  public async requestYieldOperation(requestInput: unknown): Promise<YieldOperationResult> {
    const reqParsed = YieldOperationRequestSchema.safeParse(requestInput);
    if (!reqParsed.success) {
      throw XoliumError.invalidInput("Invalid yield operation request", reqParsed.error.issues);
    }
    const request: YieldOperationRequest = reqParsed.data;
    if (request.notionalUsd > request.exposureCapUsd) {
      throw XoliumError.riskLimitExceeded("notionalUsd exceeds exposureCapUsd", {
        notionalUsd: request.notionalUsd,
        exposureCapUsd: request.exposureCapUsd,
      });
    }

    const route = this.api.routes.yield;

    const res = await requestWithRetry<unknown>(
      this.axios,
      {
        method: "POST",
        url: route,
        data: request,
      },
      this.retry,
      { service: "execution", route: "yield" },
    );
    const parsed = YieldOperationResultSchema.safeParse(res.data);
    if (!parsed.success) {
      throw XoliumError.contractMismatch("Yield operation schema mismatch", {
        issues: parsed.error.issues,
      });
    }
    return parsed.data;
  }
}

function validateRoutingPolicy(policy: LiquidityRoutingPolicy): void {
  if (!Number.isFinite(policy.minLiquidityUsd) || policy.minLiquidityUsd < 0) {
    throw XoliumError.invalidInputDetails("minLiquidityUsd must be a non-negative number", {
      minLiquidityUsd: policy.minLiquidityUsd,
    });
  }
  if (!Number.isInteger(policy.volatilityFilter.maxBps) || policy.volatilityFilter.maxBps < 0) {
    throw XoliumError.invalidInputDetails(
      "volatilityFilter.maxBps must be a non-negative integer",
      {
        maxBps: policy.volatilityFilter.maxBps,
      },
    );
  }
  if (!Number.isInteger(policy.maxHops) || policy.maxHops < 1 || policy.maxHops > 5) {
    throw XoliumError.invalidInputDetails("maxHops must be an integer in [1,5]", {
      maxHops: policy.maxHops,
    });
  }
  const venues = [...policy.allowVenues];
  if (venues.length === 0) {
    throw XoliumError.invalidInputDetails("allowVenues must be non-empty", { allowVenues: venues });
  }
  for (const v of venues) {
    if (typeof v !== "string" || v.length === 0) {
      throw XoliumError.invalidInputDetails("allowVenues contains invalid entry", { venue: v });
    }
  }
}

function findBestRouteDeterministic(
  edges: readonly {
    fromMint: string;
    toMint: string;
    venue: string;
    liquidityUsd: number;
    volatilityBps: number;
  }[],
  fromMint: string,
  toMint: string,
  maxHops: number,
): LiquidityRoute | null {
  // Deterministic BFS over sorted edges; best route is lexicographically smallest among best-scoring routes.
  type Node = Readonly<{
    mint: string;
    path: readonly (typeof edges)[number][];
  }>;

  const queue: Node[] = [{ mint: fromMint, path: [] }];
  const seen = new Set<string>();

  const candidates: LiquidityRoute[] = [];

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    const hops = cur.path.length;
    if (hops > maxHops) continue;

    const stateKey = `${cur.mint}|${cur.path.map((e) => `${e.fromMint}>${e.toMint}@${e.venue}`).join(",")}`;
    if (seen.has(stateKey)) continue;
    seen.add(stateKey);

    if (cur.mint === toMint && cur.path.length > 0) {
      const score = scoreRoute(cur.path);
      candidates.push({ path: cur.path, score });
      continue;
    }

    if (hops === maxHops) continue;

    for (const e of edges) {
      if (e.fromMint !== cur.mint) continue;
      // prevent cycles by mint repetition
      const mintsInPath = new Set<string>([fromMint, ...cur.path.map((x) => x.toMint)]);
      if (mintsInPath.has(e.toMint)) continue;
      queue.push({ mint: e.toMint, path: [...cur.path, e] });
    }
  }

  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ak = a.path.map((e) => `${e.fromMint}|${e.toMint}|${e.venue}`).join("~");
    const bk = b.path.map((e) => `${e.fromMint}|${e.toMint}|${e.venue}`).join("~");
    return ak.localeCompare(bk);
  });

  return sorted[0] ?? null;
}

function scoreRoute(path: readonly { liquidityUsd: number; volatilityBps: number }[]): number {
  // Higher liquidity and lower volatility is better. Deterministic scalar score.
  const liquidity = path.reduce((sum, e) => sum + e.liquidityUsd, 0);
  const volatility = path.reduce((sum, e) => sum + e.volatilityBps, 0);
  return Math.floor(liquidity) - volatility;
}
