"use client";

import { useJobs } from "@/lib/hooks";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Eye } from "lucide-react";
import { formatRelativeTime, formatCost } from "@/lib/utils";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";

export default function JobsPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en-US";

  const { data: jobs, isLoading, error } = useJobs();

  const statusConfig = {
    queued: { variant: "secondary" as const, label: t("jobs.status.queued") },
    running: { variant: "warning" as const, label: t("jobs.status.running") },
    completed: {
      variant: "success" as const,
      label: t("jobs.status.completed"),
    },
    failed: { variant: "error" as const, label: t("jobs.status.failed") },
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              {t("common.error")}
            </CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              {error.error?.message || t("errors.generic")}
            </CardDescription>
          </CardHeader>
        </Card>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("jobs.title")}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              {t("home.features.tracking.description")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {jobs?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <p className="text-center text-zinc-500 dark:text-zinc-400">
                  {t("jobs.noJobs")}
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs?.map((job) => {
              const status = statusConfig[job.status];
              return (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            Job {job.id.slice(0, 8)}...
                          </CardTitle>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {t("jobs.provider")}: {job.provider} •{" "}
                          {t("jobs.createdAt")}{" "}
                          {formatRelativeTime(job.createdAt)}
                        </CardDescription>
                      </div>
                      <Link href={`/${locale}/jobs/${job.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          {t("jobs.viewDetails")}
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {job.input && (
                        <div>
                          <div className="text-xs font-medium text-zinc-500">
                            {t("jobs.input")}
                          </div>
                          <div className="mt-1 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
                            {job.input}
                          </div>
                        </div>
                      )}

                      {job.status === "completed" && job.output && (
                        <div>
                          <div className="text-xs font-medium text-zinc-500">
                            {t("jobs.output")}
                          </div>
                          <div className="mt-1 line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">
                            {job.output}
                          </div>
                        </div>
                      )}

                      {job.status === "failed" && job.error && (
                        <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                          <div className="text-xs font-medium text-red-700 dark:text-red-300">
                            {t("jobs.error")}
                          </div>
                          <div className="mt-1 line-clamp-2 text-sm text-red-600 dark:text-red-400">
                            {job.error}
                          </div>
                        </div>
                      )}

                      {job.status === "completed" &&
                        job.estimatedCostUSD !== null &&
                        job.estimatedCostUSD !== undefined && (
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <div>
                              <span className="font-medium">
                                {t("jobs.cost")}:
                              </span>{" "}
                              <span className="font-mono text-green-600 dark:text-green-400">
                                {formatCost(job.estimatedCostUSD)}
                              </span>
                            </div>
                            {job.totalTokens && (
                              <div>
                                <span className="font-medium">
                                  {t("jobs.tokens")}:
                                </span>{" "}
                                <span className="font-mono">
                                  {job.totalTokens}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
