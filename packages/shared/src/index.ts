import { z } from "zod";

// ===== Enums =====

export const JobStatus = z.enum(["queued", "running", "completed", "failed"]);
export type JobStatus = z.infer<typeof JobStatus>;

export const Provider = z.enum(["openai", "anthropic"]);
export type Provider = z.infer<typeof Provider>;

export const ErrorCode = z.enum([
  "validation_error",
  "not_found",
  "rate_limited",
  "internal_error",
  "provider_error",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

// ===== Template Schemas =====

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  systemPrompt: z.string().min(1),
  userPrompt: z.string().min(1),
  variablesSchema: z.record(z.string()).optional().default({}),
});
export type CreateTemplate = z.infer<typeof CreateTemplateSchema>;

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  systemPrompt: z.string(),
  userPrompt: z.string(),
  variablesSchema: z.record(z.string()),
  version: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Template = z.infer<typeof TemplateSchema>;

// ===== Generation Schemas =====

export const GenerateRequestSchema = z.object({
  templateId: z.string().min(1),
  provider: Provider.default("openai"),
  input: z.string().min(1).max(10000), // limit input size
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const GenerateResponseSchema = z.object({
  jobId: z.string(),
});
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

// ===== Job Schemas =====

export const JobSchema = z.object({
  id: z.string(),
  status: JobStatus,
  templateId: z.string(),
  provider: Provider,
  input: z.string(),
  inputHash: z.string(),
  output: z.string().nullable(),
  error: z.string().nullable(),
  attempts: z.number().int(),
  startedAt: z.date().nullable(),
  finishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Job = z.infer<typeof JobSchema>;

// ===== Error Response Schema =====

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.record(z.any()).optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
