# @xolium/sdk

Official Xolium SDK for Node.js (TypeScript, strict).

## Design requirements

- No implicit defaults: callers must supply RPC endpoint, commitment, signer, and API endpoints/routes.
- No silent fallbacks: failures are explicit and typed.
- Deterministic behavior: retry delays are deterministic (no jitter).
- Validation: all inputs and external payloads are validated with zod.

## Public API

Entry point:

- `XoliumClient` (single entry point)

Clients:

- `client.network`: Network utility services
- `client.execution`: Execution services and deterministic route computation helpers

Errors:

- `XoliumError`
- `ErrorCode`

Validation schemas (exported for integrators and auditing):

- `XoliumClientConfigSchema`
- `RetryPolicySchema`
- `NetworkApiConfigSchema`
- `ExecutionApiConfigSchema`

## Configuration requirements (no implicit defaults)

You must provide:

- Solana configuration
  - `rpcEndpoint`
  - `commitment`
  - `signer`
- HTTP API configuration
  - `network.baseUrl`, `network.timeoutMs`, `network.headers`, explicit `network.routes`
  - `execution.baseUrl`, `execution.timeoutMs`, `execution.headers`, explicit `execution.routes`
- Retry policy
  - `maxAttempts`, `baseDelayMs`, `maxDelayMs`, `retryableHttpStatusCodes`

## Error codes

Only these error codes are permitted:

- `NETWORK_UNAVAILABLE`
- `INVALID_INPUT`
- `EXECUTION_DENIED`
- `RISK_LIMIT_EXCEEDED`
- `CONTRACT_MISMATCH`
- `UNAUTHORIZED_SIGNER`

## Deterministic retry

Retry delays are deterministic (no jitter) and bounded:

$$
	ext{delay}(i)=\min(\text{maxDelayMs}, \text{baseDelayMs} \cdot 2^i)
$$

## Installation

From the monorepo root:

```bash
npm install
```

## Usage

See the repository root `README.md` for a minimal example.

## Local development

From repo root:

```bash
npm run ci
```

From this package directory:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Security

See `SECURITY.md`.
