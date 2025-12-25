import { prisma } from "@promptlab/db/src/client";

async function processJobs() {
  console.log("Worker started, processing jobs...");

  // Poll for queued jobs every 5 seconds
  setInterval(async () => {
    const jobs = await prisma.job.findMany({
      where: { status: "queued" },
      take: 10,
    });

    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id}`);

        // Update job status to processing
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "processing" },
        });

        // Simulate processing work
        const result = `Processed: ${job.input}`;

        // Update job with result
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "completed",
            result,
          },
        });

        console.log(`Job ${job.id} completed`);
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);

        // Update job status to failed
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "failed" },
        });
      }
    }
  }, 5000);
}

processJobs().catch(console.error);
