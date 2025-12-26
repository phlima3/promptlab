// Re-export types from shared package
export type { Template, Job, GenerateRequest } from "@promptlab/shared";

// UI-specific types
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type JobStatus = "queued" | "running" | "completed" | "failed";

export type Provider = "anthropic" | "openai";
