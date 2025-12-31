import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";

import { XoliumClient } from "../../src/client/XoliumClient.js";
import { XoliumError } from "../../src/errors/XoliumError.js";

describe("XoliumClient lifecycle", () => {
  it("can be disposed and then rejects usage", () => {
    const client = new XoliumClient({
      rpcEndpoint: "https://example.com",
      commitment: "finalized",
      signer: Keypair.generate(),
      retry: {
        maxAttempts: 1,
        baseDelayMs: 1,
        maxDelayMs: 1,
        retryableHttpStatusCodes: [500],
      },
      apis: {
        network: {
          baseUrl: "https://example.com",
          timeoutMs: 1000,
          headers: {},
          routes: {
            health: "/health",
            metrics: "/metrics",
            liquidityGraph: "/liquidity/graph",
          },
        },
        execution: {
          baseUrl: "https://example.com",
          timeoutMs: 1000,
          headers: {},
          routes: {
            credits: "/credits",
            quote: "/quote",
            execute: "/execute",
            yield: "/yield",
          },
        },
      },
    });
    client.dispose();
    expect(() => {
      client.assertNotDisposed();
    }).toThrow(XoliumError);
  });
});
