export async function onRequestGet(context) {
    const { env } = context;
    const enable_local_cookies = "true"; // this should be set
    const redirect_uri = 'https://community-web-7zs.pages.dev/api/auth/callback';

    console.log({
        client_id: env.DISCORD_CLIENT_ID,
        redirect_uri: redirect_uri //env.DISCORD_REDIRECT_URI - gets the hardcode, no need for env
    });

    return new Response(JSON.stringify({
        client_id: env.DISCORD_CLIENT_ID,
        redirect_uri: redirect_uri, //env.DISCORD_REDIRECT_URI, - gets the hardcode, no need for env
        cookies: enable_local_cookies === "false" ? "Secure; " : ""
    }), {
        headers: { 'Content-Type': 'application/json' },
    });
}

