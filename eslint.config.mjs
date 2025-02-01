// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Keep extends from next
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add our custom overrides
  {
    rules: {
      // Turn off "no-explicit-any"
      "@typescript-eslint/no-explicit-any": "off",

      // Turn off or warn about unused vars
      "@typescript-eslint/no-unused-vars": "off",

      // Turn off unescaped entities in React
      "react/no-unescaped-entities": "off",

      // Turn off prefer-const
      "prefer-const": "off"
    },
  },
];
