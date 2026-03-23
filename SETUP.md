# SnapVault — Setup Guide

## What Changed

### ✅ New Features
1. **Persistent Folders** — Folders now save to Supabase database and persist across sessions
2. **Fixed OAuth Token Issue** — Upgraded from implicit flow to **Authorization Code + PKCE** flow with refresh tokens
3. **Removed Supabase Storage** — Now using **Google Drive & OneDrive** exclusively for file uploads
4. **Token Refresh** — Automatic token refresh when tokens expire (no more "invalid auth" errors)

---

## Setup Instructions

### 1. Create Supabase Tables

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'supabase',
  gdrive_refresh_token TEXT,
  onedrive_refresh_token TEXT,
  gdrive_folder_id TEXT,
  onedrive_folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Folders table (persistent across sessions)
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_provider TEXT NOT NULL,
  provider_folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, storage_provider)
);

-- Index for fast lookups
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_provider ON folders(storage_provider);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. Update Vercel Environment Variables

Add these to **Vercel Settings → Environment Variables**:

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY

GDRIVE_CLIENT_ID=YOUR_GDRIVE_CLIENT_ID
GDRIVE_CLIENT_SECRET=YOUR_GDRIVE_CLIENT_SECRET

ONEDRIVE_CLIENT_ID=YOUR_ONEDRIVE_CLIENT_ID
ONEDRIVE_CLIENT_SECRET=YOUR_ONEDRIVE_CLIENT_SECRET

REDIRECT_URI=https://yourapp.vercel.app
```

---

### 3. Update OAuth Apps

#### Google Drive  
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create an OAuth 2.0 credential (Desktop app)
3. Add authorized redirect URI: `https://yourapp.vercel.app`
4. Copy **Client ID** and **Client Secret** → Vercel

#### OneDrive
1. Go to [Azure Portal](https://portal.azure.com)
2. Register an app, create a client secret
3. Add redirect URI: `https://yourapp.vercel.app`
4. Copy **Client ID** and **Client Secret** → Vercel

---

### 4. Get Supabase Keys

1. Go to **Supabase Dashboard → Settings → API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_KEY` (⚠️ Keep this SECRET)

---

## How The New Flow Works

### Authorization Code + PKCE Flow

```
User clicks "Sign in with Google"
    ↓
Frontend generates PKCE challenge/verifier
    ↓
Redirects to Google OAuth consent screen
    ↓
User approves
    ↓
Google redirects back with authorization code
    ↓
Frontend sends code + verifier to /api/config
    ↓
Backend exchanges code for access + refresh tokens
    ↓
Backend stores refresh token in Supabase users table
    ↓
Frontend gets tokens and can upload to Drive indefinitely
```

### Token Refresh

When token expires during upload:
```
Upload fails with 401 → Unauthorized
    ↓
Frontend calls /api/config with refresh_token
    ↓
Backend exchanges refresh_token for new access_token
    ↓
Frontend retries upload with new token
    ↓
Success!
```

---

## File Upload Flow

### Google Drive
```
User captures photo/video
    ↓
Selects folder and clicks "Save & Upload"
    ↓
Frontend uploads to Google Drive:
    - Creates SnapVault/[folder-name] if needed
    - Uploads file to that folder
    - Stores folder metadata in Supabase for persistence
```

### OneDrive  
```
Similar to Google Drive but uses Microsoft Graph API
Stores in OneDrive: /SnapVault/[folder-name]/
```

---

## Folder Persistence

All folders are now stored in **Supabase `folders` table** with:
- `user_id` — whose folder
- `name` — folder name
- `storage_provider` — 'gdrive' | 'onedrive'
- `created_at` — when created

So when user logs in later, folders are **automatically loaded from DB** instead of being lost per session.

---

## Testing Locally

```bash
# Use local tunneling to test OAuth redirect
# Install: npm install -g ngrok

# Start local server
python3 -m http.server 8080 --directory public

# In another terminal, tunnel port 8080
ngrok http 8080
# Copy forwarding URL: https://abc123.ngrok.io

# Update OAuth apps with new redirect URI:
# https://abc123.ngrok.io

# Update REDIRECT_URI in local .env.local:
REDIRECT_URI=https://abc123.ngrok.io
```

---

## Troubleshooting

### "Upload failed: Request had invalid authentication credentials"
- ❌ Old implicit token expired
- ✅ Now fixed with refresh tokens

### "Folders disappear after logout"
- ❌ Old behavior (stored in localStorage)
- ✅ Now persisted in Supabase database

### OAuth redirect doesn't work locally
- Make sure `REDIRECT_URI` matches your local tunnel URL
- Google/Microsoft apps must have the exact URI registered

---

## Security Notes

⚠️ **NEVER commit to Git:**
```
SUPABASE_SERVICE_KEY
GDRIVE_CLIENT_SECRET
ONEDRIVE_CLIENT_SECRET
```

✅ **Use Vercel secrets** for all sensitive values  
✅ **RLS policies** protect user data  
✅ **PKCE** prevents authorization code interception  
