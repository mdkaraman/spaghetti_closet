---
name: making-code-changes
description: Make changes in this repo responsibly: keep code clean and readable, add test coverage for new and modified behavior, then run specs and commit. Use when implementing features, fixing bugs, or refactoring.
---

# Making code changes responsibly

When changing this repo, follow these practices so the codebase stays maintainable and behavior is guarded by tests.

## Code quality

- **Keep it clean and readable.** Prefer small, focused functions and components. Use clear names. Avoid unnecessary abstraction or cleverness.
- **Be concise.** Say what you need in as few lines as makes sense. Don’t comment the obvious; comment the “why” when it’s not obvious.
- **Match existing style.** Follow patterns already in the file or feature (e.g. how forms use Server Actions, how errors are shown, how components are split). Check `PROJECT_SUMMARY.md` and `PHASES_OUTLINE.md` for product and tech context.
- **No stray changes.** Only touch what the task requires. Don’t reformat or rename unrelated code unless that’s the goal.

## Test coverage

- **New behavior → new tests.** Any new feature, page, or user-facing behavior should have tests. Add a `__tests__` directory next to the feature (e.g. `app/SomeRoute/__tests__/page.test.tsx`) and cover the main flows and edge cases.
- **Modified behavior → update or add tests.** If you change what something does (e.g. redirect target, validation, UI copy), update the existing tests or add tests so the new behavior is asserted. Don’t leave tests that still expect the old behavior.
- **Server Actions and redirects.** Mock `@/lib/supabase/server` (or other deps) and `next/navigation`’s `redirect` as needed. Assert that the action redirects to the correct URL or returns the right shape (see `app/actions/__tests__/auth.test.ts` for examples).
- **One test per behavior.** Keep each test focused on a single outcome. Name tests so it’s clear what they’re checking (e.g. “login with missing passcode redirects to wtf-is-this”).

For how to write tests (Vitest, RTL, patterns), use the **write-specs** skill.

## Before you’re done

1. **Run specs:** `npm run test:run`. Fix any failures before committing.
2. **Commit and push:** Use the **commit-and-push** skill: short commit message, then push. Don’t commit with failing or skipped tests.

## Summary

- Write clean, concise, readable code that fits the existing codebase.
- Add or update tests for every new or modified behavior.
- Run `npm run test:run` and only then commit and push.
