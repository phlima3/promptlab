import { Router, Response, NextFunction } from "express";
import { prisma } from "@promptlab/db/src/client";
import { GenerateRequestSchema } from "@promptlab/shared";
import { getCached, setCached } from "@promptlab/redis";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest, optionalAuth } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

// Apply optional auth to all job routes
router.use(optionalAuth);

/**
 * @swagger
 * /generate:
 *   post:
 *     tags: [Jobs]
 *     summary: Generate content using a template
 *     description: Creates a job to generate content. Returns immediately with jobId. Use /jobs/{id} to check status.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - input
 *             properties:
 *               templateId:
 *                 type: string
 *                 example: cmjlfawzg0000pq6xyq5r78ws
 *               provider:
 *                 type: string
 *                 enum: [openai, anthropic]
 *                 default: openai
 *                 example: anthropic
 *               input:
 *                 type: string
 *                 example: the benefits of TypeScript
 *     responses:
 *       200:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                   example: cmxxx123
 *                 cached:
 *                   type: boolean
 *                   description: True if result was returned from cache
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        userId: req.user?.userId || null,
      },
    });

    res.json({ jobId: job.id });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get job status and result
 *     description: Returns job information including status, output, and usage metrics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
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

/**
 * @swagger
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List all jobs
 *     description: Returns all public jobs, or user's private jobs if authenticated (limited to 100 most recent)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 */
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // If authenticated, show user's jobs. Otherwise show all public jobs.
    const where = req.user?.userId 
      ? { userId: req.user.userId }
      : { userId: null };

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 jobs
    });

    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

export default router;
