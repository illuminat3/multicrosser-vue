import js from "@eslint/js";
import tseslint from "typescript-eslint";
import configPrettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  configPrettier,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
);
