// Shared lint config for apps/api and packages/shared (apps/web extends next's config).
// Custom rules `no-raw-color` and `no-bare-merchant-select` arrive in Phases 1 and 2.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.wrangler/**",
      "**/worker-configuration.d.ts",
      "apps/web/**",
      "**/.claude/**",
      "**/.agents/**",
      "**/out/**",
      "**/dist/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },
  {
    files: ["scripts/**/*.{ts,js}"],
    rules: {
      "no-console": "off",
    },
  },
);
