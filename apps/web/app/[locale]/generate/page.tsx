"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTemplates, useGenerate } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useState, Suspense } from "react";
import { ProtectedRoute } from "@/components/protected-route";

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>}>
      <GenerateContent />
    </Suspense>
  );
}

function GenerateContent() {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get("templateId");
  const locale = pathname.split("/")[1] || "en-US";

  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const generate = useGenerate();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templateId || ""
  );
  const [provider, setProvider] = useState<"anthropic" | "openai">("anthropic");
  const [input, setInput] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      alert(t("generate.selectTemplate"));
      return;
    }

    try {
      const result = await generate.mutateAsync({
        templateId: selectedTemplateId,
        provider,
        input,
      });

      setJobId(result.jobId);
      setCached(result.cached || false);

      // Redirect to job page after 1 second
      setTimeout(() => {
        router.push(`/jobs/${result.jobId}`);
      }, 1000);
    } catch (err) {
      console.error("Error generating:", err);
    }
  };

  if (templatesLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </ProtectedRoute>
    );
  }

  if (templates?.length === 0) {
    return (
      <ProtectedRoute>
        <Card>
          <CardHeader>
            <CardTitle>{t("generate.noTemplates")}</CardTitle>
            <CardDescription>{t("templates.createFirst")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/${locale}/templates`)}>
              {t("generate.createTemplate")}
            </Button>
          </CardContent>
        </Card>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("generate.title")}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {t("home.description")}
          </p>
        </div>

        {jobId && (
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {cached ? t("generate.cacheHit") : t("generate.success")}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t("generate.success")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("generate.selectTemplate")}</CardTitle>
              <CardDescription>{t("templates.form.name")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {templates?.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedTemplateId === template.id
                        ? "border-zinc-900 bg-zinc-50 dark:border-zinc-50 dark:bg-zinc-900"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {t("templates.version")} {template.version}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {template.systemPrompt}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>{t("generate.selectProvider")}</CardTitle>
                <CardDescription>{t("generate.input")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">
                    {t("generate.selectProvider")}
                  </Label>
                  <select
                    id="provider"
                    value={provider}
                    onChange={(e) =>
                      setProvider(e.target.value as "anthropic" | "openai")
                    }
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300"
                  >
                    <option value="anthropic">
                      {t("generate.providers.anthropic")}
                    </option>
                    <option value="openai" disabled>
                      {t("generate.providers.openai")}
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="input">{t("generate.input")}</Label>
                  <Textarea
                    id="input"
                    placeholder={t("generate.inputPlaceholder")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={8}
                    required
                  />
                </div>

                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                  <h4 className="mb-2 text-sm font-medium">
                    {t("generate.preview")}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-zinc-500">
                        {t("generate.systemPrompt")}:
                      </span>
                      <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                        {selectedTemplate.systemPrompt}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-zinc-500">
                        {t("generate.userPrompt")}:
                      </span>
                      <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                        {selectedTemplate.userPrompt}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              size="lg"
              disabled={!selectedTemplateId || !input || generate.isPending}
            >
              {generate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("generate.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("generate.generate")}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.push(`/${locale}/templates`)}
            >
              {t("common.back")}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
