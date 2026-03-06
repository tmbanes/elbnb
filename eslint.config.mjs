import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,

  {
    files: ["**/*.{js,ts}"],
    plugins: {
      prettier
    },
    rules: {
      "prettier/prettier": "error"
    }
  },

  prettierConfig
];