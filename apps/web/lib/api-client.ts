import type { Template, Job, GenerateRequest } from "@promptlab/shared";
import type { ApiError } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data as T;
  }

  // Templates
  async getTemplates(): Promise<Template[]> {
    return this.request<Template[]>("/templates");
  }

  async getTemplate(id: string): Promise<Template> {
    return this.request<Template>(`/templates/${id}`);
  }

  async createTemplate(
    data: Omit<Template, "id" | "createdAt" | "updatedAt">
  ): Promise<Template> {
    return this.request<Template>("/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Jobs
  async getJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }

  async getJobs(): Promise<Job[]> {
    // Note: This endpoint doesn't exist yet in the API, but we'll add it
    return this.request<Job[]>("/jobs");
  }

  // Generate
  async generate(
    data: GenerateRequest
  ): Promise<{ jobId: string; cached?: boolean }> {
    return this.request<{ jobId: string; cached?: boolean }>("/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_URL);
