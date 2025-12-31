export type PriorityRoutingPolicy = Readonly<{
  enabled: boolean;
  maxComputeUnitPriceMicroLamports: number;
}>;

export type MevPolicy = Readonly<{
  mevAware: boolean;
  allowBackrun: boolean;
}>;

export type ExecutionCreditBalance = Readonly<{
  credits: number;
  asOfMs: number;
}>;

export type ExecutionQuoteRequest = Readonly<{
  fromMint: string;
  toMint: string;
  amountIn: string;
  slippageBps: number;
  priority: PriorityRoutingPolicy;
  mev: MevPolicy;
}>;

export type ExecutionQuoteResponse = Readonly<{
  routeId: string;
  expectedAmountOut: string;
  minAmountOut: string;
  priceImpactBps: number;
  expiresAtMs: number;
}>;

export type ExecutionExecuteRequest = Readonly<{
  routeId: string;
  signerPubkey: string;
  priority: PriorityRoutingPolicy;
  mev: MevPolicy;
  explicitOptIn: true;
}>;

export type ExecutionExecuteResponse = Readonly<{
  signature: string;
  submittedAtMs: number;
}>;
