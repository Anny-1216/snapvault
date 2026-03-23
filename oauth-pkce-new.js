// ══════════════════════════════════════
// PKCE HELPERS
// ══════════════════════════════════════
function generatePKCEChallenge() {
  const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => String.fromCharCode(b))
    .join('');
  const verifier = btoa(codeVerifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  const enc = new TextEncoder();
  const arr = enc.encode(verifier);
  return crypto.subtle.digest('SHA-256', arr).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const challenge = btoa(String.fromCharCode.apply(null, hashArray))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return { verifier, challenge };
  });
}

// ══════════════════════════════════════
// OAUTH — Google Drive / OneDrive with Authorization Code + PKCE
// ══════════════════════════════════════
async function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  if (!code || !state) return false;

  const stored = JSON.parse(localStorage.getItem('sv_oauth_state') || '{}');
  if (stored.state !== state) {
    console.error('State mismatch - possible CSRF attack');
    return false;
  }

  const provider = stored.provider;
  const codeVerifier = stored.codeVerifier;
  
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: `exchange_${provider}_token`,
        code,
        codeVerifier,
        userId: currentUser?.id,
      }),
    });
    
    if (!res.ok) throw new Error(await res.text());
    
    const data = await res.json();
    if (provider === 'gdrive') {
      gdriveToken = data.access_token;
      gdriveRefreshToken = data.refresh_token;
      localStorage.setItem('sv_gd_token', gdriveToken);
      localStorage.setItem('sv_gd_refresh', gdriveRefreshToken);
    } else if (provider === 'onedrive') {
      msToken = data.access_token;
      msRefreshToken = data.refresh_token;
      localStorage.setItem('sv_ms_token', msToken);
      localStorage.setItem('sv_ms_refresh', msRefreshToken);
    }
    
    localStorage.removeItem('sv_oauth_state');
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  } catch (e) {
    console.error('OAuth exchange failed:', e);
    return false;
  }
}

function restoreOAuthTokens() {
  gdriveToken = localStorage.getItem('sv_gd_token') || null;
  gdriveRefreshToken = localStorage.getItem('sv_gd_refresh') || null;
  msToken = localStorage.getItem('sv_ms_token') || null;
  msRefreshToken = localStorage.getItem('sv_ms_refresh') || null;
}

async function refreshAccessToken(provider) {
  const refreshToken = provider === 'gdrive' ? gdriveRefreshToken : msRefreshToken;
  if (!refreshToken) return null;
  
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'refresh_token',
        provider,
        refreshToken,
      }),
    });
    
    if (!res.ok) throw new Error('Token refresh failed');
    
    const data = await res.json();
    const token = data.access_token;
    
    if (provider === 'gdrive') {
      gdriveToken = token;
      localStorage.setItem('sv_gd_token', token);
    } else if (provider === 'onedrive') {
      msToken = token;
      localStorage.setItem('sv_ms_token', token);
    }
    
    return token;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return null;
  }
}

async function signInGoogle() {
  const id = appConfig.gdriveClientId;
  if (!id) { msg('sp-msg','Google Client ID not set in Vercel env','e'); return; }
  
  const { verifier, challenge } = await generatePKCEChallenge();
  const state = Math.random().toString(36).substring(7);
  
  localStorage.setItem('sv_oauth_state', JSON.stringify({
    provider: 'gdrive',
    state,
    codeVerifier: verifier,
  }));
  
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: window.location.origin,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    access_type: 'offline',
  });
  
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function signInMicrosoft() {
  const id = appConfig.onedriveClientId;
  if (!id) { msg('sp-msg','OneDrive Client ID not set in Vercel env','e'); return; }
  
  const { verifier, challenge } = await generatePKCEChallenge();
  const state = Math.random().toString(36).substring(7);
  
  localStorage.setItem('sv_oauth_state', JSON.stringify({
    provider: 'onedrive',
    state,
    codeVerifier: verifier,
  }));
  
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: window.location.origin,
    response_type: 'code',
    scope: 'Files.ReadWrite offline_access',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  
  window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}
