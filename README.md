# Thapar Roomie Finder — Setup Guide (2-day build)

This is a working starter: sign up, build a profile, get ranked matches by
compatibility, mutual-like to unlock chat, and message in real time.

Follow these steps in order. Total setup time before you start customizing: ~30 min.

## Day 1 — Get it running (auth + profile + matching)

### Step 1: Create your Supabase project (5 min)
1. Go to https://supabase.com and sign up (free tier is enough).
2. Click "New Project". Name it `thapar-roomie`, set a database password
   (save it somewhere), pick a region close to India (Singapore is closest).
3. Wait ~2 minutes for it to provision.

### Step 2: Run the database schema (2 min)
1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Click "New query", paste the entire contents of `sql/schema.sql`
   (in this project) into it, and click **Run**.
3. This creates the `profiles`, `likes`, and `messages` tables with the
   correct security rules already set up.

### Step 3: Restrict signups to Thapar emails (optional but recommended)
1. In Supabase, go to **Authentication -> Sign In / Providers -> Email**.
2. There's also a code-level check already built in (`signup/page.js` blocks
   any email that doesn't end in `@thapar.edu`), so this is already partly
   handled. For a stronger guarantee, ask in Supabase's dashboard about
   restricting allowed email domains under Auth settings.
3. Also turn OFF "Confirm email" under Auth settings while testing, so you
   don't have to click email confirmation links every time (turn it back on
   before real launch).

### Step 4: Get your API keys (1 min)
1. In Supabase: **Project Settings -> API**.
2. Copy the **Project URL** and the **anon public key**.

### Step 5: Run the project locally (5 min)
```bash
# Inside the thapar-roomie folder:
npm install
cp .env.local.example .env.local
```
Open `.env.local` and paste in your Project URL and anon key:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
Then run:
```bash
npm run dev
```
Open http://localhost:3000 — you should see the landing page.

### Step 6: Test the flow
1. Sign up with a `@thapar.edu`-style email (use a real one you control, or
   temporarily edit the check in `signup/page.js` to test with any email).
2. Fill out your profile at `/profile`.
3. Create a second test account (use an incognito window) and fill its
   profile too.
4. Go to `/matches` on both accounts — you should see each other with a
   compatibility percentage.

This is your whole Day 1 goal: **signup -> profile -> see ranked matches.**

## Day 2 — Mutual likes + chat + deploy

### Step 7: Test mutual likes and chat
1. On account A, click "Like" on account B.
2. Switch to account B, you'll see "They liked you!" — click "Like" back.
3. Both accounts now see a green "Chat" button — click it and send messages.
   They should appear instantly on both screens (that's Supabase Realtime).

### Step 8: Deploy so real people can use it (15 min)
1. Push this project to a GitHub repo (create one on github.com, then
   `git init`, `git add .`, `git commit -m "init"`, `git remote add origin ...`,
   `git push`).
2. Go to https://vercel.com, sign in with GitHub, click "Add New Project",
   pick your repo.
3. Under "Environment Variables", add the same two variables from your
   `.env.local` file.
4. Click Deploy. In ~1 minute you'll get a live URL like
   `thapar-roomie.vercel.app` — share that with your batch.

### Step 9 (if time remains): polish
- Add a WhatsApp-share button once matched, so people can move off-app.
- Add simple form validation messages.
- Add a "report user" button (even just a mailto: link) for safety.

## Project structure
```
app/
  page.js              -> landing page
  signup/page.js       -> signup (Thapar email check)
  login/page.js        -> login
  profile/page.js      -> create/edit compatibility profile
  matches/page.js       -> ranked matches + like button
  chat/[matchId]/page.js -> realtime 1:1 chat
lib/
  supabaseClient.js    -> Supabase connection
  matching.js          -> compatibility scoring formula (edit weights here)
sql/
  schema.sql           -> run this once in Supabase SQL editor
```

## Tuning the matching algorithm
Open `lib/matching.js`. The scoring is a simple weighted formula — increase
a number to make that trait matter more, e.g. raise the cleanliness weight
if that's the #1 complaint students have about roommates.

## Common issues
- **"supabaseUrl is required" error** -> you forgot to create `.env.local`
  or didn't restart `npm run dev` after adding it.
- **Matches page is empty** -> you need at least 2 profiles saved to see
  anyone besides yourself.
- **Chat messages not appearing live** -> double check the last line of
  `schema.sql` ran successfully (`alter publication supabase_realtime add
  table messages;`) — this enables realtime on that table.
