import { generateDiscordOAuthURL } from './generateDiscordOAuthURL.js';

async function getOAuthConfig() {
  const res = await fetch('/api/auth/config');
  if (!res.ok) {
    throw new Error('Failed to load OAuth config');
  }
  return await res.json();
}

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('loginBtn');
  if (!button) {
    console.error('No #loginBtn found');
    return;
  }

  button.addEventListener('click', async () => {
    try {
      const { client_id, redirect_uri } = await getOAuthConfig();
      const oauthUrl = generateDiscordOAuthURL(client_id, redirect_uri);
      console.log('Redirecting to:', oauthUrl);
      window.location.href = oauthUrl;
    } catch (e) {
      console.error('OAuth login failed:', e);
    }
  });
});
