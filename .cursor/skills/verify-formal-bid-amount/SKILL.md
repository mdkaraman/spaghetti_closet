---
name: verify-formal-bid-amount
description: Formally checks Spaghetti Closet bid dollar→cent parsing (lib/bids/amount.ts dollarsToCents) for every string in a stated bound. Use when changing bid amount parsing, placeBid validation, or bids.amount_cents writes.
---

# Formal verify: bid dollars → cents

## Property (plain words)

**Property:** For every input string in scope, `dollarsToCents` either rejects the string (`null`) or returns exactly `N * 100` cents where `N` is a whole dollar amount ≥ 1 and the cent value fits in a signed 32-bit column (`≤ 2147483647`).

**Harm if broken:** Bids are stored in the wrong cent amount (under/overcharge) or invalid money (fractions, zero, overflow) reaches `bids.amount_cents` via `placeBid` in `app/actions/bid.ts`.

## Tool and why

There is no industrial TS verifier wired in this repo. The check runs **on the real `dollarsToCents` implementation** with:

1. Exhaustive generation of digit / dotted strings up to a length bound, plus a fixed attack corpus (signs, fractions, whitespace, overflow neighbors).
2. An independent oracle that re-derives accept/reject and expected cents from the documented rules (not by copying the production `if` chain blindly—see `oracle` in the check file).

This is cheaper and tighter than a hand-written TLA+ model of a pure parser. Use `/statechart` only if you later add a TLA+ model for bid *lifecycle* ordering; this skill’s check is not TLA+.

## When a change touches this

Re-run if you edit any of:

- `lib/bids/amount.ts` (`dollarsToCents`, `BID_AMOUNT_BOUNDS`)
- `app/actions/bid.ts` (`placeBid` amount path)
- DB expectations for `bids.amount_cents` (migrations / triggers that assume cent scale)

## How to run

From the repo root:

```bash
./.cursor/skills/verify-formal-bid-amount/bin/check
```

Equivalent:

```bash
npx vitest run .cursor/skills/verify-formal-bid-amount/check.test.ts
```

Expect exit code 0 and a summary line `formal-bid-amount: PASS` with the case count. Runtime should stay under ~30s on a laptop.

Pinned tooling: Vitest already in `package.json` (see lockfile). No extra global install.

## Bounds and assumptions

- String length bound for exhaustive digit bodies: **6** characters before an optional `.` + up to **3** trailing zeros (see check file constants). Larger whole-dollar strings are sampled at overflow boundaries (`floor(MAX_CENTS/100)`, `+1`, `Number.MAX_SAFE_INTEGER` neighbors) rather than fully enumerated.
- Assumes IEEE `Number` and `Number.isSafeInteger` as in the production function.
- Does **not** verify Supabase RLS, concurrent double-submit races, or the keep_bid_identity trigger—only the pure parse used before write.
- A pass means the function matches the oracle **inside the bound**, not that every future UI string is safe.

## Counterexamples

When the check fails, Vitest prints the input string, production result, and oracle expectation. Translate to product language, e.g. “typing `20` stored 200 cents instead of 2000”.

Do **not** weaken the oracle or the property to make a red check green. Do not change product code unless a human asks; report the finding.

## Distinguishing a real bug from a modeling error

- If production and oracle disagree on a string that matches the skill’s plain-language property, treat it as a **product bug**.
- If the oracle rejects a string the product docs intentionally allow (or vice versa), fix the **oracle/docs** after confirming with `app/actions/__tests__/bid.test.ts` and `lib/bids/amount.ts` comments—then move the sync commit.

## Coverage record

| Symbol | File |
|--------|------|
| `dollarsToCents` | `lib/bids/amount.ts` |
| `BID_AMOUNT_BOUNDS` | `lib/bids/amount.ts` |
| Caller | `placeBid` in `app/actions/bid.ts` |

**Sync commit:** `SYNC_COMMIT` in `./bin/check` and the header of `check.test.ts` must match the git commit at which an agent last confirmed this description matches the code. After an intentional change to the covered code, re-run the check and only then advance `SYNC_COMMIT` to that commit.

## Broken-variant drill (prove the check can fail)

1. Temporarily change `dollars * 100` to `dollars * 10` in `lib/bids/amount.ts`.
2. Run `./.cursor/skills/verify-formal-bid-amount/bin/check` — must fail on a whole-dollar input (e.g. `"20"`).
3. Revert the scratch change; re-run — must PASS again.

## Maintenance

After drifts, use `/maintain-formal-verification-skill` to realign the oracle, bounds, and sync commit.
