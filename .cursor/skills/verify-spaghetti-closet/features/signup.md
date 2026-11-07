# Signup form

Signup collects user id, email, passcode, and confirm, then “send it”. Completing signup against Auth requires Supabase; this map still proves the form is reachable and labeled.

## Sub-features

- `signup-fields` shows required labeled inputs and `send it`.
- `signup-from-intro` arrives via the wtf CTA.
- `signup-submit` creates an account (Supabase required)—unmet without env.

## How to get to it (user POV)

- Open `/signup`.
- From `/wtf-is-this`, choose `click here to blow`.

## Driving it with sc-verify

Preconditions:

- Doctor ok.
- For `signup-submit` only: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` present in the launched server’s environment.

- **Reach form.** Run `sc-verify browser goto --url /wtf-is-this`, `sc-verify browser click --role link --name "click here to blow"`, `sc-verify browser expect-url --url /signup`.
- **Fill (no submit without env).** Run fills for `--label "user id:"`, `"email:"`, `"passcode:"`, `"confirm:"` with disposable values.
- **Submit (Supabase).** Click `--role button --name "send it"`. Expect either `/signup/complete` or an inline `role=alert` error from the action—not a raw 500 from missing env.
- **Proof.** `sc-verify browser screenshot --path signup/form.png` and `sc-verify browser snapshot --path signup/form.aria.txt` showing all four labels.

## Gotchas

- Without Supabase env, submit throws `Missing env: NEXT_PUBLIC_SUPABASE_URL…`. Report `signup-submit` failed precondition; do not weaken the journey.
- Passcode fields require `minLength={6}` in the browser.
