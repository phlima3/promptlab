import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@promptlab/db/src/client";
import { GenerateRequestSchema } from "@promptlab/shared";
import { getCached, setCached } from "@promptlab/redis";
import { AppError } from "../middleware/errorHandler";
import crypto from "crypto";

const router = Router();

// Generate endpoint
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = GenerateRequestSchema.parse(req.body);

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      throw new AppError("not_found", "Template not found", undefined, 404);
    }

    // Create input hash for idempotency
    const inputHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          templateId: data.templateId,
          provider: data.provider,
          input: data.input,
          version: template.version,
        })
      )
      .digest("hex");

    // Check Redis cache first (fast path)
    const cachedJobId = await getCached<string>(`job:hash:${inputHash}`, {
      keyPrefix: "gen",
    });

    if (cachedJobId) {
      console.log(`[API] Cache hit for inputHash: ${inputHash}`);
      return res.json({ jobId: cachedJobId, cached: true });
    }

    // Check if we already have a completed job with this input hash
    const existingJob = await prisma.job.findFirst({
      where: {
        inputHash,
        status: "completed",
      },
    });

    if (existingJob) {
      // Store in cache for next time (1 hour TTL)
      await setCached(`job:hash:${inputHash}`, existingJob.id, {
        keyPrefix: "gen",
        ttl: 3600, // 1 hour
      });
      return res.json({ jobId: existingJob.id });
    }

    // Check if there's already a queued or running job with this hash
    const pendingJob = await prisma.job.findFirst({
      where: {
        inputHash,
        status: { in: ["queued", "running"] },
      },
    });

    if (pendingJob) {
      return res.json({ jobId: pendingJob.id });
    }

    // Create new job
    const job = await prisma.job.create({
      data: {
        templateId: data.templateId,
        provider: data.provider,
        input: data.input,
        inputHash,
        status: "queued",
      },
    });

    res.json({ jobId: job.id });
  } catch (error) {
    next(error);
  }
});

// Get job status
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!job) {
      throw new AppError("not_found", "Job not found", undefined, 404);
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
});

// List all jobs (newest first)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 jobs
    });

    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

export default router;
