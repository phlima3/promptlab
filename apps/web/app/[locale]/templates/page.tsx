"use client";

import { useTemplates, useCreateTemplate } from "@/lib/hooks";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";

export default function TemplatesPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en-US";

  const { data: templates, isLoading, error } = useTemplates();
  const createTemplate = useCreateTemplate();
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    systemPrompt: "",
    userPrompt: "",
    variablesSchema: {},
    version: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTemplate.mutateAsync(formData);
      setShowForm(false);
      setFormData({
        name: "",
        systemPrompt: "",
        userPrompt: "",
        variablesSchema: {},
        version: 1,
      });
    } catch (err) {
      console.error("Error creating template:", err);
    }
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">
            {t("common.error")}: {error.error?.message || t("errors.generic")}
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("templates.title")}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              {t("home.features.templates.description")}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("templates.createNew")}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{t("templates.createNew")}</CardTitle>
              <CardDescription>{t("templates.createFirst")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("templates.form.name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("templates.form.namePlaceholder")}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">
                    {t("templates.form.systemPrompt")}
                  </Label>
                  <Textarea
                    id="systemPrompt"
                    placeholder={t("templates.form.systemPromptPlaceholder")}
                    value={formData.systemPrompt}
                    onChange={(e) =>
                      setFormData({ ...formData, systemPrompt: e.target.value })
                    }
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userPrompt">
                    {t("templates.form.userPrompt")}
                  </Label>
                  <Textarea
                    id="userPrompt"
                    placeholder={t("templates.form.userPromptPlaceholder")}
                    value={formData.userPrompt}
                    onChange={(e) =>
                      setFormData({ ...formData, userPrompt: e.target.value })
                    }
                    rows={6}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createTemplate.isPending}>
                    {createTemplate.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("templates.createNew")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates?.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <p className="text-center text-zinc-500 dark:text-zinc-400">
                  {t("templates.noTemplates")}
                </p>
              </CardContent>
            </Card>
          ) : (
            templates?.map((template) => (
              <Link
                key={template.id}
                href={`/${locale}/generate?templateId=${template.id}`}
              >
                <Card className="cursor-pointer transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="secondary">
                        {t("templates.version")} {template.version}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {template.systemPrompt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        {t("templates.createdAt")}{" "}
                        {formatRelativeTime(template.createdAt)}
                      </span>
                      <FileText className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
