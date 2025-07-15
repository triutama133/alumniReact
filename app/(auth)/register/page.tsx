// app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null);
    setIsLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan saat pendaftaran.');
        console.error('API Register Error:', data.error);
      } else {
        setSuccessMessage(data.message || 'Pendaftaran berhasil!');
        // Perbaikan: Arahkan ke halaman complete-profile setelah pendaftaran berhasil
        console.log('[CLIENT] Pendaftaran berhasil. Mengarahkan ke halaman lengkapi profil...');
        router.push('/complete-profile'); // Arahkan ke halaman complete-profile
      }

    } catch (err: unknown) { // Perbaikan: Ganti 'any' dengan 'unknown'
      setError('Terjadi kesalahan jaringan atau yang tidak terduga saat pendaftaran.');
      console.error('[CLIENT] Unexpected error during registration process:', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Daftar Akun Baru</CardTitle>
          <CardDescription>Buat akun Anda untuk mengakses Indonesia Talent Hub.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="grid gap-4">
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
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sedang mendaftar...' : 'Daftar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Sudah punya akun?{' '}
            <Link href="/login" className="underline">
              Login disini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
