module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
    ],
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
