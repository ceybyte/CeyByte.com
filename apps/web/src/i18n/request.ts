// Server-only config: loads messages per locale at build time.
// Called once per render pass; next-intl caches the result.
// No dynamic imports at runtime — next build resolves them statically.
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate the locale from the [locale] segment.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  let messages;
  switch (locale) {
    case "si":
      messages = (await import("../../../../messages/si.json")).default;
      break;
    case "ta":
      messages = (await import("../../../../messages/ta.json")).default;
      break;
    case "en":
    default:
      messages = (await import("../../../../messages/en.json")).default;
      break;
  }

  return {
    locale,
    messages,
  };
});
