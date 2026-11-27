import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  { ignores: ["dist", "node_modules", "src/generated", "api/index.js"] },
  { languageOptions: { globals: globals.node } }
);
