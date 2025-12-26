"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Sparkles, Clock, Zap } from "lucide-react";

export default function Home() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en-US";

  const features = [
    {
      icon: FileText,
      title: t("home.features.templates.title"),
      description: t("home.features.templates.description"),
    },
    {
      icon: Sparkles,
      title: t("home.features.generation.title"),
      description: t("home.features.generation.description"),
    },
    {
      icon: Clock,
      title: t("home.features.tracking.title"),
      description: t("home.features.tracking.description"),
    },
    {
      icon: Zap,
      title: t("home.features.history.title"),
      description: t("home.features.history.description"),
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-50">
          <Sparkles className="h-10 w-10 text-zinc-50 dark:text-zinc-900" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t("home.title")}
        </h1>
        <p className="max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          {t("home.description")}
        </p>
        <div className="flex gap-4">
          <Link href={`/${locale}/templates`}>
            <Button size="lg">
              <FileText className="mr-2 h-4 w-4" />
              {t("nav.templates")}
            </Button>
          </Link>
          <Link href={`/${locale}/generate`}>
            <Button size="lg" variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("nav.generate")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <feature.icon className="h-6 w-6" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t("home.stats.success")}</CardDescription>
            <CardTitle className="text-3xl">100%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Retry logic automático
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Cache Hit Rate</CardDescription>
            <CardTitle className="text-3xl">99.9%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("home.stats.success")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avg. Response</CardDescription>
            <CardTitle className="text-3xl">&lt;10ms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Com cache hit
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
