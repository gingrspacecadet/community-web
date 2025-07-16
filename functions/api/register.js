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

        const {
            username,
            password,
        } = data;

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

        // Insert into users, now including latitude & longitude
        await env.DB.prepare(
            `INSERT INTO users
              (email, password, fname, lname, age,
               gender, seeking, country, city,
               latitude, longitude${bio ? ", bio" : ""})
             VALUES (?, ?, ?, ?, ?,
                     ?, ?, ?, ?,
                     ?, ?${bio ? ", ?" : ""})`
        )
        .bind(
            email,
            hashed,
            fname,
            lname,
            age,
            gender,
            seeking,
            country,
            city,
            lat,
            lng,
            ...(bio ? [bio] : [])
        )
        .run();

        return new Response(
            JSON.stringify({ message: "Registered", success: true }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response("Method not allowed", { status: 405 });
}