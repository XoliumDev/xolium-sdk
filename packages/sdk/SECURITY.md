# Security

This document describes the security posture and usage requirements for the Xolium SDK.

## Key management best practices

- Do not store private keys in source control.
- Prefer hardware-backed keys (HSM, secure enclaves) or a vetted key management system.
- Use a dedicated signer with least-privilege operational scope.
- Rotate keys according to your organization’s policy.

The SDK never loads keys from disk or environment variables. The caller must provide an explicit signer.

## RPC trust assumptions

- Your configured RPC endpoint is a trust boundary.
- RPC operators can:
  - observe your requests and metadata
  - degrade availability
  - provide stale or inconsistent responses

Recommendations:

- Use an RPC endpoint you control, or a provider with contractual assurances.
- Pin commitment explicitly and monitor slot/lag metrics.

## Permission model

- Signing is always explicit and performed by a caller-provided signer.
- The SDK does not escalate privileges or attempt to infer identities.
- Requests to Xolium HTTP services are authenticated only if you supply explicit headers/tokens.

## Threat surface overview

- Network:
  - RPC outages, throttling, or malicious responses
  - HTTP service outages or schema changes
- Transaction layer:
  - incorrect fee/priority parameters
  - signer misuse or key compromise
- Configuration:
  - incorrect routes/endpoints leading to unintended behavior

Mitigations:

- Strict runtime validation of all inputs and external payloads.
- Deterministic retry with bounded attempts.
- Enumerated error codes to support monitoring and incident response.

## Responsible disclosure

If you believe you have found a security vulnerability:

- Do not open a public issue.
- Contact the maintainers via a private channel agreed by Xolium partners.
- Provide:
  - impact assessment
  - reproduction steps
  - affected versions
  - suggested mitigation (if known)

We aim to acknowledge reports within 72 hours.

## Enterprise security review checklist

- Input validation
  - [ ] All public methods validate inputs with zod
  - [ ] All external payloads validated before use
- Dependency risk
  - [ ] Dependencies are pinned and audited
  - [ ] No experimental/unstable APIs are used
- Key exposure
  - [ ] No key material is logged
  - [ ] Signer is caller-controlled
- RPC trust
  - [ ] Commitment is explicit
  - [ ] RPC endpoint is explicit
- Deterministic execution
  - [ ] Retry behavior deterministic and bounded
  - [ ] Route computation deterministic
- Upgrade safety
  - [ ] Breaking API changes require major version bump
  - [ ] Config schema changes are documented
