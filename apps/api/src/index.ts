import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { swaggerSpec } from "./swagger";
import authRouter from "./routes/auth";
import templatesRouter from "./routes/templates";
import jobsRouter from "./routes/jobs";

const app = express();

// CORS - Allow requests from localhost:3000 (Next.js dev server)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Rate limiting: 100 requests per minute per IP
app.use(
  rateLimitMiddleware({
    maxRequests: 100,
    windowSeconds: 60,
    keyPrefix: "api-ratelimit",
  })
);

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns the API health status
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Swagger documentation
app.use("/api-docs", swaggerUi.serve as any);
app.get(
  "/api-docs",
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "PromptLab API Docs",
  }) as any
);

// Routes
app.use("/auth", authRouter);
app.use("/templates", templatesRouter);
app.use("/generate", jobsRouter);
app.use("/jobs", jobsRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.API_PORT) || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});
