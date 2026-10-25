# Seed data

**Upload via Supabase Dashboard → Table Editor → [table] → Import data from CSV.**

- **jonts.csv** — Safe to upload as-is. Five rows (one per day). Use for "jont of the day"; today in US East Coast = row with that date.
- **waitlist_emails.csv** — Safe to upload as-is. Three dummy waitlist emails.

**profiles** and **purchases** reference `auth.users(id)`. You cannot insert arbitrary UUIDs; the IDs must exist in Auth first.

- **profiles:** Rows are created by the app when a user signs up (or add manually in Table Editor after the first user signs up, using their Auth user ID from Authentication → Users).
- **purchases:** Add rows in Table Editor after you have at least one user and one jont: use the user's UUID from Auth and a jont `id` from the jonts table.

So: upload **jonts.csv** and **waitlist_emails.csv** to validate and build. Use the app (signup) to create profiles; use the app (dummy pay) or dashboard to create purchases.

**Rest of the year:** `copy_hoodie_rest_of_year.sql` copies the hoodie jont (`/hoodie.png`, or the earliest title containing "hoodie") onto every day from today through December 31 in America/New_York. Paste it into the Supabase SQL Editor and run it. Dates that already have a jont are skipped.

**One week:** `load_next_week.sql` copies that same hoodie jont onto the seven days from today through the exclusive end in America/New_York, and inserts one live `site_weeks` row for that span. Paste it into the Supabase SQL Editor and run it. A date that already has a jont is skipped, and so is the week row when one already overlaps the span. Running this file arms the dark gate: with a week row present, the site is dark outside that span.
