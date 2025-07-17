// upload.js - Handles file uploads and stores metadata in the database
// Backend logic for handling uploads (Cloudflare Workers/Node.js style)

import { insertComponent } from '../utils.js';

export async function onRequestPost(context) {
  const { request } = context;
  const formData = await request.formData();
  const file = formData.get('fileInput');

  const userId = context.user?.id || null; // Adjust as needed for your auth
  const description = formData.get('descriptionInput')?.toString().trim() || '';
  const username = formData.get('username')?.toString().trim() || null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file uploaded.' }), { status: 400 });
  }
  if (!description) {
    return new Response(JSON.stringify({ error: 'Description is required.' }), { status: 400 });
  }

  // Read file as ArrayBuffer and encode to base64 (browser/worker compatible)
  const arrayBuffer = await file.arrayBuffer();
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  const base64Data = arrayBufferToBase64(arrayBuffer);

  // Store file metadata and data in DB (data as base64 string)
  const component = {
    name: file.name,
    description,
    data: base64Data,
    user_id: userId,
    username,
  };

  try {
    await insertComponent(component, context.env);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
