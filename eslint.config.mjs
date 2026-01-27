import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...next,
  ...nextTypescript,
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{js,ts,tsx}"],
    plugins: {
      "no-relative-import-paths": noRelativeImportPaths,
    },
    rules: {
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        { allowSameFolder: true, rootDir: "./", prefix: "@" },
      ],
      "sort-imports": [
        "error",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
      "import/order": [
        1,
        {
          groups: [
            ["builtin", "external", "internal"],
            ["parent", "index", "sibling"],
            "object",
            "type",
          ],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  prettierRecommended,
  // Disable no-relative-import-paths for convex folder (uses its own tsconfig)
  {
    files: ["convex/**/*.{js,ts,tsx}"],
    rules: {
      "no-relative-import-paths/no-relative-import-paths": "off",
    },
  },
  // Disable react-hooks/rules-of-hooks for e2e folder (Playwright fixtures use `use()` which is not a React Hook)
  {
    files: ["e2e/**/*.{js,ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
]);

export default eslintConfig;
