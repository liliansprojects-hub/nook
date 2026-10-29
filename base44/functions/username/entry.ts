import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const VALID = /^[a-z0-9._-]{3,20}$/;

// filter() returns either a plain array or { items }, depending on SDK version
const rows = (result) => (Array.isArray(result) ? result : result?.items || []);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || '').trim().toLowerCase();
    const action = body.action;

    if (!VALID.test(username)) {
      return Response.json({ error: '3–20 letters, numbers, dots or dashes' }, { status: 400 });
    }

    const user = await base44.auth.me().catch(() => null);
    const taken = await base44.asServiceRole.entities.Username.filter({ username }, { limit: 5 });
    const others = rows(taken).filter((record) => record.user_id !== user?.id);

    if (action === 'check') {
      return Response.json({ username, available: others.length === 0 });
    }

    if (action === 'set') {
      if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 });
      if (others.length) return Response.json({ error: 'That name is taken', available: false }, { status: 409 });

      const mine = await base44.asServiceRole.entities.Username.filter({ user_id: user.id }, { limit: 5 });
      const existing = rows(mine)[0];
      if (existing) {
        await base44.asServiceRole.entities.Username.update(existing.id, { username, email: user.email });
      } else {
        await base44.asServiceRole.entities.Username.create({ username, user_id: user.id, email: user.email });
      }
      return Response.json({ username, available: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}