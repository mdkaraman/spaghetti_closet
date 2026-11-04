# Login home

`/` is the branded login: Spaghetti Closet title image, user id + passcode fields, enter, and footer links to intro and forgot-password.

## Sub-features

- `home-brand` shows the title image with alt `Spaghetti closet.`
- `home-fields` exposes `user id:` and `passcode:` inputs and an `enter` submit control.
- `home-footer` links to intro and forgot-password.

## How to get to it (user POV)

- Open `/`.
- Land on `/` after a logged-out hit on a protected route (see auth-gate).

## Driving it with sc-verify

Preconditions:

- Doctor ok.
- Logged out (fresh launch has no session cookies).

- **Brand.** Run `sc-verify browser goto --url /` and `sc-verify browser expect-text --text "user id:"`. Confirm the title image via `sc-verify browser eval --script "document.querySelector('img.title-image')?.getAttribute('alt')" ` expecting `Spaghetti closet.`
- **Fields.** Fill labels without submitting (submit needs Supabase). Run `sc-verify browser fill --label "user id:" --value "verify_user"` and `sc-verify browser fill --label "passcode:" --value "secret12"`.
- **Footer.** Run `sc-verify browser click --role link --name "smh i forgot"` then `sc-verify browser expect-url --url /forgot-password`.
- **Proof.** Return home, then `sc-verify browser screenshot --path login-home/home.png` and `sc-verify browser snapshot --path login-home/home.aria.json` showing the title alt and both field labels.

## Gotchas

- Submitting `enter` without Supabase env throws in the server action—do not treat that crash as product proof.
- `?error=auth` redirects to `/reset-password/expired`; avoid that query unless testing expiry.
