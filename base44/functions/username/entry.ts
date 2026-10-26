const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const VALID = /^[a-z0-9._-]{3,20}$/;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || '').trim().toLowerCase();
    const action = body.action;

    if (!VALID.test(username)) {
      return Response.json({ error: '3–20 letters, numbers, dots or dashes' }, { status: 400 });
    }

    const user = await db.auth.me().catch(() => null);
    const taken = await db.asServiceRole.entities.Username.filter({ username }, { limit: 5 });
    const others = (taken?.items || []).filter((record) => record.user_id !== user?.id);

    if (action === 'check') {
      return Response.json({ username, available: others.length === 0 });
    }

    if (action === 'set') {
      if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 });
      if (others.length) return Response.json({ error: 'That name is taken', available: false }, { status: 409 });

      const mine = await db.asServiceRole.entities.Username.filter({ user_id: user.id }, { limit: 5 });
      const existing = (mine?.items || [])[0];
      if (existing) {
        await db.asServiceRole.entities.Username.update(existing.id, { username, email: user.email });
      } else {
        await db.asServiceRole.entities.Username.create({ username, user_id: user.id, email: user.email });
      }
      return Response.json({ username, available: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}