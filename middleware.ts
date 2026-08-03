// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

// Daftar rute yang TIDAK memerlukan autentikasi
const publicPaths = [
  '/login',
  '/register',
  '/api/login',    // API untuk login
  '/api/register', // API untuk register
  '/api/logout',   // API untuk logout
  '/api/me',
  '/api/test-db',
  '/favicon.ico',
  '/landing',
];

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  console.log(`[MIDDLEWARE] Mencegat permintaan untuk: ${currentPath}`);

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
  const isProjectDetailPath = /^\/projects\/[0-9a-fA-F-]{36}$/.test(currentPath);
  const isPublicPath = isProjectDetailPath || publicPaths.some(path => currentPath === path || currentPath.startsWith(path + '/'));

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

  // --- Logika Autentikasi dan Pengalihan ---

  // Skenario 1: User TIDAK terautentikasi dan mencoba mengakses rute yang terproteksi
  if (!isAuthenticated && !isPublicPath) {
    console.log('[MIDDLEWARE] Tidak ada auth_token atau token tidak valid. Mengalihkan ke /landing.');
    const response = NextResponse.redirect(new URL('/landing', request.url));
    // Hapus cookie yang mungkin rusak/kadaluarsa
    response.cookies.delete('auth_token');
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  // Skenario 2: User SUDAH terautentikasi dan mencoba mengakses rute login/register
  if (isAuthenticated && isPublicPath && (currentPath.startsWith('/login') || currentPath.startsWith('/register'))) {
    console.log('[MIDDLEWARE] User sudah terautentikasi dan berada di halaman publik. Mengalihkan ke beranda (/).');
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
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
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  if (isAuthenticated && mustChangePassword && profileCompleted && !allowMustChangePasswordPath) {
    console.log('[MIDDLEWARE] Password sementara terdeteksi. Mengalihkan ke /settings.');
    const url = request.nextUrl.clone();
    url.pathname = '/settings';
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  if (isAuthenticated && profileCompleted && currentPath.startsWith('/complete-profile')) {
    console.log('[MIDDLEWARE] Profil sudah lengkap. Mengalihkan dari complete-profile ke beranda (/).');
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
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
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  return response;
}

// Konfigurasi matcher
export const config = {
  matcher: [
    // Lindungi semua route kecuali asset statis (.ext), robots, sitemap, dan halaman auth publik.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*|login|register|landing).*)',
  ],
};
