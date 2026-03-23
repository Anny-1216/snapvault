# Changes Summary

## ✅ Issue 1: Persistent Folders Across Sessions

**Before:** Folders were stored in localStorage and deleted on logout  
**After:** Folders stored in Supabase `folders` table with RLS policies

**What changed:**
- Created `users` and `folders` Supabase tables
- `createFolder()` now saves to database
- `loadFolders()` queries database on app start
- Folders persist even after user logs out and comes back later

**Files changed:**
- `api/config.js` — Added Supabase service client
- `public/index.html` — Updated `loadFolders()`, `createFolder()`
- `supabase-setup.sql` — SQL schema creation

---

## ✅ Issue 2: OAuth Token Expiry ("Invalid Authentication Credentials")

**Before:** Used OAuth implicit flow → tokens expire in 1 hour → upload fails  
**After:** Authorization Code + PKCE flow → refresh tokens last indefinitely

**What changed:**
- Replaced old implicit token flow with Authorization Code flow
- Added PKCE (Proof Key for Code Exchange) for security
- Tokens stored securely server-side in Supabase
- Automatic token refresh when expired (no user action needed)

**How it works:**
```
1. User clicks "Sign in with Google"
2. Frontend generates PKCE challenge + state
3. Redirects to Google OAuth
4. Google sends back authorization code
5. Backend exchanges code for access + refresh tokens
6. Backend stores refresh token in Supabase `users` table
7. Frontend gets tokens, can upload indefinitely
8. If token expires → auto-refresh using refresh_token
```

**New functions added:**
- `generatePKCEChallenge()` — Creates PKCE parameters
- `handleOAuthRedirect()` — Handles OAuth callback
- `refreshAccessToken()` — Auto-refresh when expired

**Files changed:**
- `api/config.js` — Added token exchange endpoints
- `public/index.html` — Rewrote OAuth flow with PKCE
- `.env.example` — Added required env variables

---

## ✅ Issue 3: Removed Supabase Upload Storage

**Before:** Files uploaded to Supabase Storage bucket  
**After:** Files upload directly to Google Drive / OneDrive

**What changed:**
- Removed Supabase storage upload code
- `uploadBlob()` now only supports demo/gdrive/onedrive
- Supabase is now ONLY used for:
  - User authentication
  - Folder metadata storage (persistence)
  - Refresh token storage

**New functions added:**
- `loadGalleryGDrive()` — Loads files from Google Drive
- `loadGalleryOneDrive()` — Loads files from OneDrive
- `gdGetFolderId()` — Helper to find Google Drive folder
- `ensureOneDriveFolder()` — Helper to create OneDrive folders

**Files changed:**
- `public/index.html` — Rewrote `loadGallery()`, `uploadGDrive()`, `uploadOneDrive()`
- Removed Supabase storage references

---

## Files Modified

1. **api/config.js** (Complete rewrite)
   - Old: Only returned config values
   - New: Handles OAuth token exchange + refresh

2. **public/index.html** (Major updates)
   - OAuth flow: Implicit → Authorization Code + PKCE
   - Storage: Supabase → Google Drive / OneDrive
   - Folders: localStorage → Supabase database

3. **README.md** (Simplified)
   - Removed Supabase storage setup steps
   - Added quick links to SETUP guide

## Files Created

1. **SETUP.md** — Complete deployment guide
2. **supabase-setup.sql** — Database schema

3. **.env.example** — Environment variables template

---

## Environment Variables Required

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY         ⚠️ SECRET - server only

GDRIVE_CLIENT_ID
GDRIVE_CLIENT_SECRET         ⚠️ SECRET - server only

ONEDRIVE_CLIENT_ID
ONEDRIVE_CLIENT_SECRET       ⚠️ SECRET - server only

REDIRECT_URI                 (your Vercel domain)
```

---

## Next Steps for Deployment

1. Run **supabase-setup.sql** in your Supabase project
2. Get OAuth credentials from Google Cloud + Azure
3. Add all env variables to Vercel
4. Redeploy (`git push`)
5. Test OAuth flow: should now handle token refresh automatically

---

## Breaking Changes

❌ Users must **re-authenticate** with new OAuth flow  
❌ Old localStorage folders will be replaced with database folders  
❌ Supabase storage is no longer used

---

## Testing Checklist

- [ ] OAuth redirect works (returns auth code)
- [ ] Token exchange succeeds (stores refresh token in DB)
- [ ] Folders persist after logout + login
- [ ] Files upload to Google Drive/OneDrive correctly  
- [ ] Token refresh works (can upload after 1+ hour)
- [ ] Demo mode still works with `?demo=1`

