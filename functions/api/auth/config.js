export async function onRequestGet(context) {
    const { env } = context;
    const enable_cookies = "true";

    console.log({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        redirect_uri: env.DISCORD_REDIRECT_URI
    });

    return new Response(JSON.stringify({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        redirect_uri: env.DISCORD_REDIRECT_URI,
        cookies: enable_cookies === "false" ? "Secure; " : ""
    }), {
        headers: { 'Content-Type': 'application/json' },
});
}

