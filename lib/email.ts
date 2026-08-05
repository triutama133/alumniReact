type BrevoSendEmailPayload = {
  sender: { email: string; name?: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
};

function getBrevoApiKey() {
  return process.env.BREVO_API_KEY;
}

function getFromEmail() {
  return process.env.FROM_EMAIL || 'noreply@hubtalent.id';
}

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}

async function sendBrevoEmail(payload: BrevoSendEmailPayload) {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    throw new Error('BREVO_API_KEY belum dikonfigurasi.');
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errorText}`);
  }
}

export async function sendPasswordResetEmail(to: string, token: string, origin?: string) {
  const fromEmail = getFromEmail();
  const appUrl = origin || getAppUrl();
  const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendBrevoEmail({
      sender: {
        email: fromEmail,
        name: 'HubTalent',
      },
      to: [{ email: to }],
      subject: 'Reset Password Akun HubTalent',
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;line-height:1.5;color:#0f172a;">
          <h2 style="margin-bottom:8px;">Reset Password Akun Anda</h2>
          <p style="margin-top:0;">Kami menerima permintaan reset password untuk akun HubTalent Anda.</p>
          <p>Klik tombol di bawah ini untuk membuat password baru. Tautan ini berlaku selama <strong>15 menit</strong>.</p>
          <p style="margin:24px 0;">
            <a href="${resetUrl}" style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600;">
              Reset Password
            </a>
          </p>
          <p style="font-size:13px;color:#475569;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
    });
  } catch (error: any) {
    console.error('[EMAIL] Gagal mengirim email reset password via Brevo:', error.message);
    
    // Fail-safe in development: print URL to terminal so dev can test without email working
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.log('\n┌────────────────────────────────────────────────────────┐');
      console.log('│  [DEVELOPMENT ONLY] EMAIL RESET PASSWORD SIMULATED    │');
      console.log('├────────────────────────────────────────────────────────┤');
      console.log(`│ Penerima: ${to.padEnd(45)} │`);
      console.log(`│ URL:      ${resetUrl.padEnd(45)} │`);
      console.log('└────────────────────────────────────────────────────────┘\n');
      return;
    }
    throw error;
  }
}
