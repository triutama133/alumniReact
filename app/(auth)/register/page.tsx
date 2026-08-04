// app/(auth)/register/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
// router not needed here; using direct redirects when necessary
import Link from 'next/link'
// createClient tidak digunakan untuk pendaftaran ini lagi
// import { createClient } from '@/lib/supabaseClient' 
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTurnstileConfig = async () => {
      try {
        const response = await fetch('/api/security/turnstile', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        setTurnstileSiteKey(data.siteKey || '')
      } catch {
        setTurnstileSiteKey('')
      }
    }

    fetchTurnstileConfig()
  }, [])

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])
  

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null);
    setIsLoading(true)

    if (!turnstileToken) {
      setError('Selesaikan captcha terlebih dahulu.')
      setIsLoading(false)
      return
    }

    try {
      // Kirim kredensial ke API Route pendaftaran kustom Anda
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username, turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan saat pendaftaran.');
        setTurnstileToken('')
        setTurnstileResetSignal((prev) => prev + 1)
      } else {
        setSuccessMessage(data.message || 'Pendaftaran berhasil! Silakan login.');
        // Opsional: kosongkan form setelah sukses
        setEmail('');
        setPassword('');
        setUsername('');
        setTurnstileToken('')
        setTurnstileResetSignal((prev) => prev + 1)
        // router.push('/login?message=' + encodeURIComponent(data.message || 'Pendaftaran berhasil! Silakan login.'));
      }

    } catch (err: unknown) {
      setError('Terjadi kesalahan jaringan atau yang tidak terduga saat pendaftaran.');
      console.error('Unexpected error during registration process:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 stagger-children">
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
                placeholder="Minimal 10 karakter, kombinasi huruf besar/kecil, angka, simbol"
              />
              <p className="text-xs text-slate-500">
                Gunakan password yang kuat untuk melindungi akun Anda.
              </p>
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
                placeholder="Hanya huruf, angka, underscore"
              />
            </div>
            <div className="grid gap-2">
              <Label>Verifikasi Keamanan</Label>
              {turnstileSiteKey ? (
                <TurnstileWidget
                  siteKey={turnstileSiteKey}
                  onVerify={handleTurnstileVerify}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                  resetSignal={turnstileResetSignal}
                />
              ) : (
                <p className="text-xs text-amber-600">Captcha belum tersedia. Periksa konfigurasi Turnstile di server.</p>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || !turnstileToken}>
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
