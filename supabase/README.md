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
