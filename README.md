# SnapVault — Secure Cloud Photo/Video Backup

Capture photos and videos on your phone, upload them to **Google Drive** or **OneDrive**. Folders persist across sessions. Built with PWA, OAuth 2.0 + PKCE, Supabase.

## Features
- 📷 Camera capture (photo/video)
- 💾 Auto-upload to Google Drive or OneDrive  
- 📁 Persistent folder management (survives logout)
- 🔐 Secure OAuth with refresh tokens
- 📱 Works offline (queue mode)

---

## Quick Start

### 1. Deploy to Vercel

```bash
git clone <your-repo>
cd snapvault
git push origin main
```

Then on **Vercel**:
1. Import your GitHub repo
2. Deploy (no build steps needed)
3. Go to [**SETUP.md** for full configuration](./SETUP.md)

---

## User Flow

1. **Create Account** — Email + password via Supabase
2. **Choose Storage** — Google Drive or OneDrive
3. **Authorize** — OAuth consent screen (grants folder access)
4. **Capture & Upload** — Photos/videos go to Drive automatically
5. **Folders Persist** — Even after logout, folders remain in your account

---

## For Developers

### Environment Variables (Vercel)
```
SUPABASE_URL=<your-project-url>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-key>
GDRIVE_CLIENT_ID=<client-id>
GDRIVE_CLIENT_SECRET=<secret>
ONEDRIVE_CLIENT_ID=<client-id>
ONEDRIVE_CLIENT_SECRET=<secret>
REDIRECT_URI=https://yourapp.vercel.app
```

⚠️ Secrets are **never exposed to frontend** — /api/config handles OAuth token exchange server-side.

### Local Testing
```bash
python3 -m http.server 8080 --directory public
```

Open `http://localhost:8080/?demo=1` for demo mode (no auth needed).

### Database Setup
See [SETUP.md](./SETUP.md) for Supabase table creation SQL.

---

## Architecture

```
Frontend (PWA) ←→ Vercel API (/api/config) ←→ OAuth Providers
                                            ↓
                                    Supabase (users, folders DB)
                      
                            Google Drive / OneDrive (file storage)
```

### What Changed (v2)
✅ **Authorization Code + PKCE** — No more token expiry errors  
✅ **Persistent Folders** — Stored in Supabase, not localStorage  
✅ **Drive-Only Upload** — Removed Supabase storage, uses Google Drive / OneDrive  
✅ **Token Refresh** — Automatic retry on token expiry  

---

## Project Structure
```
snapvault/
├── public/
│   ├── index.html       ← PWA (entire UI + JS)
│   ├── manifest.webmanifest
│   └── sw.js            ← Service worker (offline support)
├── api/
│   └── config.js        ← Serverless: OAuth token exchange
├── vercel.json          ← Routing config
├── .env.example         ← Environment variables template
├── SETUP.md             ← Full deployment guide
└── README.md
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Folders disappear on logout | ✅ Fixed — stored in database now |
| Upload fails with "invalid auth" | ✅ Fixed — automatic token refresh |
| OAuth redirect doesn't work | Check `REDIRECT_URI` matches your Vercel domain |

See [SETUP.md](./SETUP.md) for detailed troubleshooting.

---

## Security

- ✅ OAuth 2.0 + PKCE prevents authorization code interception
- ✅ Refresh tokens stored server-side in Supabase (not localStorage)
- ✅ Row-Level Security (RLS) enforces per-user data access
- ✅ No sensitive secrets exposed to frontend
- ✅ Uses browser APIs: Camera, Storage, File APIs

---

## License

MIT

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

## Step 3 — Complete Setup

**→ See [SETUP.md](./SETUP.md) for detailed OAuth configuration**

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
