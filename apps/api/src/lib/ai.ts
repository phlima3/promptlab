import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type AIProvider = "anthropic" | "openai";

export interface GenerateResult {
  output: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export async function generateWithAnthropic(
  prompt: string,
  input: string
): Promise<GenerateResult> {
  const client = getAnthropicClient();

  const fullPrompt = prompt.replace(/\{\{input\}\}/g, input);

  const response = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: fullPrompt,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  const output = textContent ? textContent.text : "";

  return {
    output,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

export async function generateWithOpenAI(
  prompt: string,
  input: string
): Promise<GenerateResult> {
  const client = getOpenAIClient();

  const fullPrompt = prompt.replace(/\{\{input\}\}/g, input);

  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: fullPrompt,
      },
    ],
  });

  const output = response.choices[0]?.message?.content || "";

  return {
    output,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

export async function generate(
  provider: AIProvider,
  prompt: string,
  input: string
): Promise<GenerateResult> {
  switch (provider) {
    case "anthropic":
      return generateWithAnthropic(prompt, input);
    case "openai":
      return generateWithOpenAI(prompt, input);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
