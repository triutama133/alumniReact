// app/(auth)/login/page.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TurnstileWidget } from '@/components/auth/TurnstileWidget'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('')
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false)
  const router = useRouter()

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!turnstileToken) {
      setError('Selesaikan captcha terlebih dahulu.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, turnstileToken }),
        redirect: 'follow'
      })
      
      if (response.ok) {
        setIsRedirecting(true);
        router.replace('/');
        return; 
      }

      const data = await response.json();

      setError(data.error || 'Terjadi kesalahan saat login.');
      setTurnstileToken('')
      setTurnstileResetSignal((prev) => prev + 1)
      setIsLoading(false);

    } catch (err: unknown) {
      setError('Terjadi kesalahan jaringan atau yang tidak terduga.');
      console.error('[CLIENT] Unexpected error during login process:', (err as Error).message);
      setTurnstileToken('')
      setTurnstileResetSignal((prev) => prev + 1)
      setIsLoading(false);
    }
  }

  // Perbaikan: handleLogout tidak lagi digunakan karena tombol logout ada di Navbar
  // const handleLogout = () => {
  //   console.log('[CLIENT] Menjalankan logout kustom...');
  //   router.push('/api/logout'); 
  //   router.refresh();
  // };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 stagger-children">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">HubTalent</CardTitle>
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
                disabled={isLoading || isRedirecting}
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
                disabled={isLoading || isRedirecting}
              />
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs underline text-slate-600 hover:text-slate-900">
                  Lupa password?
                </Link>
              </div>
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
            <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isLoading || isRedirecting || !turnstileToken}>
              {(isLoading || isRedirecting) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRedirecting ? 'Mengalihkan ke beranda...' : isLoading ? 'Sedang memproses...' : 'Login'}
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
