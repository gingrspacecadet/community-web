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
  let finalUsername = username;
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
  let userForRateLimit = null;
  const userMatch = description.match(/\[user:([^\]]+)\]/);
  if (userMatch) {
    userForRateLimit = userMatch[1];
  }
  if (context.env && typeof context.env.DB?.prepare === 'function') {
    if (userForRateLimit) {
      // Use the correct timestamp format for SQLite DATETIME (YYYY-MM-DD HH:MM:SS)
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const oneHourAgo = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours()-1)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const uploadCount = await context.env.DB.prepare(
        'SELECT COUNT(*) as count FROM components WHERE description LIKE ? AND created_at > ?'
      ).bind(`%[user:${userForRateLimit}]%`, oneHourAgo).first();
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
