import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ErrorCode } from "@promptlab/shared";

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, any>,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "Invalid request data",
        details: err.flatten(),
      },
    });
  }

  // Handle application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: {
      code: "internal_error",
      message: "An unexpected error occurred",
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "not_found",
      message: "Route not found",
    },
  });
}
