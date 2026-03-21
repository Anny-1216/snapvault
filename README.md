# SnapVault — Deploy to Vercel

## Project Structure
```
snapvault/
├── public/
│   └── index.html       ← the entire PWA
├── api/
│   └── config.js        ← serverless function (serves keys safely)
├── vercel.json          ← routing config
└── README.md
```

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "SnapVault init"
gh repo create snapvault --public --push
# or manually push to your GitHub
```

---

## Step 2 — Deploy on Vercel (free)

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Click **Deploy** (no build settings needed)

---

## Local + Phone Testing (without API keys)

SnapVault has a **demo mode** for testing UI/camera flow before cloud setup.

### Run locally

```bash
cd snapvault
python3 -m http.server 8080 --directory public
```

Open: `http://localhost:8080`

For demo bypass mode (no keys/auth), use:

`http://localhost:8080/?demo=1`

### Test on phone using ngrok

```bash
ngrok http 8080
```

Open the generated `https://...ngrok-free.app` URL on your phone.

For demo bypass mode on phone, open:

`https://...ngrok-free.app/?demo=1`

### Demo mode controls

- Production default: demo mode is OFF.
- Temporary demo session: add `?demo=1` to URL.
- Separate demo build switch: set `DEMO_BUILD_ENABLED = true` in `public/index.html`.

---

## Step 3 — Add Environment Variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable Name         | Value                                 | Required?      |
|-----------------------|---------------------------------------|----------------|
| `SUPABASE_URL`        | https://xxxx.supabase.co             | If using Supa  |
| `SUPABASE_ANON_KEY`   | eyJhbGci...                          | If using Supa  |
| `GDRIVE_CLIENT_ID`    | xxxx.apps.googleusercontent.com      | If using GDrive|
| `ONEDRIVE_CLIENT_ID`  | xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | If using OD    |

> ⚠️ These NEVER appear in the HTML. They live on Vercel's server only.
> The frontend fetches them securely via /api/config at runtime.

Redeploy after adding env vars.

---

## Production checklist

- Keep `DEMO_BUILD_ENABLED = false` for production deploys.
- Keep all client IDs and Supabase values in Vercel env vars only.
- Verify `/api/config` returns expected values and no secrets beyond public client config.
- Confirm Supabase bucket and storage policies are configured before launch.

---

## Step 4 — Supabase Storage Setup

1. Go to your Supabase project → **Storage**
2. Create a bucket named exactly: `snapvault`
3. Set bucket to **Public** (so photos can be viewed via URL)
4. In **Storage → Policies**, add a policy:
   - For INSERT: `auth.uid() = (storage.foldername(name))[1]::uuid`
   - For SELECT: `true` (public read)

---

## Step 5 — Google Drive Setup (optional)

1. Go to https://console.cloud.google.com
2. Create a project → Enable **Google Drive API**
3. OAuth consent screen → External → Add your Vercel URL
4. Credentials → Create OAuth Client ID → Web application
5. Authorized JavaScript origins: `https://your-app.vercel.app`
6. Authorized redirect URIs: `https://your-app.vercel.app`
7. Copy Client ID → add as `GDRIVE_CLIENT_ID` in Vercel

---

## Step 6 — OneDrive Setup (optional)

1. Go to https://portal.azure.com → App registrations → New
2. Supported account types: **Any Azure AD directory + personal Microsoft**
3. Redirect URI: `https://your-app.vercel.app`
4. API permissions → Add → Microsoft Graph → `Files.ReadWrite`
5. Copy Application (client) ID → add as `ONEDRIVE_CLIENT_ID` in Vercel

---

## Step 7 — Install as PWA on Android

1. Open your Vercel URL in **Chrome on Android**
2. Tap the 3-dot menu → **Add to Home Screen**
3. Done — it works like a native app icon!

---

## How the security works

```
User's browser          Vercel serverless         Vercel env vars
─────────────────       ─────────────────         ─────────────────
fetch('/api/config') →  api/config.js reads  →   SUPABASE_URL
                        process.env and           SUPABASE_ANON_KEY
                        returns JSON              GDRIVE_CLIENT_ID
                                                  ONEDRIVE_CLIENT_ID
```

Keys never appear in index.html. The browser only receives them
at runtime from your own server — not hardcoded, not guessable.
