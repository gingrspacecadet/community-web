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

  if (context.env && typeof context.env.DB?.prepare === 'function') {
    // Check for identical file data
    const existing = await context.env.DB.prepare('SELECT id FROM components WHERE data = ?').bind(base64Data).first();
    if (existing) {
      return new Response(JSON.stringify({ error: 'A file with identical data already exists.' }), { status: 409 });
    }
    // Check for same timestamp
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sameTimestamp = await context.env.DB.prepare('SELECT id FROM components WHERE created_at = ?').bind(now).first();
    if (sameTimestamp) {
      return new Response(JSON.stringify({ error: 'A file with the same timestamp already exists.' }), { status: 409 });
    }
    // Check for same title & tags
    const tagsString = tags.join(',');
    const sameTitleTags = await context.env.DB.prepare('SELECT id FROM components WHERE name = ? AND tags = ?').bind(file.name, tagsString).first();
    if (sameTitleTags) {
      return new Response(JSON.stringify({ error: 'A file with the same title and tags already exists.' }), { status: 409 });
    }
  }

  let finalUsername = username;
  if (!finalUsername) {
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
          "SELECT username FROM users WHERE auth_token = ?",
        )
          .bind(authToken)
          .first();
        if (user && user.username) {
          finalUsername = user.username;
        }
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: "Failed to look up username from auth token.",
          }),
          { status: 500 },
        );
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
