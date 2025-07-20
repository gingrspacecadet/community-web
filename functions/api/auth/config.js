export async function onRequestGet(context) {
    const { env } = context;
    const redirect_uri = "http://localhost:8788/api/auth/callback"; // Replace with your actual redirect URI

    const enable_cookies = "true"; // Set to true if you want to disable cookies for local testing
                                      // ENABLE for production  

    console.log({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        redirect_uri: redirect_uri
    });

    return new Response(JSON.stringify({
        client_id: "1391809353933127810",
        client_secret: 'C81B8e8kY0-tRknOqlBMStG7jxMgAkCS',
        redirect_uri: redirect_uri,
        cookies: enable_cookies === "false" ? "Secure; " : ""
    }), {
        headers: { 'Content-Type': 'application/json' },
});
}

