import createMiddleware from "next-intl/middleware";
import { locales } from "./src/i18n/request";

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: "en-US",

  // Always show locale in URL for clarity
  localePrefix: "always",
});

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(pt-BR|en-US)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
