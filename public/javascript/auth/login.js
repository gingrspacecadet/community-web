import { generateDiscordOAuthURL } from './generateDiscordOAuthURL.js';

async function getOAuthConfig() {
  const res = await fetch('/api/auth/config');
  if (!res.ok) {
    throw new Error('Failed to load OAuth config');
  }
  return await res.json();
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  try {
    const { client_id, redirect_uri } = await getOAuthConfig();
    const oauthUrl = generateDiscordOAuthURL(client_id, window.location.origin + redirect_uri);
    console.log('Redirecting to OAuth URL:', oauthUrl);
    window.location.href = oauthUrl;
  } catch (e) {
    console.error('OAuth login failed', e);
  }
});


