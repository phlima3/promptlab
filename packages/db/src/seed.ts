import { prisma } from "@promptlab/db/src/client";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.job.deleteMany({});
  await prisma.template.deleteMany({});

  // Create sample templates
  const template1 = await prisma.template.create({
    data: {
      name: "Blog Post Writer",
      systemPrompt:
        "You are a professional blog writer. Write engaging, informative content.",
      userPrompt: "Write a blog post about: {{input}}",
      variablesSchema: { input: "string" },
    },
  });

  const template2 = await prisma.template.create({
    data: {
      name: "Code Reviewer",
      systemPrompt:
        "You are an expert code reviewer. Provide constructive feedback.",
      userPrompt: "Review this code and suggest improvements:\n\n{{input}}",
      variablesSchema: { input: "string" },
    },
  });

  const template3 = await prisma.template.create({
    data: {
      name: "Email Composer",
      systemPrompt:
        "You are a professional email writer. Write clear, concise emails.",
      userPrompt: "Compose an email about: {{input}}",
      variablesSchema: { input: "string" },
    },
  });

  console.log("✅ Created templates:");
  console.log(`  - ${template1.name} (${template1.id})`);
  console.log(`  - ${template2.name} (${template2.id})`);
  console.log(`  - ${template3.name} (${template3.id})`);

  console.log("\n🎉 Seeding complete!");
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
