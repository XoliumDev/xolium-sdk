import type { Commitment, Connection, Keypair, Signer } from "@solana/web3.js";
import axios from "axios";
import type { AxiosInstance } from "axios";

import { XoliumError } from "../errors/XoliumError.js";
import { createSolanaConnection } from "../utils/connection.js";
import type { RetryPolicy } from "../utils/retry.js";
import { parseRetryPolicy } from "../utils/retry.js";
import { XoliumClientConfigSchema } from "../validation/schemas.js";

import { ExecutionClient } from "./ExecutionClient.js";
import { NetworkClient } from "./NetworkClient.js";

export type XoliumSigner = Signer | Keypair;

export type XoliumClientConfig = Readonly<{
  rpcEndpoint: string;
  commitment: Commitment;
  signer: XoliumSigner;
  retry: RetryPolicy;
  apis: Readonly<{
    network: unknown;
    execution: unknown;
  }>;
}>;

export class XoliumClient {
  public readonly connection: Connection;
  public readonly signer: XoliumSigner;
  public readonly network: NetworkClient;
  public readonly execution: ExecutionClient;

  private disposed = false;

  public constructor(configInput: XoliumClientConfig) {
    const parsed = XoliumClientConfigSchema.safeParse(configInput);
    if (!parsed.success) {
      throw XoliumError.invalidInput("Invalid XoliumClient configuration", parsed.error.issues);
    }

    const retry = parseRetryPolicy(configInput.retry);
    this.signer = configInput.signer;
    this.connection = createSolanaConnection({
      rpcEndpoint: configInput.rpcEndpoint,
      commitment: configInput.commitment,
    });

    const networkAxios = createAxios(parsed.data.apis.network);
    const executionAxios = createAxios(parsed.data.apis.execution);

    this.network = new NetworkClient({
      api: configInput.apis.network,
      retry,
      axios: networkAxios,
    });

    this.execution = new ExecutionClient({
      api: configInput.apis.execution,
      retry,
      axios: executionAxios,
    });
  }

  public dispose(): void {
    this.disposed = true;
  }

  public assertNotDisposed(): void {
    if (this.disposed) {
      throw XoliumError.executionDenied("Client is disposed", {});
    }
  }
}

function createAxios(apiInput: unknown): AxiosInstance {
  const parsed = ((): { baseUrl: string; timeoutMs: number; headers: Record<string, string> } => {
    if (typeof apiInput !== "object" || apiInput === null) {
      throw XoliumError.invalidInputDetails("API configuration must be an object", {
        api: apiInput,
      });
    }
    const v = apiInput as { baseUrl?: unknown; timeoutMs?: unknown; headers?: unknown };
    const baseUrl = v.baseUrl;
    const timeoutMs = v.timeoutMs;
    const headers = v.headers;
    if (typeof baseUrl !== "string")
      throw XoliumError.invalidInputDetails("api.baseUrl must be a string", { baseUrl });
    if (typeof timeoutMs !== "number" || !Number.isInteger(timeoutMs)) {
      throw XoliumError.invalidInputDetails("api.timeoutMs must be an integer", { timeoutMs });
    }
    if (typeof headers !== "object" || headers === null) {
      throw XoliumError.invalidInputDetails("api.headers must be an object", { headers });
    }
    return { baseUrl, timeoutMs, headers: headers as Record<string, string> };
  })();

  return axios.create({
    baseURL: parsed.baseUrl,
    timeout: parsed.timeoutMs,
    headers: parsed.headers,
  });
}
