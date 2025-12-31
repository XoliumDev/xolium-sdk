import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { XoliumError } from "../errors/XoliumError.js";

export const PublicKeyStringSchema = z
  .string()
  .min(32)
  .max(44)
  .refine((s) => {
    try {
      // validates base58 and length
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const pk = new PublicKey(s);
      return true;
    } catch {
      return false;
    }
  }, "Invalid public key string");

export type XoliumProgramAddresses = Readonly<{
  utilityProgramId: string;
}>;

export const XoliumProgramAddressesSchema = z
  .object({
    utilityProgramId: PublicKeyStringSchema,
  })
  .strict();

export function parseProgramAddresses(input: unknown): XoliumProgramAddresses {
  const parsed = XoliumProgramAddressesSchema.safeParse(input);
  if (!parsed.success) {
    throw XoliumError.invalidInput("Invalid program addresses", parsed.error.issues);
  }
  return parsed.data;
}
