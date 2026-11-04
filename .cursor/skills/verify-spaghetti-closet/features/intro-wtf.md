# Intro (wtf is this)

The intro explains the daily-drop vibe in plain copy and sends a new visitor to signup via “click here to blow”.

## Sub-features

- `intro-open` shows the Eminem-quoting intro copy on `/wtf-is-this`.
- `intro-cta` navigates to `/signup` from the blow link.
- `intro-from-home` reaches the intro from the login footer.

## How to get to it (user POV)

- Open `/wtf-is-this` directly.
- From `/`, choose the `wtf is this??` footer link.

## Driving it with sc-verify

Preconditions:

- Instance is healthy (`sc-verify doctor` ok) at `http://127.0.0.1:3101` (or this run’s port).
- No login session required.

- **Home entry.** Open home, then the footer link. Run `sc-verify browser goto --url /` and `sc-verify browser click --role link --name "wtf is this??"`. URL is `/wtf-is-this`.
- **Direct entry.** Run `sc-verify browser goto --url /wtf-is-this`. Body includes `ok this what it is` and `click here to blow`.
- **CTA.** Run `sc-verify browser click --role link --name "click here to blow"`. URL becomes `/signup`.
- **Proof.** Run `sc-verify browser screenshot --path intro-wtf/signup.png` and `sc-verify browser snapshot --path intro-wtf/signup.aria.txt`. Artifacts show the signup form labels (`user id:`, `email:`, `passcode:`, `confirm:`).

## Gotchas

- The CTA is an `<a href="/signup">`, not a button—use `--role link`.
- Copy uses curly / escaped apostrophes in source; assert on stable phrases like `click here to blow` or `ok this what it is`.
