import { hashPassword } from "../utils.js";

export async function onRequest(context) {
    const { request, env } = context;
    const { method } = request;

    if (method === "OPTIONS") {
        return new Response(null, { status: 204 });
    }

    if (!env.DB) {
        return new Response(
            JSON.stringify({ error: "DB not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    if (method === "POST") {
        let data;
        try {
            data = await request.json();
        } catch {
            return new Response("Bad JSON", { status: 400 });
        }


        const { action, username, password } = data;

        if (action !== "register") {
            return new Response(
                JSON.stringify({ error: "Unsupported action" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Basic field validation
        if (
            !password ||
            !username
        ) {
            return new Response(
                JSON.stringify({ error: "Missing registration fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if email already exists
        const exists = await env.DB.prepare(
            "SELECT 1 FROM users WHERE username = ?"
        ).bind(username).first();

        if (exists) {
            return new Response(
                JSON.stringify({ error: "Username already registered" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Hash the password
        const hashed = await hashPassword(password);

        // Insert only username and hashed password
        await env.DB.prepare(
            `INSERT INTO users (username, password) VALUES (?, ?)`
        )
        .bind(username, hashed)
        .run();

        return new Response(
            JSON.stringify({ message: "Registered", success: true }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response("Method not allowed", { status: 405 });
}