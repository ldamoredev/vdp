import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const nodeGlobals = {
  Buffer: "readonly",
  console: "readonly",
  clearInterval: "readonly",
  clearTimeout: "readonly",
  crypto: "readonly",
  fetch: "readonly",
  process: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
};

const browserGlobals = {
  document: "readonly",
  EventSource: "readonly",
  FormData: "readonly",
  Headers: "readonly",
  localStorage: "readonly",
  navigator: "readonly",
  Request: "readonly",
  Response: "readonly",
  window: "readonly",
};

const testGlobals = {
  afterAll: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  test: "readonly",
  vi: "readonly",
};

export default [
  {
    ignores: [
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/triple-slash-reference": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-undef": "off",
    },
  },
  {
    files: ["server/**/*.ts", "packages/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/__tests__/**/*.{ts,tsx}",
      "apps/web/e2e/**/*.ts",
    ],
    languageOptions: {
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
        ...testGlobals,
      },
    },
  },
];
