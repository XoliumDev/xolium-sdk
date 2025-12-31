import { z } from "zod";

export const RetryPolicySchema = z
  .object({
    maxAttempts: z.number().int().min(1).max(10),
    baseDelayMs: z.number().int().min(1).max(60_000),
    maxDelayMs: z.number().int().min(1).max(300_000),
    retryableHttpStatusCodes: z.array(z.number().int().min(100).max(599)).min(1),
  })
  .strict()
  .refine((v) => v.maxDelayMs >= v.baseDelayMs, "maxDelayMs must be >= baseDelayMs");

export const ApiConfigSchema = z
  .object({
    baseUrl: z.string().url(),
    timeoutMs: z.number().int().min(1).max(120_000),
    headers: z.record(z.string()),
    routes: z.record(z.string().min(1)),
  })
  .strict();

export const NetworkApiConfigSchema = ApiConfigSchema.extend({
  routes: z
    .object({
      health: z.string().min(1),
      metrics: z.string().min(1),
      liquidityGraph: z.string().min(1),
    })
    .strict(),
}).strict();

export const ExecutionApiConfigSchema = ApiConfigSchema.extend({
  routes: z
    .object({
      credits: z.string().min(1),
      quote: z.string().min(1),
      execute: z.string().min(1),
      yield: z.string().min(1),
    })
    .strict(),
}).strict();

export const XoliumClientConfigSchema = z
  .object({
    rpcEndpoint: z.string().url(),
    commitment: z.enum(["processed", "confirmed", "finalized"]),
    signer: z.custom<object>(
      (v) => typeof v === "object" && v !== null,
      "signer must be an object",
    ),
    retry: RetryPolicySchema,
    apis: z
      .object({
        network: NetworkApiConfigSchema,
        execution: ExecutionApiConfigSchema,
      })
      .strict(),
  })
  .strict();

// External payload schemas
export const NetworkHealthSchema = z
  .object({
    status: z.literal("ok"),
    timestampMs: z.number().int().min(0),
  })
  .strict();

export const NetworkMetricsSchema = z
  .object({
    timestampMs: z.number().int().min(0),
    slot: z.number().int().min(0).optional(),
    latencyMs: z.number().int().min(0).optional(),
  })
  .strict();

export const LiquidityEdgeSchema = z
  .object({
    fromMint: z.string().min(32).max(44),
    toMint: z.string().min(32).max(44),
    venue: z.string().min(1),
    liquidityUsd: z.number().finite().nonnegative(),
    volatilityBps: z.number().int().min(0).max(100_000),
  })
  .strict();

export const LiquidityGraphSchema = z
  .object({
    asOfMs: z.number().int().min(0),
    edges: z.array(LiquidityEdgeSchema),
  })
  .strict();

export const PriorityRoutingPolicySchema = z
  .object({
    enabled: z.boolean(),
    maxComputeUnitPriceMicroLamports: z.number().int().min(0).max(10_000_000),
  })
  .strict();

export const MevPolicySchema = z
  .object({
    mevAware: z.boolean(),
    allowBackrun: z.boolean(),
  })
  .strict();

export const ExecutionCreditBalanceSchema = z
  .object({
    credits: z.number().int().min(0),
    asOfMs: z.number().int().min(0),
  })
  .strict();

export const ExecutionQuoteRequestSchema = z
  .object({
    fromMint: z.string().min(32).max(44),
    toMint: z.string().min(32).max(44),
    amountIn: z.string().regex(/^\d+$/),
    slippageBps: z.number().int().min(0).max(10_000),
    priority: PriorityRoutingPolicySchema,
    mev: MevPolicySchema,
  })
  .strict();

export const ExecutionQuoteResponseSchema = z
  .object({
    routeId: z.string().min(1),
    expectedAmountOut: z.string().regex(/^\d+$/),
    minAmountOut: z.string().regex(/^\d+$/),
    priceImpactBps: z.number().int().min(0).max(10_000),
    expiresAtMs: z.number().int().min(0),
  })
  .strict();

export const ExecutionExecuteRequestSchema = z
  .object({
    routeId: z.string().min(1),
    signerPubkey: z.string().min(32).max(44),
    priority: PriorityRoutingPolicySchema,
    mev: MevPolicySchema,
    explicitOptIn: z.literal(true),
  })
  .strict();

export const ExecutionExecuteResponseSchema = z
  .object({
    signature: z.string().min(1),
    submittedAtMs: z.number().int().min(0),
  })
  .strict();

export const YieldOperationRequestSchema = z
  .object({
    strategyId: z.string().min(1),
    notionalUsd: z.number().finite().positive(),
    riskCeilingBps: z.number().int().min(0).max(10_000),
    exposureCapUsd: z.number().finite().positive(),
    explicitOptIn: z.literal(true),
  })
  .strict();

export const YieldOperationResultSchema = z
  .object({
    operationId: z.string().min(1),
    acceptedAtMs: z.number().int().min(0),
  })
  .strict();
