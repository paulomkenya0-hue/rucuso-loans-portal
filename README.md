# RUCUSO — Ministry of Loans and Sponsorship, Student Portal

A mobile-first web app for Ruaha Catholic University's RUCU Students Organization
(RUCUSO) to collect HESLB-loan information from students who do not currently
have a loan, for the 2026/2027 academic year.

This guide assumes **no prior coding experience**. Follow the steps in order.

---

## What this app does

- Student signs in with Google (one submission per Google account — enforced
  in the database, not just in the app).
- Student reads the official announcement, fills a short form, reviews it,
  accepts a declaration, and submits.
- A visible deadline (17 Aug 2026, 12:00 PM, Tanzania time) is enforced on the
  **server**, so submissions are blocked after the deadline even if a
  student's phone clock is wrong.
- Admins sign in with an allow-listed Google account and can search, filter,
  sort, view, and export all submissions to Excel/CSV — and can edit the
  deadline, leader contacts, and announcement text without touching code.

---

## Part 1 — Create your Supabase project (the database)

1. Go to https://supabase.com and create a free account.
2. Click **New Project**. Choose a name (e.g. `rucuso-loans-portal`), set a
   database password (save it somewhere safe), and pick a region close to
   Tanzania (e.g. `eu-central` or `af-south`).
3. Wait ~2 minutes for the project to finish setting up.
4. In the left sidebar, open **SQL Editor** → **New query**.
5. Open the file `supabase/migrations/0001_init.sql` from this project,
   copy its entire contents, paste it into the SQL editor, and click **Run**.
   This creates all tables, security rules, and the deadline-enforcement
   function.
6. **Add yourself as an admin.** In the same SQL editor, run (replace with
   your real Gmail address):
   ```sql
   insert into admins (email) values ('your-admin-email@gmail.com');
   ```
   You can add more admins later the same way.

---

## Part 2 — Configure Google Sign-In

1. In Supabase, go to **Authentication → Providers → Google** and toggle it on.
2. You need a Google OAuth Client ID/Secret from Google Cloud Console:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create a project (or use an existing one).
   - Click **Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Under **Authorized redirect URIs**, add the callback URL shown on the
     Supabase Google provider screen (it looks like
     `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`).
   - Click **Create**. Copy the **Client ID** and **Client Secret**.
3. Paste the Client ID and Client Secret into the Supabase Google provider
   screen and click **Save**.
4. In Supabase, go to **Authentication → URL Configuration**:
   - **Site URL**: your deployed website URL (you'll get this in Part 5 —
     you can come back and update this after deploying).
   - **Redirect URLs**: add your deployed site URL and
     `http://localhost:5173` (for local testing).

---

## Part 3 — Get your Supabase API keys

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. **Never copy the `service_role` key into this app.** It must stay secret
   and is not used anywhere in this project.

---

## Part 4 — Run the website on your own computer (optional but recommended)

You'll need [Node.js](https://nodejs.org) (the LTS version) installed.

1. Unzip this project folder and open a terminal inside it.
2. Copy `.env.example` to a new file named `.env`:
   ```
   cp .env.example .env
   ```
3. Open `.env` in a text editor and paste in your Supabase **Project URL**
   and **anon public** key from Part 3.
4. Install dependencies:
   ```
   npm install
   ```
5. Start the site locally:
   ```
   npm run dev
   ```
6. Open the address shown in the terminal (usually `http://localhost:5173`).

---

## Part 5 — Deploy the website (Vercel — free)

1. Create a free account at https://vercel.com (you can sign up with GitHub).
2. Push this project to a GitHub repository (create a new repo, upload the
   project folder, or use `git push` if you're familiar with Git).
3. In Vercel, click **Add New → Project**, and import your GitHub repository.
4. Vercel will detect it's a Vite project automatically. Before deploying,
   open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
5. Click **Deploy**. After a minute you'll get a public URL like
   `https://rucuso-loans-portal.vercel.app` — this is your website link.
6. Go back to Supabase **Authentication → URL Configuration** and set the
   **Site URL** and **Redirect URLs** to this real Vercel URL (you can keep
   `http://localhost:5173` in the redirect list too, for local testing).

*(Netlify works the same way: import the repo, set the same two environment
variables, and use build command `npm run build` with publish directory
`dist`.)*

---

## Part 6 — Access the admin dashboard

- Go to `https://your-site-url/admin`.
- Sign in with a Google account you added to the `admins` table in Part 1.
- You'll see **Submissions** (search, filter, sort, view details, export)
  and **Settings** (deadline, leader contacts, announcement text).

If a Google account that is *not* in the `admins` table tries `/admin`, it
will see "not authorized" and cannot view student data.

---

## Part 7 — Export to Excel / CSV

On the admin **Submissions** tab:
- Click **Export to Excel** to download an `.xlsx` file with all currently
  filtered/searched submissions.
- Click **Export to CSV** for a plain CSV file.
- Clear the search box first if you want to export *all* submissions.

---

## Part 8 — Change the deadline

1. Go to `/admin` → **Settings** tab.
2. Update the **Deadline** field (shown in your browser's local time) and
   click **Save Changes**.
3. This updates the deadline everywhere immediately — including the backend
   rule that blocks submissions after the deadline. No code changes needed.

## Part 9 — Change leader names, phone numbers, or the announcement

Same **Settings** tab — edit any field and click **Save Changes**. These
values are pulled live into the header, announcement, and contact sections
of the student-facing site.

## Part 10 — Add the official university logo

1. In Supabase, go to **Storage** and create a new public bucket (e.g. `logo`).
2. Upload the official RUCU logo image there and copy its public URL.
3. In the SQL editor, run:
   ```sql
   update app_config set logo_url = 'PASTE-PUBLIC-URL-HERE' where id = true;
   ```
4. The logo will now appear in the header automatically.

---

## Security notes

- The Google account ID is enforced as a **unique** database constraint —
  duplicate submissions are rejected by the database itself, not just by the
  app's interface.
- The deadline check runs inside a Postgres function on the server, so
  changing your phone's clock cannot bypass it.
- Row Level Security ensures a student can only ever read their **own**
  submission — never another student's — and only admins (allow-listed by
  email in the `admins` table) can read every record.
- No secret keys are stored in the frontend code; only the public "anon" key
  is used, and it is restricted by the RLS rules above.

## What was tested

Sign-in with a new Google account, filling and validating the form, review
and edit-before-submit, the required declaration checkbox, successful
storage in the database, blocking a second submission from the same Google
account, allowing a different Google account to submit independently, admin
viewing/searching/exporting submissions, non-admins being denied `/admin`,
and deadline enforcement after 17/08/2026 12:00 PM (Tanzania time) all match
the behavior described above. Please re-verify these in your own deployed
environment before sharing the link with students, since final behavior also
depends on your specific Supabase/Google OAuth configuration.
