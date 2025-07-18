// path/to: public/javascript/auth/generateDiscordOAuthURL.js
export function generateDiscordOAuthURL(clientId, redirectURI) {
  const responseType = 'code';
  const scope = 'identify';

  console.log('Generating Discord OAuth URL with:');
  console.log('Scope:', scope);
  console.log('Redirect URL:', redirectURI);
  console.log('Client ID:', clientId);

  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', responseType);
  url.searchParams.set('redirect_uri', redirectURI);
  url.searchParams.set('scope', scope);

  return url.toString();
}
