// db.js - Admin endpoint to execute SQL if username is authorized
const AUTHORIZED_USERS = ['admin', 'test', 'gingrspacecadet'];

export async function onRequestPost(context) {
  const { request, env } = context;
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  const { password, sql } = data;
  if (!password || !sql) {
    return new Response(JSON.stringify({ error: 'Missing password or sql' }), { status: 400 });
  }
  // Find user by password hash
  const user = await env.DB.prepare('SELECT username FROM users WHERE password = ?').bind(password).first();
  if (!user || !AUTHORIZED_USERS.includes(user.username)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  try {
    const result = await env.DB.exec(sql);
    return new Response(JSON.stringify({ success: true, result }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
