import { Router, Response, NextFunction } from "express";
import { prisma } from "@promptlab/db/src/client";
import { CreateTemplateSchema } from "@promptlab/shared";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest, optionalAuth } from "../middleware/auth";

const router = Router();

// Apply optional auth to all template routes
router.use(optionalAuth);

/**
 * @swagger
 * /templates:
 *   post:
 *     tags: [Templates]
 *     summary: Create a new template
 *     description: Create a prompt template for generation. If authenticated, template is private to user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - systemPrompt
 *               - userPrompt
 *             properties:
 *               name:
 *                 type: string
 *                 example: Blog Post Writer
 *               systemPrompt:
 *                 type: string
 *                 example: You are a professional blog writer.
 *               userPrompt:
 *                 type: string
 *                 example: Write a blog post about {{input}}
 *               variablesSchema:
 *                 type: object
 *                 example: { "input": "string" }
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = CreateTemplateSchema.parse(req.body);

    const template = await prisma.template.create({
      data: {
        name: data.name,
        systemPrompt: data.systemPrompt,
        userPrompt: data.userPrompt,
        variablesSchema: data.variablesSchema,
        userId: req.user?.userId || null,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /templates:
 *   get:
 *     tags: [Templates]
 *     summary: List templates
 *     description: Returns all public templates, or user's private templates if authenticated
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Template'
 */
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // If authenticated, show user's templates. Otherwise show all public templates.
    const where = req.user?.userId 
      ? { userId: req.user.userId }
      : { userId: null };

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /templates/{id}:
 *   get:
 *     tags: [Templates]
 *     summary: Get template by ID
 *     description: Returns a specific template by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      throw new AppError("not_found", "Template not found", undefined, 404);
    }

    res.json(template);
  } catch (error) {
    next(error);
  }
});

export default router;
