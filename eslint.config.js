import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const LEGACY_ROUTE_PRISMA_ALLOWLIST = [
  "server/routes/advisorProfileRoutes.ts",
  "server/routes/advisorRoutes.ts",
  "server/routes/adminMarketplaceRoutes.ts",
  "server/routes/adminRoutes.ts",
  "server/routes/agentRoutes.ts",
  "server/routes/assetRoutes.ts",
  "server/routes/authRoutes.ts",
  "server/routes/bookingMarketplaceRoutes.ts",
  "server/routes/bookingRoutes.ts",
  "server/routes/collaborationRoutes.ts",
  "server/routes/communicationRoutes.ts",
  "server/routes/documentRoutes.ts",
  "server/routes/enrichmentRoutes.ts",
  "server/routes/estateRoutes.ts",
  "server/routes/formRoutes.ts",
  "server/routes/heirRoutes.ts",
  "server/routes/lettersDispatchRoutes.ts",
  "server/routes/liabilityRoutes.ts",
  "server/routes/mailingRoutes.ts",
  "server/routes/marketplaceRoutes.ts",
  "server/routes/marketingRoutes.ts",
  "server/routes/webhookRoutes.ts",
];

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["server/routes/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../db", "../db.js", "./db", "./db.js"],
              message:
                "Route modules must not import Prisma directly. Use a domain service/repository instead.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='prisma']",
          message:
            "Route modules must not access prisma directly. Move DB access into a domain service/repository.",
        },
      ],
    },
  },
  {
    files: LEGACY_ROUTE_PRISMA_ALLOWLIST,
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
    },
  }
);
