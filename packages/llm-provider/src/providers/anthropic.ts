import Anthropic from "@anthropic-ai/sdk";
import {
  ILLMProvider,
  LLMGenerateRequest,
  LLMGenerateResponse,
  LLMProviderError,
  LLMUsageMetrics,
} from "../index";

/**
 * Anthropic Claude Provider
 *
 * Pricing (as of Dec 2025):
 * Claude 3.5 Sonnet:
 * - Input: $3 per 1M tokens
 * - Output: $15 per 1M tokens
 *
 * Claude 3 Haiku:
 * - Input: $0.25 per 1M tokens
 * - Output: $1.25 per 1M tokens
 */

const MODEL_PRICING: Record<
  string,
  { input: number; output: number } // per 1M tokens
> = {
  "claude-3-5-sonnet-20240620": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
};

export class AnthropicProvider implements ILLMProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private defaultModel: string;
  private defaultMaxTokens: number;
  private defaultTimeout: number;

  constructor(config: {
    apiKey: string;
    defaultModel?: string;
    defaultMaxTokens?: number;
    defaultTimeout?: number;
  }) {
    if (!config.apiKey) {
      throw new Error("Anthropic API key is required");
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
    });

    this.defaultModel = config.defaultModel || "claude-3-haiku-20240307";
    this.defaultMaxTokens = config.defaultMaxTokens || 4096;
    this.defaultTimeout = config.defaultTimeout || 30000; // 30s
  }

  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    const model = request.model || this.defaultModel;
    const maxTokens = request.maxTokens || this.defaultMaxTokens;
    const timeout = request.timeout || this.defaultTimeout;

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await this.client.messages.create(
        {
          model,
          max_tokens: maxTokens,
          temperature: request.temperature ?? 1.0,
          system: request.systemPrompt,
          messages: [
            {
              role: "user",
              content: request.userPrompt,
            },
          ],
        },
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Extract text from response
      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new LLMProviderError(
          "No text content in response",
          this.name,
          false
        );
      }

      // Calculate usage metrics
      const usage = this.calculateUsage(
        model,
        response.usage.input_tokens,
        response.usage.output_tokens
      );

      return {
        text: textContent.text,
        usage,
        model: response.model,
        finishReason: response.stop_reason || "unknown",
      };
    } catch (error: any) {
      // Handle timeout
      if (error.name === "AbortError") {
        throw new LLMProviderError(
          `Request timeout after ${timeout}ms`,
          this.name,
          true // retryable
        );
      }

      // Handle Anthropic API errors
      if (error instanceof Anthropic.APIError) {
        const isRetryable =
          error.status === 429 || // rate limit
          error.status === 500 || // server error
          error.status === 503; // service unavailable

        throw new LLMProviderError(
          error.message,
          this.name,
          isRetryable,
          error.status
        );
      }

      // Handle network errors
      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        throw new LLMProviderError(
          `Network error: ${error.message}`,
          this.name,
          true // retryable
        );
      }

      // Unknown error
      throw new LLMProviderError(
        error.message || "Unknown error",
        this.name,
        false
      );
    }
  }

  private calculateUsage(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): LLMUsageMetrics {
    const pricing =
      MODEL_PRICING[model] || MODEL_PRICING["claude-3-5-sonnet-20240620"];

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUSD: totalCost,
    };
  }
}
