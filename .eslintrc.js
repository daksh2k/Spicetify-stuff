module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["tsconfig.json"],
        sourceType: "module",
    },
    files: ["./Extensions/full-screen/**/*"],
    plugins: ["react", "@typescript-eslint"],
    settings: {
        react: {
            version: "17.0.2",
        },
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
    rules: {
        "@typescript-eslint/no-non-null-assertion": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/ban-ts-comment": [
            "warn",
            {
                "ts-expect-error": "allow-with-description",
                "ts-ignore": "allow-with-description",
            },
        ],
    },
};
