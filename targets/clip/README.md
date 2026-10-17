# Ikausa App Clip

The clip runs the normal app bundle (`exportJs: true`), so an invite link opens
`/join/<code>` and guests can join and shoot without installing Ikausa.

## Turning it on

1. Pick the invite domain and set it in `.env`:
   `EXPO_PUBLIC_INVITE_BASE_URL=https://your-domain`
   This makes invite links use the domain and adds `applinks:` (app),
   `appclips:` (clip) and Android App Links for it at prebuild.
2. Set `ios.appleTeamId` in `app.json`.
3. Replace `YOUR_TEAM_ID` in `public/.well-known/apple-app-site-association`
   and the fingerprint in `public/.well-known/assetlinks.json` (Play Console →
   App integrity → App signing key SHA-256). Host both at
   `https://your-domain/.well-known/` with `Content-Type: application/json`.
4. `npx expo prebuild -p ios --clean`, then open Xcode and check signing on
   both the app and `clip` targets (codesigning isn't fully automatic yet).
5. In App Store Connect, add an App Clip experience for
   `https://your-domain/join/` once the build is uploaded.

## Gotchas

- Build numbers must match between the app and the clip.
- Don't install `expo-updates`; it breaks the clip build.
- Test real launches from TestFlight; local launch testing is unreliable.
- Size: Apple allows 15 MB for clips opened from QR codes and NFC. The clip
  links every native module the app uses (Skia, camera, purchases…), so check
  the size in Xcode's App Thinning report before relying on QR invites.
