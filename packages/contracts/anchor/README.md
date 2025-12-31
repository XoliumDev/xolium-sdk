# Anchor Contracts Workspace

This folder contains an Anchor workspace intended for deterministic local integration testing.

The SDK’s default CI job focuses on TypeScript quality gates (format/lint/typecheck/tests/build).
Contract interaction tests that require a local validator and Anchor tooling are designed to run in a dedicated environment.
