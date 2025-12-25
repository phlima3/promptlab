import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PromptLab API",
      version: "1.0.0",
      description: "AI Writing Workspace API - Create prompt templates and generate content using LLMs",
      contact: {
        name: "PromptLab Team",
        url: "https://github.com/yourorg/promptlab",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  enum: [
                    "validation_error",
                    "not_found",
                    "rate_limited",
                    "internal_error",
                    "provider_error",
                    "unauthorized",
                    "forbidden",
                    "conflict",
                  ],
                },
                message: {
                  type: "string",
                },
                details: {
                  type: "object",
                  additionalProperties: true,
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            name: {
              type: "string",
              nullable: true,
              description: "User name",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT authentication token",
            },
            user: {
              type: "object",
              properties: {
                id: { type: "string" },
                email: { type: "string" },
                name: { type: "string", nullable: true },
              },
            },
          },
        },
        Template: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Template ID",
            },
            name: {
              type: "string",
              description: "Template name",
            },
            systemPrompt: {
              type: "string",
              description: "System prompt for the LLM",
            },
            userPrompt: {
              type: "string",
              description: "User prompt template with variables like {{input}}",
            },
            variablesSchema: {
              type: "object",
              description: "JSON schema for variables",
              additionalProperties: true,
            },
            version: {
              type: "integer",
              description: "Template version",
            },
            userId: {
              type: "string",
              nullable: true,
              description: "Owner user ID (null for public templates)",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Job: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Job ID",
            },
            status: {
              type: "string",
              enum: ["queued", "running", "completed", "failed"],
              description: "Job status",
            },
            templateId: {
              type: "string",
              description: "Template ID used for this job",
            },
            userId: {
              type: "string",
              nullable: true,
              description: "Owner user ID (null for anonymous jobs)",
            },
            provider: {
              type: "string",
              enum: ["openai", "anthropic"],
              description: "LLM provider",
            },
            model: {
              type: "string",
              nullable: true,
              description: "Model name used",
            },
            input: {
              type: "string",
              description: "Input text for generation",
            },
            inputHash: {
              type: "string",
              description: "Hash for idempotency",
            },
            output: {
              type: "string",
              nullable: true,
              description: "Generated output",
            },
            error: {
              type: "string",
              nullable: true,
              description: "Error message if failed",
            },
            attempts: {
              type: "integer",
              description: "Number of attempts",
            },
            inputTokens: {
              type: "integer",
              nullable: true,
              description: "Input tokens used",
            },
            outputTokens: {
              type: "integer",
              nullable: true,
              description: "Output tokens generated",
            },
            totalTokens: {
              type: "integer",
              nullable: true,
              description: "Total tokens (input + output)",
            },
            estimatedCostUSD: {
              type: "number",
              nullable: true,
              description: "Estimated cost in USD",
            },
            startedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            finishedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "Templates",
        description: "Template management",
      },
      {
        name: "Jobs",
        description: "Job generation and status",
      },
      {
        name: "Health",
        description: "Health check",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/index.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
