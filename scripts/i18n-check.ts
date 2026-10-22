// Checks messages/{en,si,ta}.json: identical key sets, and (with --strict) no [[TRANSLATE]] markers.
// CLAUDE.md §1.5–1.6. Exits non-zero on failure so CI and deploys stop.
import { LOCALES } from "../packages/shared/src/enums";

type Tree = { [key: string]: string | Tree };

const strict = process.argv.includes("--strict");
const MARKER = "[[TRANSLATE]]";

function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

const catalogs = new Map<string, Map<string, string>>();
for (const locale of LOCALES) {
  const tree = (await Bun.file(`messages/${locale}.json`).json()) as Tree;
  catalogs.set(locale, flatten(tree));
}

const problems: string[] = [];
const reference = catalogs.get("en") ?? new Map<string, string>();

for (const [locale, catalog] of catalogs) {
  if (locale === "en") continue;
  for (const key of reference.keys()) if (!catalog.has(key)) problems.push(`${locale}: missing "${key}"`);
  for (const key of catalog.keys())
    if (!reference.has(key)) problems.push(`${locale}: extra "${key}" (not in en)`);
  if (strict) {
    for (const [key, value] of catalog)
      if (value.includes(MARKER)) problems.push(`${locale}: untranslated "${key}"`);
  }
}

if (problems.length > 0) {
  console.error(`i18n check failed (${problems.length}):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.warn(
  `i18n check passed: ${reference.size} keys × ${LOCALES.length} locales${strict ? " (strict)" : ""}`,
);
