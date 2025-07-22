import { getAllComponents } from "../utils.js";

export async function onRequestGet(context) {
  try {
    const components = await getAllComponents(context.env);
    return new Response(JSON.stringify({ components }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
