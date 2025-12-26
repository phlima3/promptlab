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

// CORS - Allow requests from localhost and production
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
];

// Add production origins from env
if (process.env.ALLOWED_ORIGINS) {
  allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(","));
}

app.use(
  cors({
    origin: allowedOrigins,
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

// Swagger documentation - use CDN for serverless compatibility
app.use(
  "/api-docs",
  ...(swaggerUi.serve as unknown as express.RequestHandler[])
);
app.get(
  "/api-docs",
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "PromptLab API Docs",
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js",
    ],
  }) as unknown as express.RequestHandler
);

// Routes
app.use("/auth", authRouter);
app.use("/templates", templatesRouter);
app.use("/generate", jobsRouter);
app.use("/jobs", jobsRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT || process.env.API_PORT) || 4000;

// Export for Vercel serverless
export default app;

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ API running on http://0.0.0.0:${PORT}`);
    console.log(`📚 API Docs: http://0.0.0.0:${PORT}/api-docs`);
    console.log(`🏥 Health: http://0.0.0.0:${PORT}/health`);
  });
}
