import express from "express";
import { GenerateRequestSchema } from "@promptlab/shared";
import { prisma } from "@promptlab/db/src/client";

const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  const parsed = GenerateRequestSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });

  const job = await prisma.job.create({
    data: { input: parsed.data.input, status: "queued" },
  });

  return res.json({ jobId: job.id });
});

app.get("/jobs/:id", async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) return res.status(404).json({ error: "not_found" });
  return res.json(job);
});

app.listen(4000, () => console.log("API on :4000"));
