async function getOAuthConfig(request) {
  const res = await fetch(new URL('/api/auth/config', request.url));
  if (!res.ok) {
    throw new Error('Failed to load OAuth config');
  }
  return await res.json();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  let client_id, client_secret, redirect_uri;
  try {
    const config = await getOAuthConfig(request);
    client_id = config.client_id;
    client_secret = env.DISCORD_CLIENT_SECRET;
    const origin = new URL(request.url).origin;
    redirect_uri = origin + config.redirect_uri;
  } catch (e) {
    return new Response('Failed to get OAuth config: ' + e.message, { status: 500 });
  }

  if (!client_secret) {
    return new Response('Missing client_secret from config', { status: 500 });
  }

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id,
      client_secret, 
      grant_type: 'authorization_code',
      code,
      redirect_uri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    return new Response('Token exchange failed: ' + errorBody, { status: 400 });
  }

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

  
  if (env.DB && typeof env.DB.prepare === 'function') {
    try {
      const stmt = env.DB.prepare(
        'INSERT OR REPLACE INTO users (id, username, auth_token) VALUES (?, ?, ?)'
      ).bind(userData.id, userData.username, tokenData.access_token);
      await stmt.run();
    } catch (err) {
      return new Response('Failed to store user data: ' + err.message, { status: 500 });
    }
  }

  const config = await getOAuthConfig(request);
  return new Response(null, {
    status: 302,
    headers: {
      'Set-Cookie': `authToken=${tokenData.access_token}; Path=/; HttpOnly; ${config.cookies}SameSite=Lax; Max-Age=86400, username=${encodeURIComponent(userData.username)}; Path=/; SameSite=Lax; Max-Age=86400`,
      'Location': '/pages/app'
    }
  });
}

