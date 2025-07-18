export async function verifyPassword(input, stored) {
    return (await hashPassword(input)) === stored;
}

export async function hashPassword(pw) {
    const enc = new TextEncoder().encode(pw);
    const hash = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// Insert a new component into the components table
export async function insertComponent(component, env) {
    // component: { name, description, data, user_id, username, tags }
    // Store username in description if not in schema
    let desc = component.description || '';
    if (component.username) {
        desc = `[user:${component.username}] ` + desc;
    }
    const tags = Array.isArray(component.tags) ? component.tags.join(',') : (component.tags || '');
    const stmt = env.DB.prepare(`
        INSERT INTO components (name, description, tags, data, user_id)
        VALUES (?, ?, ?, ?, ?)
    `);
    await stmt.bind(
        component.name,
        desc,
        tags,
        component.data,
        component.user_id || null
    ).run();
}

// Get all components from the components table
export async function getAllComponents(env) {
    const stmt = env.DB.prepare('SELECT * FROM components ORDER BY created_at DESC');
    const { results } = await stmt.all();
    // Extract username from description if present, and split tags
    return results.map(comp => {
        let username = '';
        let desc = comp.description || '';
        const match = desc.match(/^\[user:([^\]]+)\] ?(.*)$/);
        if (match) {
            username = match[1];
            desc = match[2];
        }
        let tags = [];
        if (comp.tags) {
            tags = comp.tags.split(',').map(t => t.trim()).filter(Boolean);
        }
        return { ...comp, username, description: desc, tags };
    });
}