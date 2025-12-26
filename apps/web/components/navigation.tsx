"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Sparkles, Clock, LogOut, User } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "./ui/button";

export function Navigation() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { user, isAuthenticated, logout } = useAuth();

  // Extract locale from pathname
  const locale = pathname.split("/")[1] || "en-US";

  const navigation = [
    { name: t("templates"), href: `/${locale}/templates`, icon: FileText },
    { name: t("generate"), href: `/${locale}/generate`, icon: Sparkles },
    { name: t("jobs"), href: `/${locale}/jobs`, icon: Clock },
  ];

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50">
                <Sparkles className="h-5 w-5 text-zinc-50 dark:text-zinc-900" />
              </div>
              <span className="text-xl font-bold">PromptLab</span>
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <User className="h-4 w-4" />
                  <span>{user?.name || user?.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {tAuth("logout")}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={`/${locale}/login`}>
                  <Button variant="outline" size="sm">
                    {tAuth("login")}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button size="sm">{tAuth("register")}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
