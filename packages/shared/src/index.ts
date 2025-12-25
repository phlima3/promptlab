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
  "unauthorized",
  "forbidden",
  "conflict",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

// ===== Auth Schemas =====

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(255).optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
  }),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

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
  inputTokens: z.number().int().nullable().optional(),
  outputTokens: z.number().int().nullable().optional(),
  totalTokens: z.number().int().nullable().optional(),
  estimatedCostUSD: z.number().nullable().optional(),
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
