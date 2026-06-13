// app/api/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('--- Memulai Permintaan Logout API ---');
  const response = NextResponse.redirect(new URL('/login', req.url)); // Alihkan ke halaman login

  // Hapus cookie auth_token
  // Menggunakan delete() adalah cara yang aman dan disarankan untuk menghapus cookie.
  response.cookies.delete('auth_token');

  console.log('[LOGOUT API] auth_token cookie telah dihapus. Mengalihkan ke /login.');
  return response;
}