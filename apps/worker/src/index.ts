import { prisma } from "@promptlab/db/src/client";

const POLL_INTERVAL_MS = parseInt(
  process.env.WORKER_POLL_INTERVAL_MS || "5000",
  10
);
const MAX_ATTEMPTS = parseInt(process.env.WORKER_MAX_ATTEMPTS || "3", 10);

// Backoff delays: 1s, 3s, 10s
const BACKOFF_DELAYS = [1000, 3000, 10000];

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
      `Processing job ${job.id} (attempt ${job.attempts + 1}/${MAX_ATTEMPTS})`
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

    // Simulate LLM call (will be replaced with real provider in Phase 6)
    const output = await generateOutput(job);

    // Mark as completed
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "completed",
        output,
        finishedAt: new Date(),
      },
    });

    console.log(`Job ${job.id} completed successfully`);
  } catch (error) {
    await handleJobError(job, error);
  }
}

async function generateOutput(job: any): Promise<string> {
  // Mock implementation - Phase 6 will add real LLM providers
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate occasional failures
      if (Math.random() < 0.1) {
        reject(new Error("Simulated provider error"));
      } else {
        const prompt = composePrompt(job);
        resolve(`[MOCK OUTPUT]\nPrompt: ${prompt}\nInput: ${job.input}`);
      }
    }, 1000);
  });
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
  const shouldRetry = attempts < MAX_ATTEMPTS;

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
