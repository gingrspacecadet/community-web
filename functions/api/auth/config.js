export async function onRequestGet(context) {
  const { env } = context;
  const redirect_uri = "http://localhost:8788/api/auth/callback"; // Replace with your actual redirect URI

  console.log({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    redirect_uri: redirect_uri
  });

  return new Response(JSON.stringify({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    redirect_uri: redirect_uri
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

