// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose'; // Import the jose library

// Daftar rute yang TIDAK memerlukan autentikasi
const publicPaths = [
  '/login',
  '/register',
  '/api/login',    // API untuk login
  '/api/register', // API untuk register
  '/api/logout',   // API untuk logout
  '/favicon.ico',
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
  const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));

  // Ambil token dari HTTP-only cookie yang Anda set di /api/login
  const authToken = request.cookies.get('auth_token')?.value;
  console.log(`[MIDDLEWARE] Menerima cookie 'auth_token': ${authToken ? 'Ada' : 'Tidak Ada'}`);

  let isAuthenticated = false;
  let decodedToken: jose.JWTPayload | null = null; // Ganti tipe decodedToken ke JWTPayload dari jose

  // Verifikasi token jika ada
  if (authToken) {
    try {
      const jwtSecret = process.env.JWT_SECRET; // Ambil JWT_SECRET dari .env.local

      if (!jwtSecret) {
        console.error('[MIDDLEWARE] ERROR: JWT_SECRET tidak terdefinisi di middleware. Pastikan di .env.local');
        isAuthenticated = false;
      } else {
        // Perbaikan: Gunakan jose.jwtVerify untuk verifikasi
        // Secret harus dalam bentuk Uint8Array
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jose.jwtVerify(authToken, secret, {
            algorithms: ['HS256'], // Sesuaikan dengan algoritma yang Anda gunakan saat menandatangani (misal: HS256)
            audience: 'authenticated' // Pastikan ini cocok dengan klaim 'aud' di JWT Anda
        });
        
        decodedToken = payload;
        isAuthenticated = true;
        console.log('[MIDDLEWARE] Token berhasil diverifikasi oleh JOSE. Payload:', decodedToken);
      }
    } catch (error: any) {
      // Jika token tidak valid (kadaluwarsa, tanda tangan salah, dll.)
      console.error('[MIDDLEWARE] Verifikasi token JOSE gagal:', error.message);
      isAuthenticated = false;
      decodedToken = null; // Set null jika tidak valid
    }
  }

  // --- Logika Autentikasi dan Pengalihan ---

  // Skenario 1: User TIDAK terautentikasi dan mencoba mengakses rute yang terproteksi
  if (!isAuthenticated && !isPublicPath) {
    console.log('[MIDDLEWARE] Tidak ada auth_token atau token tidak valid. Mengalihkan ke /login.');
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Hapus cookie yang mungkin rusak/kadaluarsa
    response.cookies.delete('auth_token');
    return response;
  }

  // Skenario 2: User SUDAH terautentikasi dan mencoba mengakses rute login/register
  if (isAuthenticated && isPublicPath && (currentPath.startsWith('/login') || currentPath.startsWith('/register'))) {
    console.log('[MIDDLEWARE] User sudah terautentikasi dan berada di halaman login/register. Mengalihkan ke beranda (/).');
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Jika autentikasi berhasil, inject klaim user ke header permintaan
  // Ini berguna untuk Server Components atau API Routes yang butuh info user
  const response = NextResponse.next();
  if (isAuthenticated && decodedToken) {
    response.headers.set('x-user-id', decodedToken.sub as string);
    response.headers.set('x-user-email', decodedToken.email as string);
    // Tambahkan klaim lain yang Anda simpan di JWT
    if (decodedToken.role) {
      response.headers.set('x-user-role', decodedToken.role as string);
    }
    console.log(`[MIDDLEWARE] Pengguna terautentikasi (ID: ${decodedToken.sub}). Lanjutkan ke ${currentPath}.`);
  } else {
    // Pastikan header tidak ada jika tidak terautentikasi
    response.headers.delete('x-user-id');
    response.headers.delete('x-user-email');
    response.headers.delete('x-user-role');
  }

  console.log('--- MIDDLEWARE FINISHED (No redirect) ---');
  return response;
}

// Konfigurasi matcher
export const config = {
  matcher: [
    // Kecualikan semua API routes dan aset statis yang tidak perlu dilindungi
    // (api/login, api/register, api/logout, api/test-db sudah ditangani di publicPaths)
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
};
