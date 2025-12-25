#!/usr/bin/env node

/**
 * Test script to demonstrate the full PromptLab flow:
 * 1. Create a template
 * 2. Submit a generation job
 * 3. Poll for job status
 * 4. Display the result
 */

const API_URL = "http://localhost:4000";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function main() {
  console.log("🚀 PromptLab End-to-End Test\n");

  // 1. List existing templates
  console.log("📋 Fetching templates...");
  const templates = await fetchJson(`${API_URL}/templates`);
  console.log(`Found ${templates.length} templates\n`);

  if (templates.length === 0) {
    console.log("⚠️  No templates found. Run 'yarn seed' first.");
    process.exit(1);
  }

  // Use the first template
  const template = templates[0];
  console.log(`📝 Using template: "${template.name}" (${template.id})\n`);

  // 2. Submit a generation job
  console.log("🎯 Submitting generation job...");
  const generateResponse = await fetchJson(`${API_URL}/generate`, {
    method: "POST",
    body: JSON.stringify({
      templateId: template.id,
      provider: "openai",
      input: "the benefits of TypeScript in modern web development",
    }),
  });

  const jobId = generateResponse.jobId;
  console.log(`Job created: ${jobId}\n`);

  // 3. Poll for job completion
  console.log("⏳ Waiting for job to complete...");
  let job;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    job = await fetchJson(`${API_URL}/jobs/${jobId}`);
    console.log(`Status: ${job.status} (attempt ${attempts + 1})`);

    if (job.status === "completed" || job.status === "failed") {
      break;
    }

    attempts++;
    await sleep(2000); // Poll every 2 seconds
  }

  console.log("\n" + "=".repeat(60));

  if (job.status === "completed") {
    console.log("✅ Job completed successfully!\n");
    console.log("📤 Output:");
    console.log(job.output);
  } else if (job.status === "failed") {
    console.log("❌ Job failed!\n");
    console.log("Error:", job.error);
  } else {
    console.log("⏰ Job timed out (still processing)");
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 Test complete!");
}

main().catch((error) => {
  console.error("\n❌ Test failed:", error.message);
  process.exit(1);
});
