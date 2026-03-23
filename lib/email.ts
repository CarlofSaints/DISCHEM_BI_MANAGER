import { Resend } from 'resend';

// Lazy init — Resend throws if no key at import time
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM ?? 'report_sender@outerjoin.co.za';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dischem-bi-manager.vercel.app';

export async function sendWelcomeEmail(opts: {
  toName: string;
  toEmail: string;
  password: string;
  forcePasswordChange: boolean;
}): Promise<void> {
  const { toName, toEmail, password, forcePasswordChange } = opts;

  await getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Your Dis-Chem BI Manager account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
        <div style="background:#F97316;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">Dis-Chem BI Manager</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
          <p style="color:#374151;margin:0 0 16px">Hi ${toName},</p>
          <p style="color:#374151;margin:0 0 16px">
            An account has been created for you on the Dis-Chem BI Manager portal.
          </p>
          <table style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;width:100%;margin-bottom:24px">
            <tr><td style="color:#6b7280;font-size:13px;padding-bottom:8px">Login URL</td><td style="color:#111827;font-size:13px;padding-bottom:8px"><a href="${APP_URL}" style="color:#F97316">${APP_URL}</a></td></tr>
            <tr><td style="color:#6b7280;font-size:13px;padding-bottom:8px">Email</td><td style="color:#111827;font-size:13px;padding-bottom:8px">${toEmail}</td></tr>
            <tr><td style="color:#6b7280;font-size:13px">Password</td><td style="color:#111827;font-size:13px;font-weight:bold">${password}</td></tr>
          </table>
          ${forcePasswordChange ? `<p style="color:#6b7280;font-size:13px;margin:0 0 16px">You will be asked to change your password on first login.</p>` : ''}
          <a href="${APP_URL}/login" style="display:inline-block;background:#F97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px">Log In Now →</a>
          <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">
            Sent by OuterJoin / ARIA. If you did not expect this email, please ignore it.
          </p>
        </div>
      </div>
    `,
  });
}
