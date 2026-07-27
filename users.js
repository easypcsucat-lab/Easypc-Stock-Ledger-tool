// Cloudflare Pages Function — backs GET/POST /api/users
//
// Requires a KV namespace bound to this Pages project with the
// variable name USERS_KV (Cloudflare dashboard: your Pages project ->
// Settings -> Functions -> KV namespace bindings -> add binding
// "USERS_KV" pointing at a KV namespace you create, e.g. "easypc-users").
//
// GET  /api/users  -> returns the shared account list as JSON.
//                      Seeds it with the defaults below on first-ever call.
// POST /api/users  -> body is a JSON array of the full account list;
//                      overwrites what's stored.
//
// NOTE: this endpoint has no authentication of its own — anyone who
// knows the URL can read or overwrite the account list, plaintext
// passwords included. That matches the rest of this app (client-side
// login only, not real security) but is worth knowing since this is
// now a live, publicly reachable API rather than something buried in
// a downloaded file.

const DEFAULT_USERS = [
  {username:'admin', password:'admin123', name:'System Administrator', storeName:'Head Office', role:'RO', area:'Area 1', access:'Administrator', active:true},
  {username:'employee1', password:'easypc1', name:'Employee One', storeName:'', role:'CA', area:'Area 1', access:'User', active:true},
  {username:'employee2', password:'easypc2', name:'Employee Two', storeName:'', role:'CA', area:'Area 1', access:'User', active:true},
];

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function onRequestGet({ env }) {
  if (!env.USERS_KV) {
    return new Response(
      JSON.stringify({ error: 'USERS_KV binding not configured on this Pages project.' }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
  try {
    const raw = await env.USERS_KV.get('users');
    if (raw) {
      return new Response(raw, { headers: JSON_HEADERS });
    }
    // First-ever request: seed the store with the defaults so every
    // visitor sees the same starting accounts from here on.
    await env.USERS_KV.put('users', JSON.stringify(DEFAULT_USERS));
    return new Response(JSON.stringify(DEFAULT_USERS), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.USERS_KV) {
    return new Response(
      JSON.stringify({ error: 'USERS_KV binding not configured on this Pages project.' }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return new Response(JSON.stringify({ error: 'Expected a JSON array of user records.' }), { status: 400, headers: JSON_HEADERS });
    }
    await env.USERS_KV.put('users', JSON.stringify(body));
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
}
