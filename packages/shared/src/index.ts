import { z } from "zod";

export const GenerateRequestSchema = z.object({
  templateId: z.string().min(1),
  input: z.string().min(1),
  provider: z.enum(["openai", "anthropic"]).default("openai"),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
