/**
 * LLM Provider Abstraction
 *
 * This module provides a unified interface for different LLM providers.
 * Key features:
 * - Provider abstraction (OpenAI, Anthropic)
 * - Timeout handling
 * - Token counting and cost estimation
 * - Error normalization
 */

export interface LLMGenerateRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number; // milliseconds
}

export interface LLMUsageMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface LLMGenerateResponse {
  text: string;
  usage: LLMUsageMetrics;
  model: string;
  finishReason: string;
}

export class LLMProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public isRetryable: boolean = false,
    public statusCode?: number
  ) {
    super(message);
    this.name = "LLMProviderError";
  }
}

export interface ILLMProvider {
  readonly name: string;
  generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse>;
}

export * from "./providers/anthropic";
