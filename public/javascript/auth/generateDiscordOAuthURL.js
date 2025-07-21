export function generateDiscordOAuthURL(clientId, redirectURI) {
  const base = 'https://discord.com/oauth2/authorize';
  const url = new URL(base);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectURI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify');
  return url.toString();
}
