# Xolium SDK Architecture

## Goals

- Provide a single, audit-friendly entry point (`XoliumClient`).
- Enforce explicit configuration (RPC endpoint, commitment, signer, API endpoints, retry policy).
- Validate all inputs and external data.
- Use enumerated error codes only.
- Provide deterministic behavior (retry delays are deterministic and bounded).

## Non-goals

- The SDK does not infer endpoints, routes, or program addresses.
- The SDK does not silently downgrade features, commitment levels, or safety policies.

## Package structure

- `client/`
  - `XoliumClient`: single entry point; owns configuration, retry, and error normalization.
  - `NetworkClient`: network utility services (health, metrics, liquidity graph).
  - `ExecutionClient`: execution services (credits, quoting, execution) and deterministic local route planning.
- `validation/`: zod schemas for inputs and external payloads.
- `errors/`: enumerated error codes and the `XoliumError` type.
- `contracts/`: utilities for Anchor integration (addresses schema + IDL schema).
- `utils/`: deterministic retry and connection utilities.

## Error model

All thrown errors are instances of `XoliumError` with an enumerated error code and stable, serializable metadata.

## Determinism & retries

Retries use a deterministic exponential backoff without jitter:

$$
\text{delay}(i)=\min(\text{maxDelayMs}, \text{baseDelayMs} \cdot 2^i)
$$

This is deterministic and bounded.

## External trust boundaries

- RPC endpoint: treated as an explicit trust boundary.
- HTTP APIs: treated as untrusted; all responses are validated before use.
- Signing: the caller provides an explicit signer; the SDK never loads keys from disk or environment variables.
