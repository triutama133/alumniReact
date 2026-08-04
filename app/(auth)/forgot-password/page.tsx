'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTurnstileConfig = async () => {
      try {
        const response = await fetch('/api/security/turnstile', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        setTurnstileSiteKey(data.siteKey || '');
      } catch {
        setTurnstileSiteKey('');
      }
    };

    fetchTurnstileConfig();
  }, []);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!turnstileToken) {
      setError('Selesaikan captcha terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          turnstileToken,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Gagal memproses permintaan reset password.');
        setTurnstileToken('');
        setTurnstileResetSignal((prev) => prev + 1);
        return;
      }

      setSuccessMessage(data.message || 'Jika email terdaftar, tautan reset telah dikirimkan.');
      setEmail('');
      setTurnstileToken('');
      setTurnstileResetSignal((prev) => prev + 1);
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
      setTurnstileToken('');
      setTurnstileResetSignal((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 stagger-children">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Lupa Password</CardTitle>
          <CardDescription>Masukkan email akun Anda untuk menerima tautan reset password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
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
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

            <Button type="submit" className="w-full" disabled={isLoading || !turnstileToken}>
              {isLoading ? 'Memproses...' : 'Kirim Tautan Reset'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Kembali ke{' '}
            <Link href="/login" className="underline">
              halaman login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
