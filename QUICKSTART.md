# Quick Start Checklist

## 🎯 What to do next (in order)

### Phase 1: Database Setup (5 min)
- [ ] Go to [Supabase Dashboard](https://app.supabase.com)
- [ ] Open **SQL Editor**
- [ ] Copy & run the SQL from `supabase-setup.sql` in your project
- [ ] Verify tables are created: `users`, `folders`

### Phase 2: Get OAuth Credentials (15 min)

**Google Drive:**
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create new project or select existing
- [ ] Enable **Google Drive API**
- [ ] Create OAuth 2.0 credential (Desktop / Web application)
- [ ] Set authorized redirect URIs:
  - `https://yourapp.vercel.app` (production)
  - `http://localhost:8080` (local testing)
  - `https://yourngrokurl.ngrok-free.app` (phone testing)
- [ ] Copy **Client ID** and **Client Secret**

**OneDrive:**
- [ ] Go to [Azure Portal](https://portal.azure.com)
- [ ] Navigate to **App registrations** → **New registration**
- [ ] Set redirect URIs:
  - `https://yourapp.vercel.app` (production)
  - `http://localhost:3000/callback` (local)
- [ ] Create **Client Secret** (copy before leaving)
- [ ] Copy **Client ID**

### Phase 3: Add Environment Variables

**Supabase:**
- [ ] Copy your **Project URL** from Supabase Dashboard
- [ ] Copy **anon public key** (API Keys)
- [ ] Copy **service_role secret** key (API Keys) — ⚠️ KEEP SECRET

**Vercel:**
- [ ] Go to your [Vercel Project Settings](https://vercel.com/dashboard)
- [ ] → **Settings → Environment Variables**
- [ ] Add all 7 variables (see template below)
- [ ] Redeploy project

**Environment Variables Template:**
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJh...             ← SERVICE KEY (not anon)

GDRIVE_CLIENT_ID=xxxx.apps.googleusercontent.com
GDRIVE_CLIENT_SECRET=XXXXXX

ONEDRIVE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONEDRIVE_CLIENT_SECRET=XXXXXX

REDIRECT_URI=https://yourapp.vercel.app
```

### Phase 4: Test Locally (Optional)

```bash
# Terminal 1 - Start local server
python3 -m http.server 8080 --directory public

# Terminal 2 - Tunnel with ngrok (for phone or production OAuth testing)
ngrok http 8080
```

Then:
- [ ] Open `http://localhost:8080/?demo=1` — test UI in demo mode
- [ ] Remove `?demo=1` and test OAuth flow (will fail without env vars, that's ok)

### Phase 5: Deploy

```bash
git add .
git commit -m "SnapVault v2: PKCE OAuth + persistent folders + Google Drive/OneDrive"
git push origin main
```

- [ ] Vercel deploys automatically
- [ ] Check [Vercel Deployments](https://vercel.com/dashboard) for deployment status
- [ ] Visit your app URL and test OAuth login

---

## 🧪 Testing the Complete Flow

1. **Sign up** → Create account
2. **Choose storage** → Select "Google Drive" or "OneDrive"
3. **Authorize** → OAuth consent screen appears
4. **Grant access** → Approve folder access
5. **Create folder** → Add "Holiday" folder
6. **Capture photo** → Use camera to take photo
7. **Save & Upload** → Select folder, upload
8. **Log out** → Close app
9. **Log in again** → Folders should still exist ✅

---

## ❓ Troubleshooting

### OAuth redirect shows "error: invalid_redirect_uri"
→ Check your REDIRECT_URI matches the registered OAuth app

### "Folders disappear after logout"
→ This is now FIXED! They're stored in Supabase

### "Upload failed - invalid auth"
→ This is now FIXED! We use refresh tokens

### Can't find my credentials
→ See [SETUP.md](./SETUP.md#2-update-vercel-environment-variables) for detailed steps

---

## 📚 Full Documentation

- 🗂️ [SETUP.md](./SETUP.md) — Complete configuration guide
- 📝 [CHANGES.md](./CHANGES.md) — What changed in v2
- 🎯 [README.md](./README.md) — Project overview

