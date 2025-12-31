# Xolium SDK (Enterprise)

Xolium is a Solana-native network utility layer: infrastructure primitives that improve execution quality, liquidity routing safety, and risk-managed yield operations for sophisticated operators.

This repository contains the official Xolium TypeScript SDK intended for institutional users (funds, DAOs, infrastructure providers, and integration partners) and designed to meet audit-friendly engineering standards.

## Status

This repository is intended to be audit-friendly on first release: strict TypeScript, deterministic retry, explicit configuration, and enumerated error codes.

## For Investors & Partners

### What Xolium is

Xolium is not “DeFi hype.” It is an execution and routing utility layer that sits alongside Solana-native settlement, providing:

- Deterministic, policy-driven route computation for execution and liquidity decisions
- Explicit risk constraints (ceilings, exposure caps, opt-in execution)
- Observable behavior through strict validation, typed errors, and deterministic retry

### How value accrues

Xolium’s value accrual is tied to usage of network utility services:

- Execution services and priority routing
- Routing safety tooling (volatility filters, liquidity safety rejection)
- Risk-managed yield automation primitives

The SDK is designed to be a secure access layer: explicit configuration, no silent fallback behavior, and an enumerated error system suitable for institutional operations.

### Institutional use cases

- Funds: deterministic execution policies, measurable routing constraints, risk ceilings
- DAOs: governance-friendly safety rails, explicit opt-in execution
- Infrastructure providers: standardized integration surface, typed errors for monitoring and alerting
- Partners: strict versioning policy and security posture documentation

## For Developers

### Requirements

- Node.js LTS
- A Solana RPC endpoint you explicitly control or trust

### Installation

This repository is a monorepo. The primary SDK package is in `packages/sdk`.

To install dependencies:

```bash
npm install
```

### Minimal usage example

The SDK requires explicit configuration. There are no implicit defaults.

```ts
import { z } from "zod";
import { Keypair } from "@solana/web3.js";
import { XoliumClient } from "@xolium/sdk";

const EnvSchema = z
  .object({
    XOLIUM_RPC_ENDPOINT: z.string().url(),
    XOLIUM_NETWORK_BASE_URL: z.string().url(),
    XOLIUM_EXECUTION_BASE_URL: z.string().url(),
  })
  .strict();

const envParsed = EnvSchema.safeParse({
  XOLIUM_RPC_ENDPOINT: process.env.XOLIUM_RPC_ENDPOINT,
  XOLIUM_NETWORK_BASE_URL: process.env.XOLIUM_NETWORK_BASE_URL,
  XOLIUM_EXECUTION_BASE_URL: process.env.XOLIUM_EXECUTION_BASE_URL,
});

if (!envParsed.success) {
  throw new Error("Missing required environment configuration for XoliumClient");
}

const signer = Keypair.generate();

const client = new XoliumClient({
  rpcEndpoint: envParsed.data.XOLIUM_RPC_ENDPOINT,
  commitment: "finalized",
  signer,
  retry: {
    maxAttempts: 3,
    baseDelayMs: 200,
    maxDelayMs: 2_000,
    retryableHttpStatusCodes: [408, 429, 500, 502, 503, 504],
  },
  apis: {
    network: {
      baseUrl: envParsed.data.XOLIUM_NETWORK_BASE_URL,
      timeoutMs: 10_000,
      headers: {},
      routes: {
        health: "/v1/health",
        metrics: "/v1/metrics",
        liquidityGraph: "/v1/liquidity/graph",
      },
    },
    execution: {
      baseUrl: envParsed.data.XOLIUM_EXECUTION_BASE_URL,
      timeoutMs: 15_000,
      headers: {},
      routes: {
        credits: "/v1/execution/credits",
        quote: "/v1/execution/quote",
        execute: "/v1/execution/execute",
        yield: "/v1/yield/operate",
      },
    },
  },
});

await client.network.healthCheck();
```

Recommended for local development:

- set `XOLIUM_RPC_ENDPOINT` explicitly (e.g., a private RPC or a provider endpoint)
- obtain `XOLIUM_NETWORK_BASE_URL` and `XOLIUM_EXECUTION_BASE_URL` from your Xolium partner onboarding

### Configuration contract

XoliumClient requires explicit configuration for:

- Solana: `rpcEndpoint`, `commitment`, `signer`
- HTTP APIs: `baseUrl`, `timeoutMs`, `headers`, and explicit `routes`
- Retry policy: max attempts and deterministic backoff bounds

There are no implicit defaults and no silent fallback logic.

### Error codes (enumerated)

All thrown errors are typed and use only these error codes:

- `NETWORK_UNAVAILABLE`
- `INVALID_INPUT`
- `EXECUTION_DENIED`
- `RISK_LIMIT_EXCEEDED`
- `CONTRACT_MISMATCH`
- `UNAUTHORIZED_SIGNER`

This design supports deterministic alerting and reliable incident triage.

### Determinism guarantees

- Retry uses deterministic exponential backoff (no jitter) with explicit bounds.
- Route computation in the SDK is deterministic for the same input graph and policy.

### Input validation & external payload validation

- All public entrypoints validate inputs.
- All HTTP response payloads are validated before use.
- Schema mismatch is raised as `CONTRACT_MISMATCH`.

### Testing

From repo root:

```bash
npm run ci
```

This runs:

- Prettier format check
- ESLint (fails on warnings)
- TypeScript strict typecheck
- Vitest unit and validation tests
- Build via tsup

### SDK philosophy

- Deterministic behavior (no jitter, no silent fallbacks)
- Explicit validation of all inputs and external data
- Enumerated, typed errors suitable for monitoring and incident response

### Versioning policy

- Semantic Versioning (SemVer)
- Breaking changes require a major version bump and documented migration notes

## Packages

- `packages/sdk`: the public TypeScript SDK
- `packages/contracts/anchor`: Anchor workspace used for deterministic local contract interaction tests
- `packages/docs`: architecture documentation

## Security

See `packages/sdk/SECURITY.md`.

## License

MIT (see `LICENSE`).