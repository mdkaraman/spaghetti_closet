---
name: write-specs
description: Write unit tests for this Next.js app using Vitest and React Testing Library. Use when adding or changing tests, writing specs for new features, or when the user asks how to write tests.
---

# Write specs (Vitest + RTL)

## Stack

- **Runner:** Vitest (`vitest`, `vitest run`).
- **Component tests:** React Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`).
- **Config:** `vitest.config.ts` (jsdom, react, vite-tsconfig-paths), `vitest.setup.ts` (imports `@testing-library/jest-dom`).
- **Paths:** `@/*` and tsconfig paths work in tests via `vite-tsconfig-paths`.

## Where tests live

- Colocate with the code: `app/SomeFolder/__tests__/SomeThing.test.tsx`, or next to the file as `SomeThing.test.tsx`.
- Existing example: `app/__tests__/page.test.tsx` (tests for `app/page.tsx`).

## How to write a test file

1. **Imports:** `import { expect, test } from 'vitest'`, `import { render, screen } from '@testing-library/react'`, and the component under test (e.g. `import Home from '../page'`).
2. **Render:** `render(<Component />)` — no need for Router or layout unless the component depends on them.
3. **Queries:** Prefer accessible queries: `screen.getByRole(...)`, `screen.getByLabelText(...)`, `screen.getByRole('img', { name: /alt text/i })`. Use `getBy*` for “must exist”; use `queryBy*` when asserting absence.
4. **Assertions:** `expect(...).toBeInTheDocument()`, `.toHaveAttribute('attr', 'value')`, etc. (jest-dom is loaded in setup).

## What to test (patterns from existing tests)

- **Images:** Presence, `alt` text, `src` (e.g. title image).
- **Forms:** Labels and inputs (e.g. `getByLabelText(/user id:/i)`), submit button (`getByRole('button', { name: /enter/i })`), `form` action and method.
- **Links:** `getByRole('link', { name: /wtf is this\?\?/i })`.
- **Structure:** One test per behavior; keep tests small and descriptive.

## Running tests

- Single run (CI / pre-commit): `npm run test:run`
- Watch: `npm run test`

## Notes

- Async Server Components are not supported by Vitest; use E2E for those if needed.
- For new pages or components, add a `__tests__` directory next to the feature and mirror the test patterns above.
