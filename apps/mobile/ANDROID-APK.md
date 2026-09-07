# Build the bb Android APK (EAS) and link it to your local machine

This sets up a GitHub Actions workflow that builds an installable **Android APK**
of the bb mobile app on **EAS** (Expo's cloud), then hands you the `.apk` as a
build artifact. The app is a native shell around the bb web UI; it reaches the
bb server on **your own machine** over the encrypted **bb connect** tunnel.

There is no Android build upstream (iOS ships via `mobile-ios-eas.yml`; Android
signing was "still open"). This workflow — `.github/workflows/mobile-android-eas.yml`
— is that missing path.

---

## 1. One-time Expo setup (free)

Your EAS project is **already wired** into `apps/mobile/app.json`
(`extra.eas.projectId` = `a2ec690a-3cef-4cbb-bb2f-3aa828f27de1`; the upstream
`bb-team` owner was removed so EAS resolves ownership from your token). You only
need an access token:

1. Sign in at <https://expo.dev> with the account that owns project
   `a2ec690a-…`.
2. Create an access token: **Account settings → Access tokens**.

EAS **auto-generates and stores an Android keystore** on the first
non-interactive build — no local Android SDK, JDK, or Apple account needed. Run
`pnpm exec eas credentials -p android` later to export or rotate it.

## 2. Configure the GitHub repo

After you push this repo to your own GitHub repo, add:

| Kind | Name | Value |
| --- | --- | --- |
| **Secret** | `EXPO_TOKEN` | the Expo access token from step 1 (**required**) |
| **Secret** | `GOOGLE_SERVICES_JSON` | *optional* — the contents of your `google-services.json` (needed for **push notifications**, see §5) |
| **Variable** | `EAS_PROJECT_ID` | *optional* — override the committed project id (for a fork) |
| **Variable** | `EXPO_OWNER` | *optional* — Expo account/username, only if EAS needs it disambiguated |

Settings → Secrets and variables → Actions → *Secrets* / *Variables*.
(`gh secret set EXPO_TOKEN --repo <you>/<repo>`.)

## 3. Build the APK

- **Manually:** Actions → **Mobile Android (EAS)** → *Run workflow* (profile
  `preview` → APK), or `gh workflow run "Mobile Android (EAS)"`.
- **On a tag:** push a tag matching `android-v*` (e.g. `android-v0.39.0`).

The job starts the EAS build, waits (~15–25 min once it leaves the queue),
downloads the APK, and uploads it as the **`bb-android-apk-<version>`** artifact.
The run summary links the expo.dev build page (which also hosts the `.apk`).

Install it: download the artifact, unzip, `adb install bb-android.apk`, or open
the expo.dev build page on the phone and tap Install (allow "install unknown
apps").

## 4. The secure link — bb connect to your local machine

The APK carries no server URL. You pair it once with the bb instance on your
machine; traffic then flows over the authenticated, TLS **bb connect** tunnel
via `getbb.app`, so it works from any network.

On your machine:

1. Sign in to bb connect (getbb.app account) and enable the early-access
   experiment: `bb settings experiment mobileApp true`.
2. Start bb (`npx bb-app@latest`, or your dev instance).
3. Mint a pairing code: `bb connect machine-code` — or in the app,
   **Settings → Remote access → Add mobile device** (shows a QR).

On the phone:

4. Open the bb app → **Add server → Connect with bb connect**.
5. Scan the QR (or type the code). The phone stores an account-scoped device
   credential and opens `https://<handle>.getbb.app`, relayed over the tunnel to
   your machine. One pairing covers every server on your account.

Revoke a device any time in the getbb.app dashboard under **Machines**.

> **Alternatives** (no getbb.app): a **Direct URL** profile to a Tailscale Serve
> HTTPS URL (`tailscale serve --bg --https=443 http://127.0.0.1:38886`) — private
> and WireGuard-encrypted — or, on trusted Wi-Fi only, `http://<lan-ip>:38886`
> with `BB_SERVER_BIND_HOST=0.0.0.0` (unencrypted).

## 5. Push notifications (optional, needs Firebase)

Toggling on notifications (in the app: **Settings → Notifications**) makes the
phone fetch an Expo push token. On Android that token comes from **Firebase
Cloud Messaging (FCM)**, so the APK must be built with a Firebase config. A
build without it registers the toggle but the token fetch fails with a
Firebase/"Google Services" error (e.g. `FirebaseApp is not initialized` or
`No Firebase App '[DEFAULT]'`).

One-time setup:

1. **Firebase project:** at <https://console.firebase.google.com>, create (or
   reuse) a project and **add an Android app** with the package name
   `app.getbb.mobile` (the `android.package` in `apps/mobile/app.json`).
2. **Config file:** download the app's **`google-services.json`** and add its
   **contents** as the repo secret `GOOGLE_SERVICES_JSON` (Settings → Secrets
   and variables → Actions). The workflow writes it to `apps/mobile/` before
   the EAS build, and Expo's build copies it into the app. (Committing the file
   to the repo instead works too — it holds a client identifier, not a secret.)
3. **FCM v1 credentials on Expo:** in the Firebase console go to **Project
   settings → Service accounts → Generate new private key** (this service
   account needs the *Firebase Cloud Messaging API Admin* role). Upload that
   JSON to the EAS project with `pnpm exec eas credentials -p android`
   (choose *push notifications*, FCM **V1**) or on the expo.dev project page.
   Without it the phone gets a token but Expo's servers cannot deliver the
   push.
4. **Rebuild** the APK (§3) — existing installs update in place.

The bb server side needs nothing extra: the `push-notifications` plugin ships
built-in and running (`bb push-notifications status`). Test end-to-end with
`bb push-notifications test`.

> Push registration requires a **secure** profile: bb connect (getbb.app) or
> any HTTPS direct URL. Plain-HTTP direct profiles on non-loopback hosts show
> "Push needs HTTPS or bb connect" by design.

## Caveats

- **First build is slow / provisions the keystore.** Later builds reuse it.
- **`production` profile emits an AAB** (for Play Store), not an APK. Use
  `preview` for a direct-install APK (this repo pins `buildType: apk` on it).
- **Android app-link auto-verify** (tapping a `https://<handle>.getbb.app/...`
  link opens the app) needs your APK's signing SHA-256 in the `assetlinks.json`
  that `getbb.app` serves. Until then the `bb://` scheme and in-app navigation
  still work; only deep-link auto-open is affected.
- **EAS minutes:** cloud builds use your Expo plan's build quota.
- **Slug mismatch (rare):** `eas build` resolves the project from `projectId`, so
  the committed `slug: bb-app` is fine. If EAS ever complains the slug does not
  match your project, set `expo.slug` in `app.json` to your project's slug.
