// app/(auth)/login/page.tsx
'use client' // Wajib untuk halaman interaktif

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter() // router masih diperlukan untuk logout

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    console.log('[CLIENT] Tombol Login ditekan.');
    console.log(`[CLIENT] Mengirim: Email=${email}, Password (panjang)=${password.length}`);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        redirect: 'follow'
      })

      console.log(`[CLIENT] Respons Fetch diterima, status: ${response.status}. Redirected: ${response.redirected}, Final URL: ${response.url}`);
      
      if (response.ok && response.redirected && new URL(response.url).pathname === '/') {
        console.log('[CLIENT] Fetch berhasil mengikuti redirect ke halaman beranda. Mengalihkan secara klien untuk memastikan rendering.');
        router.replace('/');
        console.log('[CLIENT] Client-side router.replace("/") telah dieksekusi setelah deteksi redirect server.');
        return; 
      }

      // Perbaikan: Baca respons sebagai teks terlebih dahulu
      const responseText = await response.text();
      console.log('[CLIENT] Respons server sebagai teks (lengkap):', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')); // Log lengkap, potong jika terlalu panjang

      let data;
      try {
        data = JSON.parse(responseText); // Coba parse teks sebagai JSON
        console.log('[CLIENT] Data respons JSON (jika tidak dialihkan ke halaman):', data);
      } catch (jsonParseError) {
        console.error('[CLIENT] Gagal parse respons sebagai JSON:', jsonParseError);
        setError('Terjadi kesalahan tak terduga dari server: Respons tidak valid.');
        return;
      }

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan saat login.');
        console.error('[CLIENT] API Login Error (dari server):', data.error);
        return;
      }

      console.warn('[CLIENT] Server tidak melakukan redirect setelah login (status 200 OK). Ini tidak diharapkan. Mungkin ada masalah dengan implementasi API route server.');
      router.replace('/');

    } catch (err: any) {
      setError('Terjadi kesalahan jaringan atau yang tidak terduga.');
      console.error('[CLIENT] Unexpected error during login process:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = () => {
    console.log('[CLIENT] Menjalankan logout kustom...');
    router.push('/api/logout'); 
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Indonesia Talent Hub</CardTitle>
          <CardDescription>Silahkan login untuk melanjutkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sedang memproses...' : 'Login'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Belum punya akun?{' '}
            <Link href="/register" className="underline">
              Daftar disini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
