import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { rateLimitMiddleware } from "./middleware/rateLimit";
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
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
