import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, subject, message, hp } = req.body || {};

    if (typeof hp === 'string' && hp.trim() !== '') {
      return res.status(200).json({ ok: true });
    }
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const clean = (v: string) => String(v).toString().slice(0, 8000);

    const html = `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif">
        <h2>New Support Message</h2>
        <p><strong>From:</strong> ${clean(name)} &lt;${clean(email)}&gt;</p>
        <p><strong>Subject:</strong> ${clean(subject)}</p>
        <pre style="white-space:pre-wrap;background:#f6f7f9;padding:12px;border-radius:8px;border:1px solid #e5e7eb">${clean(message)}</pre>
      </div>
    `;

    const text = `New Support Message
From: ${clean(name)} <${clean(email)}>
Subject: ${clean(subject)}

${clean(message)}
`;

    const resp = await resend.emails.send({
      from: 'Scouta Support <support@scout-a.com>',
      to: ['support@scout-a.com'],
      //reply_to: email,
      subject: `[Support] ${clean(subject)}`,
      html,
      text
    });

    if ((resp as any)?.error) {
      const errMsg = (resp as any).error?.message || 'Email failed';
      return res.status(500).json({ error: errMsg });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
}
