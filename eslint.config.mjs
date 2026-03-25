import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import globals from "globals";
import tseslint from "typescript-eslint";

const nextPlugin =
  nextVitals.find((config) => Boolean(config.plugins?.["@next/next"]))?.plugins?.["@next/next"] ??
  null;
const webFiles = ["apps/web/**/*.{js,jsx,mjs,ts,tsx,mts,cts}"];

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**"
    ]
  },
  ...(nextPlugin
    ? [
        {
          files: ["eslint.config.mjs", "package.json"],
          plugins: {
            "@next/next": nextPlugin
          }
        }
      ]
    : []),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals.map((config) =>
    config.ignores
      ? config
      : {
          ...config,
          files: webFiles
        }
  ),
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/test/**/*.ts", "**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];
