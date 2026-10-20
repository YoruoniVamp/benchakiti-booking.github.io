# Shared database setup

The site is static, so GitHub Pages cannot run the database by itself. This project uses Supabase Postgres and Supabase Auth for shared accounts, court queues, equipment reservations, and staff status changes.

## 1. Create the database

Create a Supabase project, then run these files in order in the Supabase SQL Editor:

1. `supabase/migrations/001_park_database.sql`
2. `supabase/migrations/002_booking_operations.sql`

They create member profiles, courts, equipment, court bookings, equipment bookings, sample queues, role checks, and guarded booking functions. Court overlaps and duplicate equipment reservations are rejected by database constraints.

Passwords are managed by Supabase Auth and stored as password hashes. They are not returned to the browser and cannot be revealed in User administration. A manager can set a new password by entering it in the account editor.

## 2. Deploy the account function

The website uses the account function for registration and administrator account changes. Install the Supabase CLI as a development dependency, then link and deploy this project's function:

```sh
npm install --save-dev supabase
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy accounts
```

The function uses Supabase's server-side privileged key. Never put a secret/service-role key in the website or `backend-config.js`.

## 3. Connect the GitHub Pages site

In Supabase **Settings → API Keys**, copy the Project URL and the **publishable** key. Put them in `backend-config.js`:

```js
window.PARK_BACKEND_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabasePublishableKey: 'sb_publishable_...',
};
```

The publishable key is expected to be visible in the browser; database permissions and the guarded SQL functions enforce access. Do not use a secret key here. Commit and publish the updated site to GitHub Pages. The Supabase JavaScript client is loaded from a CDN, so no browser package installation is needed.

## 4. Create the first head account

1. Open the published site and register the username/password that should own the park.
2. In Supabase SQL Editor, promote that exact username once:

```sql
update public.profiles
set is_admin = true, is_head = true
where lower(username) = lower('YOUR_USERNAME');
```

3. Sign out and back in. That account can add members and grant administrator access. The website does not allow anyone to create another head account.

## Data notes

- When the Supabase settings are filled in, the site reads and writes shared database records. With blank settings it stays in local demo mode.
- Existing browser-only accounts, passwords, reservations, and staff overrides are not imported automatically. Create accounts again in the connected site; the SQL starts with the sample court schedule and equipment statuses.
- Theme and language choices remain local to each browser. Account roles, court queues, equipment bookings, equipment condition, court service status, and pickup times are shared.
