# Contributing to Xolium

Xolium is an enterprise-grade SDK and follows infrastructure-level quality and security practices.

## Contribution principles

- Determinism: no non-deterministic behavior (e.g., jittered retry) unless explicitly documented and configurable.
- Explicitness: no implicit defaults, no silent fallbacks.
- Validation: all inputs and external data must be validated.
- Typed errors: use only the enumerated Xolium error codes.

## Code review rules

- All changes require review by at least one maintainer.
- Security-sensitive changes (key handling, transaction signing, network/RPC trust, retry) require two approvals.
- Reviewers must confirm the absence of console logs, commented-out code, and placeholder values.

## Commit standards

- Conventional Commits are required:
  - `feat:` new functionality
  - `fix:` bug fix
  - `chore:` tooling and maintenance
  - `docs:` documentation changes
  - `test:` tests only
- Commits must be small, reviewable, and include tests when behavior changes.

## Security PR handling

- Do not disclose vulnerabilities publicly.
- Use the responsible disclosure process described in `packages/sdk/SECURITY.md`.
- Security fixes should include:
  - threat description
  - risk assessment
  - mitigation
  - regression tests

## Release approval flow

- Releases are cut only from `main`.
- CI must be fully green (format, lint, typecheck, tests, build).
- Any change impacting public APIs requires:
  - updated documentation
  - explicit version bump
  - migration notes (when applicable)
