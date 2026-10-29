import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// filter() returns either a plain array or { items }, depending on SDK version
const rows = (result) => (Array.isArray(result) ? result : result?.items || []);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'Sign in first' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === 'send') {
      const recent = await base44.asServiceRole.entities.LoginCode.filter(
        { email: user.email },
        { sort: '-created_date', limit: 5 }
      );
      const latest = rows(recent)[0];
      if (latest && Date.now() - new Date(latest.created_date).getTime() < 20000) {
        return Response.json({ error: 'A code was just sent — give it a moment' }, { status: 429 });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const record = await base44.asServiceRole.entities.LoginCode.create({
        email: user.email,
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      });

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          from_name: 'Nook',
          subject: 'Your Nook sign-in code',
          body: `<p>Here is your Nook sign-in code:</p><p style="font-size:26px;letter-spacing:6px;font-weight:700">${code}</p><p>It expires in 10 minutes. If this wasn't you, you can ignore this email.</p>`,
        });
      } catch (mailError) {
        // the email never left: void the code so the rate limit does not block a retry
        await base44.asServiceRole.entities.LoginCode.update(record.id, { used: true }).catch(() => {});
        return Response.json({ error: 'We could not send the email. Try again in a moment.' }, { status: 502 });
      }

      return Response.json({ sent: true });
    }

    if (action === 'verify') {
      const code = String(body.code || '').trim();
      if (!code) return Response.json({ error: 'Enter the six-digit code' }, { status: 400 });

      const found = await base44.asServiceRole.entities.LoginCode.filter(
        { email: user.email, code, used: false },
        { sort: '-created_date', limit: 1 }
      );
      const record = rows(found)[0];
      if (!record) return Response.json({ error: 'That code is not right' }, { status: 400 });
      if (record.expires_at && new Date(record.expires_at).getTime() < Date.now()) {
        return Response.json({ error: 'That code has expired' }, { status: 400 });
      }

      await base44.asServiceRole.entities.LoginCode.update(record.id, { used: true });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}