import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
export const routing = defineRouting({
  // A list of all locales that are supported
  // locales: ["en", "ja", "zh", "hi", "fr", "es", "ru", "de"],
  locales: ["en"],

  // Used when no locale matches
  defaultLocale: "en",
  localePrefix: "as-needed",
});
