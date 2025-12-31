import { z } from "zod";

import { XoliumError } from "../errors/XoliumError.js";

export type AnchorIdl = Readonly<Record<string, unknown>>;

export const AnchorIdlSchema = z
  .object({
    version: z.string().min(1),
    name: z.string().min(1),
    instructions: z.array(z.unknown()),
  })
  .passthrough();

export function parseAnchorIdl(input: unknown): AnchorIdl {
  const parsed = AnchorIdlSchema.safeParse(input);
  if (!parsed.success) {
    throw XoliumError.invalidInput("Invalid Anchor IDL", parsed.error.issues);
  }
  return parsed.data;
}
