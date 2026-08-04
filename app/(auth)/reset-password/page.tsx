'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError('Token reset tidak ditemukan di URL.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Gagal mereset password.');
        return;
      }

      setSuccessMessage(data.message || 'Password berhasil diperbarui. Silakan login.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        router.replace('/login');
      }, 1200);
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 stagger-children">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Atur Ulang Password</CardTitle>
          <CardDescription>Masukkan password baru yang kuat untuk akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-3">
              <p className="text-sm text-red-500">Token reset tidak valid atau tidak tersedia.</p>
              <Link href="/forgot-password" className="underline text-sm">
                Minta tautan reset baru
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Minimal 10 karakter, huruf besar/kecil, angka, simbol"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Memproses...' : 'Simpan Password Baru'}
              </Button>
            </form>
          )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-500 animate-pulse">Memuat form atur ulang password...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
