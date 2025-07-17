// public/javascript/auth/discord_link.js
function generateDiscordOAuthURL(redirectURI) {
  const clientId = '1391809353933127810';
  const responseType = 'code';
  const scope = 'identify';

  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', responseType);
  url.searchParams.set('redirect_uri', redirectURI);
  url.searchParams.set('scope', scope);

  return url.toString();
}
