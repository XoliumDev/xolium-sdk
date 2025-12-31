export type VolatilityFilter = Readonly<{
  maxBps: number;
}>;

export type LiquidityEdge = Readonly<{
  fromMint: string;
  toMint: string;
  venue: string;
  liquidityUsd: number;
  volatilityBps: number;
}>;

export type LiquidityGraph = Readonly<{
  asOfMs: number;
  edges: readonly LiquidityEdge[];
}>;

export type LiquidityRoutingPolicy = Readonly<{
  minLiquidityUsd: number;
  volatilityFilter: VolatilityFilter;
  maxHops: number;
  allowVenues: readonly string[];
}>;

export type LiquidityRoute = Readonly<{
  path: readonly LiquidityEdge[];
  score: number;
}>;
