// ESLint 9 flat config (replaces .eslintrc and .eslintignore)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
    {
        ignores: ["node_modules/", "dist/", "scripts/"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            globals: { ...globals.browser },
        },
        rules: {
            "no-case-declarations": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "semi": "error",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-empty-function": "off",
            // These three replaced ban-types, which was off
            "@typescript-eslint/no-unsafe-function-type": "off",
            "@typescript-eslint/no-wrapper-object-types": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            // Warnings, as in the typescript-eslint version the old config was written for
            "@typescript-eslint/no-explicit-any": "warn",
            "prefer-const": "warn",
            "no-bitwise": "error",
        },
    },
);
