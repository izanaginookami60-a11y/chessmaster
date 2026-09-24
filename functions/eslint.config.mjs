import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/**
 * Flat config for the Cloud Functions package. Kept self-contained (no
 * shared presets) because functions/ has its own dependency tree, and it
 * mirrors the root config's intent: type-aware linting without style
 * noise that would block `firebase deploy`.
 */
const eslintConfig = [
  { ignores: ["lib/**", "generated/**"] },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Promise: "readonly",
        Date: "readonly",
        Error: "readonly",
        Math: "readonly",
        Number: "readonly",
        JSON: "readonly",
        Object: "readonly",
        Array: "readonly",
        Set: "readonly",
        Map: "readonly",
        Record: "readonly",
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // tsc already reports unused vars as an error (noUnusedLocals).
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
