import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.eslint.json"],
        },
      },
    },
    rules: {
      "no-console": "error",
      "no-warning-comments": ["error", { terms: ["todo", "fixme"], location: "anywhere" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "import/no-duplicates": "error",
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  {
    files: ["eslint.config.js"],
    rules: {
      "@typescript-eslint/no-deprecated": "off",
    },
  },
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/.turbo/**", "**/node_modules/**"],
  },
);
