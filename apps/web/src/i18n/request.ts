import { getRequestConfig } from "next-intl/server";

// Can be imported from a shared config
export const locales = ["en-US", "pt-BR"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Ensure we have a valid locale, fallback to en-US if undefined
  const validLocale =
    locale && locales.includes(locale as Locale) ? locale : "en-US";

  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default,
  };
});
