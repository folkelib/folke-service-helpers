import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    {
        ignores: ["**/*.js", "**/*.d.ts", "**/*.cjs", "**/*.mjs"],
    },
    ...compat.extends(
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
    ),
    {
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: "module",

            parserOptions: {
                project: "./tsconfig.json",
            },
        },

        rules: {
            "react/jsx-no-bind": ["error"],
            "@typescript-eslint/consistent-type-assertions": "off",
            "no-unreachable": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": ["error"],
            "no-var": ["error"],

            "prefer-const": [
                "error",
                {
                    destructuring: "all",
                },
            ],

            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
];
