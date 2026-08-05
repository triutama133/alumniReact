import fs from 'node:fs';
import path from 'node:path';

type VerifyTurnstileArgs = {
  token: string;
  remoteIp?: string;
};

type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
};

let fallbackEnvMap: Record<string, string> | null = null;

function readFallbackEnv() {
  if (fallbackEnvMap) {
    return fallbackEnvMap;
  }

  const envPath = path.join(process.cwd(), 'app', '.env');
  if (!fs.existsSync(envPath)) {
    fallbackEnvMap = {};
    return fallbackEnvMap;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const parsed: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    parsed[key] = value;
  }

  fallbackEnvMap = parsed;
  return fallbackEnvMap;
}

function getEnvValue(keys: string[]) {
  for (const key of keys) {
    const val = process.env[key];
    if (val && val.trim()) {
      return val.trim();
    }
  }

  const fallback = readFallbackEnv();
  for (const key of keys) {
    const val = fallback[key];
    if (val && val.trim()) {
      return val.trim();
    }
  }

  return undefined;
}

export function getTurnstileSiteKey(): string | undefined {
  return getEnvValue([
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    'TURNSTILE_SITE_KEY',
    'site_key_cloudflare_turnstile',
  ]);
}

function getTurnstileSecretKey(): string | undefined {
  return getEnvValue(['TURNSTILE_SECRET', 'TURNSTILE_SECRET_KEY', 'secret_key_cloudflare_turnstile']);
}

export async function verifyTurnstileToken({ token, remoteIp }: VerifyTurnstileArgs) {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    return {
      ok: false,
      error: 'Turnstile secret key belum dikonfigurasi di server.',
      status: 500,
    } as const;
  }

  const formData = new URLSearchParams();
  formData.set('secret', secret);
  formData.set('response', token);
  if (remoteIp) {
    formData.set('remoteip', remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
    cache: 'no-store',
  });

  if (!response.ok) {
    return {
      ok: false,
      error: 'Gagal memverifikasi captcha. Coba lagi.',
      status: 502,
    } as const;
  }

  const result = (await response.json()) as TurnstileVerifyResponse;
  if (!result.success) {
    return {
      ok: false,
      error: 'Verifikasi captcha gagal. Coba lagi.',
      status: 400,
      codes: result['error-codes'] || [],
    } as const;
  }

  return {
    ok: true,
  } as const;
}
