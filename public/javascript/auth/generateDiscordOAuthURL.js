
export function generateDiscordOAuthURL(clientId, redirectURI) {
  const responseType = 'code';
  const scope = 'identify';
  const base = 'https://discord.com/oauth2/authorize';

  const url = new URL(base);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectURI);
  url.searchParams.set('response_type', responseType);
  url.searchParams.set('scope', scope);

  console.log(`Discord OAuth URL: ${url.toString()}`);
  console.log(`Client ID: ${clientId}`);
  console.log(`Redirect URI: ${redirectURI}`);
  console.log(`Response Type: ${responseType}`);
  console.log(`Scope: ${scope}`);

  return url.toString();
}
