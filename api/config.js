import { createClient } from '@supabase/supabase-js';

const SB = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use SERVICE_KEY for backend ops
);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ═══════════════════════════════════════
  // GET /api/config — Send public config
  // ═══════════════════════════════════════
  if (req.method === 'GET') {
    return res.status(200).json({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_ANON_KEY || '',
      gdriveClientId: process.env.GDRIVE_CLIENT_ID || '',
      onedriveClientId: process.env.ONEDRIVE_CLIENT_ID || '',
    });
  }

  // ═══════════════════════════════════════
  // POST /api/config — Handle OAuth exchanges
  // ═══════════════════════════════════════
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, code, userId, provider, codeVerifier, refreshToken } = req.body;

  try {
    // ─── Exchange Google Drive Auth Code ───
    if (action === 'exchange_gdrive_token' && code && codeVerifier) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GDRIVE_CLIENT_ID,
          client_secret: process.env.GDRIVE_CLIENT_SECRET,
          code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: process.env.REDIRECT_URI || `${process.env.VERCEL_URL || 'http://localhost:3000'}/callback`,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json();
        return res.status(400).json({ error: err.error_description || 'GDrive token exchange failed' });
      }

      const tokens = await tokenRes.json();
      const { access_token, refresh_token, expires_in } = tokens;

      // Store refresh token in Supabase
      if (userId) {
        await SB.from('users').upsert({
          id: userId,
          storage_provider: 'gdrive',
          gdrive_refresh_token: refresh_token,
        }, { onConflict: 'id' });
      }

      return res.status(200).json({
        access_token,
        refresh_token,
        expires_in,
        provider: 'gdrive',
      });
    }

    // ─── Exchange OneDrive Auth Code ───
    if (action === 'exchange_onedrive_token' && code && codeVerifier) {
      const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.ONEDRIVE_CLIENT_ID,
          client_secret: process.env.ONEDRIVE_CLIENT_SECRET,
          code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: process.env.REDIRECT_URI || `${process.env.VERCEL_URL || 'http://localhost:3000'}/callback`,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json();
        return res.status(400).json({ error: err.error_description || 'OneDrive token exchange failed' });
      }

      const tokens = await tokenRes.json();
      const { access_token, refresh_token, expires_in } = tokens;

      // Store refresh token in Supabase
      if (userId) {
        await SB.from('users').upsert({
          id: userId,
          storage_provider: 'onedrive',
          onedrive_refresh_token: refresh_token,
        }, { onConflict: 'id' });
      }

      return res.status(200).json({
        access_token,
        refresh_token,
        expires_in,
        provider: 'onedrive',
      });
    }

    // ─── Refresh Access Token ───
    if (action === 'refresh_token' && provider && refreshToken) {
      if (provider === 'gdrive') {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GDRIVE_CLIENT_ID,
            client_secret: process.env.GDRIVE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        const tokens = await tokenRes.json();
        return res.status(200).json(tokens);
      } else if (provider === 'onedrive') {
        const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.ONEDRIVE_CLIENT_ID,
            client_secret: process.env.ONEDRIVE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        const tokens = await tokenRes.json();
        return res.status(200).json(tokens);
      }
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
