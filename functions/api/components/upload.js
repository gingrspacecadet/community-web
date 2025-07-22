import { insertComponent } from "../utils.js";

export async function onRequestPost(context) {
  const { request } = context;
  const formData = await request.formData();
  const file = formData.get("fileInput");

  const userId = context.user?.id || null;
  const description = formData.get("descriptionInput")?.toString().trim() || "";
  if (description.length > 1024) {
    return new Response(
      JSON.stringify({ error: "Description must be 1024 characters or less." }),
      { status: 400 },
    );
  }
  const username = formData.get("username")?.toString().trim() || null;
  const tagsRaw = formData.get("tagsInput")?.toString().trim() || "";
  if (tagsRaw.length > 1024) {
    return new Response(
      JSON.stringify({ error: "Tags must be 1024 characters or less." }),
      { status: 400 },
    );
  }
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!file) {
    return new Response(JSON.stringify({ error: "No file uploaded." }), {
      status: 400,
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  const base64Data = arrayBufferToBase64(arrayBuffer);

  // Rate limiting: allow max 5 uploads per user per hour
  if (context.env && typeof context.env.DB?.prepare === 'function') {
    let finalUserId = userId;
    if (!finalUserId) {
      const cookieHeader = request.headers.get("cookie") || "";
      const authTokenMatch = cookieHeader.match(/authToken=([^;]+)/);
      const authToken = authTokenMatch ? authTokenMatch[1] : null;
      if (
        authToken &&
        context.env &&
        typeof context.env.DB?.prepare === "function"
      ) {
        try {
          const user = await context.env.DB.prepare(
            "SELECT id FROM users WHERE auth_token = ?",
          )
            .bind(authToken)
            .first();
          if (user && user.id) {
            finalUserId = user.id;
          }
        } catch (err) {
          return new Response(
            JSON.stringify({
              error: "Failed to look up user id from auth token.",
            }),
            { status: 500 },
          );
        }
      }
    }
    if (finalUserId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const uploadCount = await context.env.DB.prepare(
        'SELECT COUNT(*) as count FROM components WHERE user_id = ? AND created_at > ?'
      ).bind(finalUserId, oneHourAgo).first();
      if (uploadCount && uploadCount.count >= 5) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded: max 5 uploads per hour.' }), { status: 429 });
      }
    }
  }

  const component = {
    name: file.name,
    description,
    data: base64Data,
    user_id: userId,
    username: finalUsername,
    tags,
  };

  try {
    await insertComponent(component, context.env);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
