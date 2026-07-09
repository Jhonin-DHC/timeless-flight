import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });
const sourceFiles = ["src/**/*.{js,jsx,ts,tsx}"];

const eslintConfig = [
  {
    ignores: ["**/*"]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript").map((config) => ({
    ...config,
    files: sourceFiles
  }))
];

export default eslintConfig;
