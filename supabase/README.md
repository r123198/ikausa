# Supabase setup

Everything here can be done from the Supabase dashboard, no CLI needed.

## 1. Database

Run each file in `migrations/` once, in filename order, in **SQL Editor → New query**:

1. `20261013000000_init.sql`: tables, access rules, storage bucket
2. `20261013000001_backfill_profiles.sql`: profiles for accounts created before step 1
3. `20261013000002_event_previews.sql`: album previews on Home
4. `20261013000003_passes_and_hardening.sql`: paid passes, upload reservations, export window, join limits
5. `20261013000004_photo_originals.sql`: keeps the untouched original next to each film-developed photo
6. `20261013000005_profile_and_account.sql`: profile photos and self-service account deletion
7. `20261014000000_shot_tiers_and_top_ups.sql`: plans priced by guests × shots, and shot packs bought during a roll
8. `20261017000000_delete_event.sql`: hosts can delete a roll
9. `20261103000000_studio.sql`: Studio organizers, manually granted credits, co-hosts and host links
10. `20261104000000_oauth_profile_names.sql`: profile names for Google sign-ups
11. `20261104000001_cohost_spots.sql`: co-hosts don't count against the participant cap
12. `20261104000002_private_functions.sql`: moves privileged functions out of the API schema, behind thin wrappers
13. `20261104000003_performance_indexes.sql`: indexes every foreign key and gives `join_attempts` a primary key
14. `20261104000004_restore_wrappers.sql`: repairs two wrappers if step 11 ran after step 12
15. `20261104000005_my_events_lookup.sql`: makes loading a person's rolls independent of the total number of rolls

## 1a. First Studio admin

Organizers join through an invite from an admin, so the first admin has to be added by hand. They need to have signed in once. Run this in **SQL Editor**:

```sql
insert into public.organizers (user_id, is_admin)
select id, true from auth.users where email = 'you@example.com'
on conflict (user_id) do update set is_admin = true;
```

## 1b. Google sign-in

The app signs in with Google through Supabase Auth (no Google SDK in the app).

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) create an OAuth client of type
   **Web application**. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
   Fill in the OAuth consent screen (app name, support email, logo) or Google shows an "unverified app" warning.
2. In Supabase **Authentication → Providers → Google**, turn it on and paste the client ID and secret.
3. In **Authentication → URL Configuration → Redirect URLs** add every place the app can be sent back to:
   - `ikausa://auth/callback` (the phone app)
   - `https://<web-domain>/auth/callback` (the web app)
   - `http://localhost:8081/auth/callback` (local web dev)
4. Migration `20261104000000_oauth_profile_names.sql` names Google accounts from their Google profile instead of "Member".

Apple requires **Sign in with Apple** on iOS whenever another third-party login is offered; add it before submitting.

## 2. Edge Functions

In **Edge Functions → Deploy a new function → Via editor**, create two functions and paste the matching `index.ts`:

| Function | Source | Verify JWT |
|---|---|---|
| `revenuecat-webhook` | `functions/revenuecat-webhook/index.ts` | **Off** (RevenueCat doesn't send a Supabase token; the function checks its own secret) |
| `purge-expired` | `functions/purge-expired/index.ts` | Off (checks `x-cron-secret`) |

Then in **Edge Functions → Secrets** add:

- `REVENUECAT_WEBHOOK_SECRET`: a long random string, e.g. `Bearer <random>`
- `CRON_SECRET`: another long random string

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.

## 3. Scheduled cleanup

In **Integrations → Cron → Create job**, run every hour:

- Type: Supabase Edge Function → `purge-expired`, method `POST`
- Header: `x-cron-secret: <CRON_SECRET>`

It deletes photos 7 days after a roll's export window closes, and uploads that were reserved but never finished.

## 4. RevenueCat (paid passes and shot packs)

1. In App Store Connect and Google Play Console, create these **consumable** in-app products:
   - Roll plans (guests × shots per person):

     | Product | Guests | Shots each |
     |---|---|---|
     | `ikausa_pass_party_36` | 25 | 36 |
     | `ikausa_pass_party` | 25 | unlimited |
     | `ikausa_pass_big_day_36` | 100 | 36 |
     | `ikausa_pass_big_day` | 100 | unlimited |
     | `ikausa_pass_unlimited_36` | unlimited | 36 |
     | `ikausa_pass_unlimited` | unlimited | unlimited |

   - Shot packs, bought by any member when they run out: `ikausa_shots_10`, `ikausa_shots_24`.

   Ids must match `passes.revenuecat_product_id` / `shot_packs.revenuecat_product_id`; edit the tables
   to change the catalog. Keep `passes.sort` in price order: the app picks the first plan that covers
   the guests and shots the host chose. `display_price` is only a fallback label for when store prices
   can't load.
2. Add the products to your RevenueCat project. No entitlements or offerings needed: passes and packs are credits, not access levels.
3. **Integrations → Webhooks** in RevenueCat:
   - URL: `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization header value: exactly your `REVENUECAT_WEBHOOK_SECRET`
4. Put the public SDK keys in the app's `.env`:
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
   Paid plans show "Buy passes in the mobile app" until these are set, and on web.

Purchases need a development build (`npx expo run:ios` / `run:android`); Expo Go only runs RevenueCat in preview mode.

### How a purchase becomes a roll

1. The app buys the product (RevenueCat user id = Supabase user id).
2. RevenueCat sends `NON_RENEWING_PURCHASE` to the webhook, which adds a row to `pass_credits`.
3. The app waits for that credit, then creates the roll. The database spends the credit and enforces the plan's limits.
4. A refund arrives as `CANCELLATION` and revokes the credit if it hasn't been used yet.

### How a shot pack adds shots

1. A member who is out of shots taps **Get more shots** on the camera and buys a pack.
2. The webhook adds a row to `shot_pack_credits`.
3. The app calls `apply_shot_pack(event, pack)`, which ties the credit to that roll. The member's limit
   becomes the roll's shots per person plus their applied packs. A pack bought but not applied (for
   example if the app closed) shows as "owned" next time and can be used on any live roll.
4. A refunded pack stops counting toward the limit; shots already taken stay.
