async function getOAuthConfig() {
  const res = await fetch('/api/auth/config');
  if (!res.ok) {
    throw new Error('Failed to load OAuth config');
  }
  return await res.json();
}

export async function onRequestGet(context) {
  const { env, request } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  // Get the OAuth config
  let oauthConfig;
  try {
    oauthConfig = await getOAuthConfig();
  } catch (error) {
    return new Response('Failed to load OAuth configuration', { status: 500 });
  }

  const { client_id, client_secret, redirect_uri } = oauthConfig;

  // Exchange the code for a token
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client_id || env.DISCORD_CLIENT_ID,
      client_secret: client_secret || env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect_uri,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return new Response('Token exchange failed: ' + JSON.stringify(tokenData), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
  }

  // Fetch user info
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    return new Response('Failed to fetch user info', { status: 400 });
  }

  const userData = await userResponse.json();

  return new Response(JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });
}