import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // no-raw-color (CLAUDE.md §6, hallmark gate 48): colours come from tokens in globals.css, never inline.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z-])|(rgba?|hsla?|oklch|oklab)\\(/]",
          message: "Raw colour value. Use a token (bg-surface, text-azure-text, var(--azure-400)…).",
        },
        {
          selector:
            "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z-])|(rgba?|hsla?|oklch|oklab)\\(/]",
          message: "Raw colour value. Use a token (bg-surface, text-azure-text, var(--azure-400)…).",
        },
      ],
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
