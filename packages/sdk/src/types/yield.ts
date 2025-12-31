export type YieldOperationRequest = Readonly<{
  strategyId: string;
  notionalUsd: number;
  riskCeilingBps: number;
  exposureCapUsd: number;
  explicitOptIn: true;
}>;

export type YieldOperationResult = Readonly<{
  operationId: string;
  acceptedAtMs: number;
}>;
