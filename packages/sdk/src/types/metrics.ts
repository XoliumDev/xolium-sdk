export type NetworkHealth = Readonly<{
  status: "ok";
  timestampMs: number;
}>;

export type NetworkMetrics = Readonly<{
  timestampMs: number;
  slot?: number;
  latencyMs?: number;
}>;
