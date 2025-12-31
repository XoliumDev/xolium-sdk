import { Connection, type Commitment } from "@solana/web3.js";

import { XoliumError } from "../errors/XoliumError.js";

export type ConnectionConfig = Readonly<{
  rpcEndpoint: string;
  commitment: Commitment;
}>;

export function createSolanaConnection(config: ConnectionConfig): Connection {
  if (typeof config.rpcEndpoint !== "string" || config.rpcEndpoint.length === 0) {
    throw XoliumError.invalidInputDetails("rpcEndpoint must be a non-empty string", {
      rpcEndpoint: config.rpcEndpoint,
    });
  }
  if (typeof config.commitment !== "string" || config.commitment.length === 0) {
    throw XoliumError.invalidInputDetails("commitment must be a non-empty string", {
      commitment: config.commitment,
    });
  }
  return new Connection(config.rpcEndpoint, {
    commitment: config.commitment,
  });
}
