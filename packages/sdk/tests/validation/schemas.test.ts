import { describe, expect, it } from "vitest";

import {
  ExecutionExecuteRequestSchema,
  ExecutionQuoteRequestSchema,
  RetryPolicySchema,
  XoliumClientConfigSchema,
} from "../../src/validation/schemas.js";

describe("validation schemas", () => {
  it("rejects invalid retry policy", () => {
    const res = RetryPolicySchema.safeParse({
      maxAttempts: 0,
      baseDelayMs: 0,
      maxDelayMs: 0,
      retryableHttpStatusCodes: [],
    });
    expect(res.success).toBe(false);
  });

  it("accepts valid quote request", () => {
    const res = ExecutionQuoteRequestSchema.safeParse({
      fromMint: "11111111111111111111111111111111",
      toMint: "So11111111111111111111111111111111111111112",
      amountIn: "1000",
      slippageBps: 25,
      priority: { enabled: true, maxComputeUnitPriceMicroLamports: 1000 },
      mev: { mevAware: true, allowBackrun: false },
    });
    expect(res.success).toBe(true);
  });

  it("requires explicitOptIn=true for execute request", () => {
    const res = ExecutionExecuteRequestSchema.safeParse({
      routeId: "r1",
      signerPubkey: "11111111111111111111111111111111",
      priority: { enabled: false, maxComputeUnitPriceMicroLamports: 0 },
      mev: { mevAware: false, allowBackrun: false },
      explicitOptIn: true,
    });
    expect(res.success).toBe(true);
  });

  it("rejects invalid client config", () => {
    const res = XoliumClientConfigSchema.safeParse({
      rpcEndpoint: "not-a-url",
      commitment: "finalized",
      signer: {},
      retry: {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        retryableHttpStatusCodes: [500],
      },
      apis: {
        network: {
          baseUrl: "https://example.com",
          timeoutMs: 1000,
          headers: {},
          routes: { health: "/health", metrics: "/metrics", liquidityGraph: "/liquidity" },
        },
        execution: {
          baseUrl: "https://example.com",
          timeoutMs: 1000,
          headers: {},
          routes: { credits: "/credits", quote: "/quote", execute: "/execute" },
        },
      },
    });
    expect(res.success).toBe(false);
  });
});
