// db.js - Admin endpoint to execute SQL if username is authorized
const AUTHORIZED_USERS = ['_justparrot', 'thehuckle', 'gingrspacecadet'];

export async function onRequestPost(context) {
  const { request, env } = context;
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  const { sql } = data;
  // Get authToken from cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const authTokenMatch = cookieHeader.match(/authToken=([^;]+)/);
  const authToken = authTokenMatch ? authTokenMatch[1] : null;
  if (!authToken || !sql) {
    return new Response(JSON.stringify({ error: 'Missing auth token or sql' }), { status: 400 });
  }
  // Find user by auth token
  const user = await env.DB.prepare('SELECT username FROM users WHERE auth_token = ?').bind(authToken).first();
  if (!user || !AUTHORIZED_USERS.includes(user.username)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  try {
    const result = await env.DB.prepare(sql).all();
    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
