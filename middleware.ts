// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { getAuthSessionVersionForMiddleware } from '@/lib/authSessionVersion';

const IP_RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMITS: Record<string, number> = {
  '/api/login': 5,
  '/api/register': 3,
  '/api/forgot-password': 3,
  '/api/reset-password': 5,
  '/api/ai': 10,
  '/api/learning-path': 10,
};

function checkRateLimit(ip: string, path: string): boolean {
  const limit = Object.entries(RATE_LIMITS).find(([prefix]) => path.startsWith(prefix))?.[1];
  if (!limit) return true;

  const now = Date.now();
  const bucketPath = Object.keys(RATE_LIMITS).find((prefix) => path.startsWith(prefix)) ?? path;
  const key = `${ip}:${bucketPath}`;
  const record = IP_RATE_LIMIT_MAP.get(key);

  if (!record || now > record.resetAt) {
    IP_RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://generativelanguage.googleapis.com https://api.deepseek.com https://challenges.cloudflare.com http://localhost:8000 https://alumni-restapi.onrender.com",
      "media-src 'self' https://d8j0ntlcm91z4.cloudfront.net blob:",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  return response;
}

// Daftar rute yang TIDAK memerlukan autentikasi
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/login',    // API untuk login
  '/api/register', // API untuk register
  '/api/forgot-password',
  '/api/reset-password',
  '/api/logout',   // API untuk logout
  '/api/me',
  '/api/security/turnstile',
  '/api/test-db',
  '/favicon.ico',
  '/landing',
  '/preview',
];

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  console.log(`[MIDDLEWARE] Mencegat permintaan untuk: ${currentPath}`);
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';

  if (!checkRateLimit(ip, currentPath)) {
    return applySecurityHeaders(
      NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, { status: 429 })
    );
  }

  // Log semua cookie yang diterima oleh middleware
  console.log('[MIDDLEWARE] Semua Cookie yang diterima oleh Middleware:');
  const allCookies = request.cookies.getAll();
  if (allCookies.length > 0) {
    allCookies.forEach(cookie => {
      // Log hanya beberapa karakter pertama dari nilai cookie untuk keamanan
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, Math.min(cookie.value.length, 10))}...`);
    });
  } else {
    console.log('  - Tidak ada cookie yang diterima.');
  }

  // Periksa apakah path adalah public (tidak perlu autentikasi)
  const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(path + '/'));

  // Ambil token dari HTTP-only cookie yang Anda set di /api/login
  const authToken = request.cookies.get('auth_token')?.value;
  console.log(`[MIDDLEWARE] Menerima cookie 'auth_token': ${authToken ? 'Ada' : 'Tidak Ada'}`);

  let isAuthenticated = false;
  let decodedToken: Awaited<ReturnType<typeof verifyAuthToken>> | null = null;

  // Verifikasi token jika ada
  if (authToken) {
    try {
      decodedToken = await verifyAuthToken(authToken);
      isAuthenticated = true;
      console.log('[MIDDLEWARE] Token berhasil diverifikasi oleh JOSE. Payload:', decodedToken);
    } catch (error: unknown) {
      // Jika token tidak valid (kadaluwarsa, tanda tangan salah, dll.)
      const message = error instanceof Error ? error.message : String(error);
      console.error('[MIDDLEWARE] Verifikasi token JOSE gagal:', message);
      isAuthenticated = false;
      decodedToken = null; // Set null jika tidak valid
    }
  }

  if (isAuthenticated && decodedToken?.sub) {
    const tokenAuthVersion = Number(decodedToken.auth_version ?? 1);
    const currentAuthVersion = await getAuthSessionVersionForMiddleware(String(decodedToken.sub));

    if (currentAuthVersion !== null && tokenAuthVersion < currentAuthVersion) {
      console.log('[MIDDLEWARE] Auth token version outdated. Invalidating session cookie.');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(AUTH_COOKIE_NAME);
      return applySecurityHeaders(response);
    }
  }

  // --- Logika Autentikasi dan Pengalihan ---

  // Skenario 1: User TIDAK terautentikasi dan mencoba mengakses rute yang terproteksi
  if (!isAuthenticated && !isPublicPath) {
    console.log('[MIDDLEWARE] Tidak ada auth_token atau token tidak valid. Mengalihkan ke /landing.');
    const response = NextResponse.redirect(new URL('/landing', request.url));
    // Hapus cookie yang mungkin rusak/kadaluarsa
    response.cookies.delete('auth_token');
    return applySecurityHeaders(response);
  }

  // Skenario 2: User SUDAH terautentikasi dan mencoba mengakses rute login/register
  if (isAuthenticated && isPublicPath && (currentPath.startsWith('/login') || currentPath.startsWith('/register'))) {
    console.log('[MIDDLEWARE] User sudah terautentikasi dan berada di halaman publik. Mengalihkan ke beranda (/).');
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const profileCompleted = Boolean(decodedToken?.profile_completed);
  const mustChangePassword = Boolean(decodedToken?.must_change_password);
  const allowIncompleteProfilePath =
    currentPath.startsWith('/complete-profile') ||
    currentPath.startsWith('/api/complete-profile') ||
    currentPath.startsWith('/api/get-profile') ||
    currentPath.startsWith('/api/me') ||
    currentPath.startsWith('/api/logout');

  const allowMustChangePasswordPath =
    currentPath.startsWith('/settings') ||
    currentPath.startsWith('/api/account-settings') ||
    currentPath.startsWith('/complete-profile') ||
    currentPath.startsWith('/api/complete-profile') ||
    currentPath.startsWith('/api/get-profile') ||
    currentPath.startsWith('/api/me') ||
    currentPath.startsWith('/api/logout');

  if (isAuthenticated && !profileCompleted && !allowIncompleteProfilePath) {
    console.log('[MIDDLEWARE] Profil belum lengkap. Mengalihkan ke /complete-profile.');
    const url = request.nextUrl.clone();
    url.pathname = '/complete-profile';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  if (isAuthenticated && mustChangePassword && profileCompleted && !allowMustChangePasswordPath) {
    console.log('[MIDDLEWARE] Password sementara terdeteksi. Mengalihkan ke /settings.');
    const url = request.nextUrl.clone();
    url.pathname = '/settings';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  if (isAuthenticated && profileCompleted && currentPath.startsWith('/complete-profile')) {
    console.log('[MIDDLEWARE] Profil sudah lengkap. Mengalihkan dari complete-profile ke beranda (/).');
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  const requestHeaders = new Headers(request.headers);
  if (isAuthenticated && decodedToken) {
    requestHeaders.set('x-user-id', decodedToken.sub ?? '');
    requestHeaders.set('x-user-email', decodedToken.email ?? '');
    if (decodedToken.role) {
      requestHeaders.set('x-user-role', decodedToken.role);
    }
    requestHeaders.set('x-user-profile-completed', String(profileCompleted));
    requestHeaders.set('x-user-must-change-password', String(mustChangePassword));
    console.log(`[MIDDLEWARE] Pengguna terautentikasi (ID: ${decodedToken.sub}). Lanjutkan ke ${currentPath}.`);
  }

  console.log('--- MIDDLEWARE FINISHED (No redirect) ---');
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applySecurityHeaders(response);
}

// Konfigurasi matcher
export const config = {
  matcher: [
    // Lindungi semua route kecuali asset statis (dengan ekstensi) dan halaman auth publik.
    '/((?!_next/static|_next/image|favicon.ico|logo\\.png|logo_icon\\.png|login|register|.*\\..*).*)',
  ],
};
