# Waitlist

When the shop is dark (or when visiting `/waitlist` directly), visitors see “lmk when we back up” and can leave an email. Inserting into `waitlist_emails` needs Supabase.

## Sub-features

- `waitlist-copy` shows the heading and lyrics block.
- `waitlist-form` exposes `email:` and `send it`.
- `waitlist-success` shows “Got it. We'll hit you up when we're back.” after a successful insert (Supabase required).

## How to get to it (user POV)

- Open `/waitlist`.
- During a configured dark week, hit a non-allowlisted path and follow the redirect to `/waitlist` (needs Supabase `site_weeks`).

## Driving it with sc-verify

Preconditions:

- Doctor ok.
- Direct `/waitlist` works without Supabase for **rendering**. Success path needs env + writable `waitlist_emails`.

- **Open.** Run `sc-verify browser goto --url /waitlist` and `sc-verify browser expect-text --text "lmk when we back up"`.
- **Form.** Run `sc-verify browser fill --label "email:" --value "verify+$RUN_ID@example.com"` (do not submit without Supabase).
- **Submit (Supabase).** Click `--role button --name "send it"`. Expect URL `success=1` and status text `Got it`.
- **Proof.** `sc-verify browser screenshot --path waitlist/form.png` and `sc-verify browser snapshot --path waitlist/form.aria.json`.

## Gotchas

- HTML `required` on email blocks empty submit client-side; that is not server validation proof.
- Without Supabase, submit errors—record unmet precondition for `waitlist-success`.
- Dark-week auto-redirect is a separate entry point; skip reporting it verified unless `site_weeks` is seeded dark for today (America/New_York).
