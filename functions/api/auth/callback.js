async function getOAuthConfig(request) {
  // Construct the full URL using the incoming request's URL
  const url = new URL('/api/auth/config', new URL(request.url).origin);
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error('Failed to load OAuth config');
  }
  return response.json();
}

export async function onRequestGet(context) {
  const { request } = context;
  
  try {
    const config = await getOAuthConfig(request);
    // Process the config and return a response
    return new Response(JSON.stringify(config), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { env, request } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  const { client_id, redirect_uri } = await getOAuthConfig();

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return new Response('Token exchange failed: ' + JSON.stringify(tokenData), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

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

