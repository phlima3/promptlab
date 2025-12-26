"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  // Extract locale from pathname instead of using useLocale
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Extract current locale from pathname (e.g., /pt-BR/templates -> pt-BR)
  const currentLocale = pathname.split("/")[1] || "en-US";

  const handleChange = (newLocale: string) => {
    if (newLocale === currentLocale) return; // Don't change if already on this locale

    startTransition(() => {
      // Remove the current locale from pathname and add the new one
      const pathnameWithoutLocale = pathname.replace(/^\/(en-US|pt-BR)/, "");
      const newPathname = `/${newLocale}${pathnameWithoutLocale || ""}`;
      router.push(newPathname);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleChange("en-US")}
        disabled={isPending}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          currentLocale === "en-US"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => handleChange("pt-BR")}
        disabled={isPending}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          currentLocale === "pt-BR"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label="Mudar para Português"
      >
        PT
      </button>
    </div>
  );
}
