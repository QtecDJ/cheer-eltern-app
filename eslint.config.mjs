import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  
  // Custom rules for enhanced code quality
  {
    rules: {
      // Prevent console.log in production code
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Enforce React best practices
      "react/jsx-no-target-blank": ["error", { allowReferrer: true }],
      "react/no-danger": "warn", // Warn on dangerouslySetInnerHTML
      "react-hooks/exhaustive-deps": "error",
      
      // TypeScript specific
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // Code quality
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "curly": ["error", "multi-line"],
      "no-duplicate-imports": "error",
    },
  },
  
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.config.js",
    "*.config.mjs",
    "*.config.ts",
    "scripts/**",
    "prisma/**",
  ]),
]);

export default eslintConfig;
