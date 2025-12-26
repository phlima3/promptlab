"use client";

import { useJob } from "@/lib/hooks";
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
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import {
  formatDate,
  formatCost,
  formatNumber,
  copyToClipboard,
} from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function JobDetailPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en-US";
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [copied, setCopied] = useState(false);

  const { data: job, isLoading, error } = useJob(jobId);

  const statusConfig = {
    queued: {
      icon: Clock,
      variant: "secondary" as const,
      label: t("jobs.status.queued"),
      description: t("jobs.status.queued"),
    },
    running: {
      icon: Loader2,
      variant: "warning" as const,
      label: t("jobs.status.running"),
      description: t("jobs.status.running"),
    },
    completed: {
      icon: CheckCircle2,
      variant: "success" as const,
      label: t("jobs.status.completed"),
      description: t("jobs.status.completed"),
    },
    failed: {
      icon: XCircle,
      variant: "error" as const,
      label: t("jobs.status.failed"),
      description: t("jobs.status.failed"),
    },
  };

  const handleCopy = async () => {
    if (job?.output) {
      const success = await copyToClipboard(job.output);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="mt-4 text-sm text-zinc-500">{t("common.loading")}</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/jobs`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
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
        </div>
      </ProtectedRoute>
    );
  }

  if (!job) {
    return (
      <ProtectedRoute>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/jobs`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>{t("jobs.notFound")}</CardTitle>
              <CardDescription>
                {t("jobs.notFoundDescription", { jobId })}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const status = statusConfig[job.status];
  const StatusIcon = status.icon;

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/jobs`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon
                className={`h-3 w-3 ${
                  job.status === "running" ? "animate-spin" : ""
                }`}
              />
              {status.label}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  {t("jobs.jobId")}: {job.id.slice(0, 8)}...
                </CardTitle>
                <CardDescription className="mt-1">
                  {status.description}
                </CardDescription>
              </div>
              <div className="text-right text-sm text-zinc-500">
                <div>
                  {t("jobs.created")}: {formatDate(job.createdAt)}
                </div>
                {job.finishedAt && (
                  <div>
                    {t("jobs.finished")}: {formatDate(job.finishedAt)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-zinc-500">
                  {t("jobs.provider")}
                </div>
                <div className="mt-1 font-mono text-sm">{job.provider}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-zinc-500">
                  {t("jobs.attempts")}
                </div>
                <div className="mt-1 font-mono text-sm">{job.attempts}</div>
              </div>
            </div>

            {(job.inputTokens || job.outputTokens || job.estimatedCostUSD) && (
              <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-zinc-500" />
                  <h4 className="text-sm font-medium">
                    {t("jobs.usageMetrics")}
                  </h4>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {job.inputTokens && (
                    <div>
                      <div className="text-xs text-zinc-500">
                        {t("jobs.inputTokens")}
                      </div>
                      <div className="mt-1 font-mono text-lg font-semibold">
                        {formatNumber(job.inputTokens)}
                      </div>
                    </div>
                  )}
                  {job.outputTokens && (
                    <div>
                      <div className="text-xs text-zinc-500">
                        {t("jobs.outputTokens")}
                      </div>
                      <div className="mt-1 font-mono text-lg font-semibold">
                        {formatNumber(job.outputTokens)}
                      </div>
                    </div>
                  )}
                  {job.estimatedCostUSD !== null &&
                    job.estimatedCostUSD !== undefined && (
                      <div>
                        <div className="text-xs text-zinc-500">
                          {t("jobs.cost")}
                        </div>
                        <div className="mt-1 font-mono text-lg font-semibold text-green-600 dark:text-green-400">
                          {formatCost(job.estimatedCostUSD)}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {job.input && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("jobs.input")}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-60 overflow-auto rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
                {job.input}
              </pre>
            </CardContent>
          </Card>
        )}

        {job.output && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t("jobs.output")}</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t("common.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      {t("common.copy")}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {job.output}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {job.error && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-lg text-red-900 dark:text-red-100">
                {t("common.error")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-60 overflow-auto rounded-lg bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
                {job.error}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
