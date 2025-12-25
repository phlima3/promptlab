import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@promptlab/db/src/client";
import { CreateTemplateSchema } from "@promptlab/shared";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// Create template
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateTemplateSchema.parse(req.body);

    const template = await prisma.template.create({
      data: {
        name: data.name,
        systemPrompt: data.systemPrompt,
        userPrompt: data.userPrompt,
        variablesSchema: data.variablesSchema,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// List templates
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Get template by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
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
