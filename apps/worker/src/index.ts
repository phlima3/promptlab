import { prisma } from "@promptlab/db/src/client";
import {
  AnthropicProvider,
  ILLMProvider,
  LLMProviderError,
} from "@promptlab/llm-provider";

const POLL_INTERVAL_MS = parseInt(
  process.env.WORKER_POLL_INTERVAL_MS || "5000",
  10
);
const MAX_ATTEMPTS = parseInt(process.env.WORKER_MAX_ATTEMPTS || "3", 10);

// Backoff delays: 1s, 3s, 10s
const BACKOFF_DELAYS = [1000, 3000, 10000];

// Initialize LLM providers
const providers: Record<string, ILLMProvider> = {};

// Initialize Anthropic if API key is present
if (process.env.ANTHROPIC_API_KEY) {
  providers.anthropic = new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  console.log("✅ Anthropic provider initialized");
} else {
  console.warn("⚠️  ANTHROPIC_API_KEY not found - Anthropic provider disabled");
}

async function processJobs() {
  console.log(
    `Worker started. Polling every ${POLL_INTERVAL_MS}ms. Max attempts: ${MAX_ATTEMPTS}`
  );

  setInterval(async () => {
    try {
      // Fetch queued jobs
      const jobs = await prisma.job.findMany({
        where: { status: "queued" },
        take: 10,
        orderBy: { createdAt: "asc" },
        include: {
          template: true,
        },
      });

      if (jobs.length === 0) {
        return;
      }

      console.log(`Found ${jobs.length} jobs to process`);

      for (const job of jobs) {
        await processJob(job);
      }
    } catch (error) {
      console.error("Error in polling loop:", error);
    }
  }, POLL_INTERVAL_MS);
}

async function processJob(job: any) {
  try {
    console.log(
      `Processing job ${job.id} (attempt ${
        job.attempts + 1
      }/${MAX_ATTEMPTS}) - Provider: ${job.provider}`
    );

    // Update status to running
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "running",
        attempts: job.attempts + 1,
        startedAt: job.startedAt || new Date(),
      },
    });

    // Generate output using real LLM provider
    const result = await generateOutput(job);

    // Mark as completed
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "completed",
        output: result.output,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        totalTokens: result.totalTokens,
        estimatedCostUSD: result.estimatedCostUSD,
        finishedAt: new Date(),
      },
    });

    console.log(
      `Job ${job.id} completed successfully. Tokens: ${
        result.totalTokens
      }, Cost: $${result.estimatedCostUSD?.toFixed(6)}`
    );
  } catch (error) {
    await handleJobError(job, error);
  }
}

interface GenerateResult {
  output: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

async function generateOutput(job: any): Promise<GenerateResult> {
  const provider = providers[job.provider];

  if (!provider) {
    throw new Error(
      `Provider "${job.provider}" not available. Check API keys in environment.`
    );
  }

  const { template, input } = job;

  // Compose prompts
  const userPrompt = template.userPrompt.replace(/\{\{input\}\}/g, input);

  // Call LLM provider
  const response = await provider.generate({
    systemPrompt: template.systemPrompt,
    userPrompt,
    timeout: 30000, // 30s timeout
  });

  return {
    output: response.text,
    model: response.model,
    inputTokens: response.usage.inputTokens,
    outputTokens: response.usage.outputTokens,
    totalTokens: response.usage.totalTokens,
    estimatedCostUSD: response.usage.estimatedCostUSD,
  };
}

function composePrompt(job: any): string {
  const { template, input } = job;
  // Simple placeholder replacement
  const userPrompt = template.userPrompt.replace(/\{\{input\}\}/g, input);
  return `System: ${template.systemPrompt}\n\nUser: ${userPrompt}`;
}

async function handleJobError(job: any, error: any) {
  console.error(`Error processing job ${job.id}:`, error);

  const attempts = job.attempts + 1;

  // Determine if error is retryable
  const isRetryable =
    error instanceof LLMProviderError ? error.isRetryable : true; // By default, retry unknown errors

  const shouldRetry = attempts < MAX_ATTEMPTS && isRetryable;

  if (shouldRetry) {
    // Calculate backoff delay
    const delayIndex = Math.min(attempts - 1, BACKOFF_DELAYS.length - 1);
    const delay = BACKOFF_DELAYS[delayIndex];

    console.log(
      `Job ${job.id} will retry after ${delay}ms (attempt ${attempts}/${MAX_ATTEMPTS})`
    );

    // Update job back to queued for retry
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "queued",
        attempts,
        error: error.message,
      },
    });

    // Schedule retry with backoff
    setTimeout(async () => {
      console.log(`Retrying job ${job.id} now`);
    }, delay);
  } else {
    // Max attempts reached, mark as failed
    console.log(
      `Job ${job.id} failed after ${attempts} attempts. Marking as failed.`
    );

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "failed",
        attempts,
        error: error.message,
        finishedAt: new Date(),
      },
    });
  }
}

// Start worker
processJobs().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Worker shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Worker shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
