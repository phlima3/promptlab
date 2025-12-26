"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { Template, Job, GenerateRequest } from "@promptlab/shared";
import { apiClient } from "./api-client";
import type { ApiError } from "./types";

// Query keys
export const queryKeys = {
  templates: ["templates"] as const,
  template: (id: string) => ["templates", id] as const,
  jobs: ["jobs"] as const,
  job: (id: string) => ["jobs", id] as const,
};

// Templates hooks
export function useTemplates(): UseQueryResult<Template[], ApiError> {
  return useQuery({
    queryKey: queryKeys.templates,
    queryFn: () => apiClient.getTemplates(),
  });
}

export function useTemplate(id: string): UseQueryResult<Template, ApiError> {
  return useQuery({
    queryKey: queryKeys.template(id),
    queryFn: () => apiClient.getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplate(): UseMutationResult<
  Template,
  ApiError,
  Omit<Template, "id" | "createdAt" | "updatedAt">
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiClient.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates });
    },
  });
}

// Jobs hooks
export function useJob(
  id: string,
  options?: { refetchInterval?: number }
): UseQueryResult<Job, ApiError> {
  return useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => apiClient.getJob(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Auto-refresh if job is queued or running
      if (data?.status === "queued" || data?.status === "running") {
        return options?.refetchInterval || 2000; // Poll every 2s
      }
      return false; // Stop polling when completed/failed
    },
  });
}

export function useJobs(): UseQueryResult<Job[], ApiError> {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => apiClient.getJobs(),
  });
}

// Generate hook
export function useGenerate(): UseMutationResult<
  { jobId: string; cached?: boolean },
  ApiError,
  GenerateRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiClient.generate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
    },
  });
}
