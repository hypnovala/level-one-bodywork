// /api/join.js  — Vercel Serverless Function
// Requires env var: RESEND_API_KEY
// Set in Vercel Dashboard → Project Settings → Environment Variables

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, location } = req.body || {};

  // Basic validation
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Missing RESEND_API_KEY environment variable');
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  const isHouston = location === 'yes';

  // ── Email to Brock (notification) ───────────────────────────
  const notifyPayload = {
    from: 'Level One Bodywork <noreply@brockjohn.com>',
    to:   ['bhhm2020@gmail.com'],
    subject: `New Level One signup — ${name}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;color:#2E1F0E;padding:2rem;">
        <h2 style="font-size:1.3rem;margin-bottom:0.5rem;">New Level One Bodywork Signup</h2>
        <hr style="border:none;border-top:1px solid #EFE5C5;margin:1rem 0;" />
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Houston?</strong> ${isHouston ? 'Yes — offer bodywork access' : 'No — digital only'}</p>
        <hr style="border:none;border-top:1px solid #EFE5C5;margin:1rem 0;" />
        <p style="font-size:0.85rem;color:#6B4C2A;">Sent from brockjohn.com Level One membership form</p>
      </div>
    `,
  };

  // ── Confirmation email to member ────────────────────────────
  const confirmPayload = {
    from: 'Brock John <bhhm2020@gmail.com>',
    to:   [email],
    subject: `Welcome to Level One Bodywork, ${name}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;color:#2E1F0E;padding:2rem;background:#F5EED8;">
        <p style="font-size:0.72rem;letter-spacing:0.15em;text-transform:uppercase;color:#C9A96E;margin-bottom:0.5rem;">
          Level One Bodywork — Brock Somatic Bodywork
        </p>
        <h1 style="font-size:1.6rem;font-weight:300;font-style:italic;margin-bottom:1rem;line-height:1.3;">
          Welcome, ${name}.
        </h1>
        <p style="color:#6B4C2A;line-height:1.7;margin-bottom:1rem;">
          You've taken the first step. I'm glad you're here.
        </p>
        <p style="color:#6B4C2A;line-height:1.7;margin-bottom:1rem;">
          Here's what to expect in the next 48 hours:
        </p>
        <ul style="color:#6B4C2A;line-height:1.9;padding-left:1.25rem;margin-bottom:1.5rem;">
          <li>A link to the Brock Check-In App</li>
          <li>Your first Nervous System Baseline Worksheet</li>
          <li>A calendar link to schedule your first 1:1 somatic call</li>
          ${isHouston ? '<li>Info on booking your first in-person Houston bodywork session</li>' : ''}
        </ul>
        <p style="color:#6B4C2A;line-height:1.7;margin-bottom:1.5rem;">
          If you have any questions before then, reply to this email or 
          reach me on WhatsApp at 346-219-1603.
        </p>
        <hr style="border:none;border-top:1px solid #C9A96E;margin:1.5rem 0;" />
        <p style="font-size:0.82rem;color:#8B6340;font-style:italic;">
          — Brock John<br/>
          Somatic Bodywork Practitioner<br/>
          Houston, Texas &nbsp;·&nbsp; brockjohn.com
        </p>
      </div>
    `,
  };

  try {
    // Send both emails in parallel
    const [notifyRes, confirmRes] = await Promise.all([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifyPayload),
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(confirmPayload),
      }),
    ]);

    // Check for Resend errors
    if (!notifyRes.ok || !confirmRes.ok) {
      const notifyErr = !notifyRes.ok ? await notifyRes.json() : null;
      const confirmErr = !confirmRes.ok ? await confirmRes.json() : null;
      console.error('Resend error:', { notifyErr, confirmErr });
      return res.status(502).json({ message: 'Email delivery error. Please try again.' });
    }

    return res.status(200).json({ message: 'Success' });

  } catch (err) {
    console.error('API handler error:', err);
    return res.status(500).json({ message: 'Unexpected server error.' });
  }
}
