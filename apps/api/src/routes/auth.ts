import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ErrorCode,
} from "@promptlab/shared";
import { prisma } from "@promptlab/db/src/client";
import { generateToken, AuthRequest, authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: mySecurePassword123
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = RegisterRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: {
          code: "validation_error" as ErrorCode,
          message: "Invalid request data",
          details: validation.error.flatten(),
        },
      });
      return;
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        error: {
          code: "conflict" as ErrorCode,
          message: "User with this email already exists",
        },
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      token,
      user,
    });
  } catch (error) {
    console.error("[AUTH] Register error:", error);
    res.status(500).json({
      error: {
        code: "internal_error" as ErrorCode,
        message: "Failed to register user",
      },
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: Authenticate user and receive JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mySecurePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validation = LoginRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: {
          code: "validation_error" as ErrorCode,
          message: "Invalid request data",
          details: validation.error.flatten(),
        },
      });
      return;
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        error: {
          code: "unauthorized" as ErrorCode,
          message: "Invalid email or password",
        },
      });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({
        error: {
          code: "unauthorized" as ErrorCode,
          message: "Invalid email or password",
        },
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    res.status(500).json({
      error: {
        code: "internal_error" as ErrorCode,
        message: "Failed to login",
      },
    });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user info
 *     description: Returns information about the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: {
          code: "not_found" as ErrorCode,
          message: "User not found",
        },
      });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("[AUTH] Get user error:", error);
    res.status(500).json({
      error: {
        code: "internal_error" as ErrorCode,
        message: "Failed to get user info",
      },
    });
  }
});

export default router;
