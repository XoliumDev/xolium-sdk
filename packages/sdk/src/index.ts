export { XoliumClient } from "./client/XoliumClient.js";

export { ErrorCode } from "./errors/ErrorCodes.js";
export { XoliumError } from "./errors/XoliumError.js";

export type {
  ExecutionCreditBalance,
  ExecutionExecuteRequest,
  ExecutionExecuteResponse,
  ExecutionQuoteRequest,
  ExecutionQuoteResponse,
  MevPolicy,
  PriorityRoutingPolicy,
} from "./types/execution.js";

export type {
  LiquidityEdge,
  LiquidityGraph,
  LiquidityRoute,
  LiquidityRoutingPolicy,
  VolatilityFilter,
} from "./types/liquidity.js";

export type { NetworkHealth, NetworkMetrics } from "./types/metrics.js";
export type { YieldOperationRequest, YieldOperationResult } from "./types/yield.js";

export {
  ApiConfigSchema,
  ExecutionApiConfigSchema,
  NetworkApiConfigSchema,
  RetryPolicySchema,
  XoliumClientConfigSchema,
} from "./validation/schemas.js";
