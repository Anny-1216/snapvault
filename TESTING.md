# Testing Guide — Local & Vercel Preview

## 🏠 LOCAL TESTING

### Option 1: Demo Mode (No Auth Required - Fastest)

```bash
cd /home/chaitanya/Desktop/snapvault
python3 -m http.server 8080 --directory public
```

Then open: **`http://localhost:8080/?demo=1`**

✅ Tests:
- UI/layout
- Camera functionality
- Photo/video capture
- Folder creation
- Upload queue
- Gallery view

❌ Does NOT test:
- OAuth login
- Real Drive upload
- Token refresh

---

### Option 2: Local with Real OAuth (Full Testing)

#### Step 1: Create localhost OAuth credentials

**Google Drive:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Your existing project → **APIs & Services → Credentials**
3. Edit your OAuth credential → Add authorized redirect URI:
   - `http://localhost:8080`
   - `http://localhost:3000` 
   - `http://127.0.0.1:8080`
4. Save

**OneDrive:**
1. [Azure Portal](https://portal.azure.com) → **App registrations**
2. Your app → **Authentication**
3. Add redirect URI: `http://localhost:8080`
4. Save

#### Step 2: Create `.env.local`

```bash
cat > /home/chaitanya/Desktop/snapvault/.env.local << 'EOF'
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY

GDRIVE_CLIENT_ID=YOUR_LOCAL_GDRIVE_CLIENT_ID
GDRIVE_CLIENT_SECRET=YOUR_LOCAL_SECRET

ONEDRIVE_CLIENT_ID=YOUR_LOCAL_ONEDRIVE_CLIENT_ID
ONEDRIVE_CLIENT_SECRET=YOUR_LOCAL_SECRET

REDIRECT_URI=http://localhost:8080
EOF
```

#### Step 3: Start local API server

```bash
# You need Node.js for backend
node --loader tsx api/config.js
```

Or use a simpler approach with Python:

```bash
# Terminal 1: Start frontend
python3 -m http.server 8080 --directory public

# Terminal 2: Start a simple backend proxy
# (We'll create a simple test proxy below)
```

#### Step 4: Test OAuth flow locally

Open: **`http://localhost:8080`** (without ?demo=1)

Then:
1. Click "Create Account" → sign up
2. Choose storage → "Google Drive"
3. Click "Sign in with Google"
4. Grant access
5. Verify redirect works and tokens are stored
6. Create a folder
7. Take a photo → upload
8. Log out
9. Log back in → **folders should still exist** ✅

---

## ☁️ VERCEL PREVIEW (Safer Testing Before Main)

### Option A: Deploy Preview (Recommended)

```bash
# Create a feature branch
git checkout -b feature/oauth-v2

# Push to GitHub
git add .
git commit -m "Add PKCE OAuth + persistent folders"
git push origin feature/oauth-v2

# Go to GitHub → Your repo → Create Pull Request
# Or Vercel auto-detects and creates preview deployment
```

Then Vercel creates a **preview URL**: `https://snapvault.vercel.app` (or your custom preview URL)

✅ Benefits:
- Full production environment
- Real OAuth providers work (if redirect URIs are set)
- Can test from phone
- Main branch untouched

**Set Preview Environment Variables:**
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
GDRIVE_CLIENT_ID=...
GDRIVE_CLIENT_SECRET=...
ONEDRIVE_CLIENT_ID=...
ONEDRIVE_CLIENT_SECRET=...
REDIRECT_URI=https://snapvault-pr-1.vercel.app  (preview URL)
```

### Option B: Staging Deployment

```bash
# Keep main clean, deploy to staging
git checkout -b staging

git add .
git commit -m "Pre-release: PKCE OAuth + persistent folders"
git push origin staging
```

In Vercel dashboard:
1. **Settings → Git**
2. Add production branch: `main`
3. Add staging branch: `staging`

Now:
- `staging` branch → `https://snapvault-staging.vercel.app`
- `main` branch → `https://yourapp.vercel.app`

---

## 🧪 FULL TESTING CHECKLIST

### 1. Demo Mode ✅
```bash
python3 -m http.server 8080 --directory public
# Open: http://localhost:8080/?demo=1
```

- [ ] App loads
- [ ] Camera works
- [ ] Can take photo/video
- [ ] Can create folders
- [ ] Can upload to queue
- [ ] Gallery shows images
- [ ] Can log out (clears data)

---

### 2. Local OAuth Flow ✅
```bash
# Prerequisites:
# - Updated .env.local with localhost URIs
# - Updated OAuth apps with http://localhost:8080

python3 -m http.server 8080 --directory public
```

- [ ] Sign up page loads
- [ ] Can create Supabase account
- [ ] Storage picker shows
- [ ] Google Drive sign-in redirects
- [ ] After auth, app loads
- [ ] Can create folder → saved to DB
- [ ] Can capture photo
- [ ] Can upload to Google Drive
- [ ] Log out → back to login
- [ ] Log in again → **folders still there** ✅
- [ ] Upload window (1+ hour later) → token refresh works

---

### 3. Vercel Preview ✅

```bash
git push origin feature/oauth-v2
# Wait for preview deployment
# Vercel sends link in PR
```

- [ ] Preview URL loads
- [ ] Sign up works
- [ ] OAuth redirects correctly
- [ ] Can create folders
- [ ] Folders persist across sessions
- [ ] Files upload to Google Drive
- [ ] Demo mode still works with `?demo=1`
- [ ] Check [Vercel Analytics](https://vercel.com) for errors

---

### 4. Before Merging to Main

```bash
# Check git status
git status

# Review changes
git diff main feature/oauth-v2

# Create pull request with testing notes
```

- [ ] All preview tests pass
- [ ] No console errors
- [ ] Network requests to /api/config work
- [ ] Tokens stored in localStorage (refresh tokens)
- [ ] No 401 errors during upload
- [ ] Database queries work (folders table)

---

## 🔍 DEBUGGING

### Check Browser Console for Errors

**Chrome DevTools:**
```
Right-click → Inspect → Console tab
```

Look for:
- ❌ OAuth errors
- ❌ Network 401 errors
- ❌ Database query errors
- ✅ Should see: "OAuth exchange failed: ..." (if testing without real credentials)

### Check Network Tab

**Chrome DevTools → Network tab**

Requests you should see:
- `GET /api/config` → Returns config (no secrets)
- `POST /api/config` → Token exchange (check response)
- `https://www.googleapis.com/...` → Google Drive API calls
- `https://graph.microsoft.com/...` → Microsoft Graph API calls

### Check Supabase Database

1. [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. **SQL Editor** → Write query:

```sql
-- Check users table
SELECT id, email, storage_provider, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check folders
SELECT user_id, name, storage_provider, created_at 
FROM folders 
ORDER BY created_at DESC 
LIMIT 20;
```

Should see:
- Your test user in `users` table
- Your test folders in `folders` table

---

## 📱 PHONE TESTING (Optional)

Test on actual phone with ngrok tunnel:

```bash
# Terminal 1: Start local server
python3 -m http.server 8080 --directory public

# Terminal 2: Tunnel with ngrok
brew install ngrok  # or: apt install ngrok
ngrok http 8080
# Shows: https://abc123.ngrok.io
```

Then:
1. Update OAuth apps with: `https://abc123.ngrok.io`
2. Update `.env.local` with: `REDIRECT_URI=https://abc123.ngrok.io`
3. Open **`https://abc123.ngrok.io`** on your phone
4. Test full flow (capture, upload, folder persistence)

---

## ⚡ QUICK TEST FLOW (5 mins)

```bash
# 1. Start local demo
python3 -m http.server 8080 --directory public &

# 2. Open demo mode
open http://localhost:8080/?demo=1

# 3. Test UI
# - Take photo/video
# - Create folder "Test_Folder"
# - Click "Save & Upload"
# - Should see upload queue
# - Check gallery shows images

# 4. Test folder persistence (localStorage)
# Open browser console:
JSON.parse(localStorage.getItem('sv_q'))  // see queue
JSON.parse(localStorage.getItem('sv_st')) // see storage

# 5. Kill server
pkill -f "http.server"

echo "✅ Demo works! Ready for OAuth testing"
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before `git push origin main`:

- [ ] Local demo mode works ✅
- [ ] Vercel preview deploys ✅
- [ ] OAuth redirect works ✅
- [ ] Can create account + folders ✅
- [ ] Folders persist after logout ✅
- [ ] Files upload to Google Drive/OneDrive ✅
- [ ] No console errors ✅
- [ ] `/api/config` returns expected values ✅
- [ ] Database queries work ✅
- [ ] No 401 errors ✅

Then:
```bash
git push origin main
```

Monitor [Vercel Deployments](https://vercel.com/dashboard) to ensure production deploy succeeds.

