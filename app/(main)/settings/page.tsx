'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface MeResponse {
  userId: string;
  email: string;
  role: string;
  profileCompleted: boolean;
}

interface AccountResponse {
  id: number;
  email: string;
  username: string | null;
  role: string | null;
  mustChangePassword?: boolean;
  lastSecurityEvent?: {
    eventType: string;
    createdAt: string;
    ipAddress: string | null;
  } | null;
}

interface ProfileSummary {
  kota_domisili?: string | null;
  aktivitas?: string[] | string | null;
  skill_gabungan?: string | null;
  bahasa_dikuasai?: string | null;
}

function normalizeAktivitas(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [userId, setUserId] = useState('');
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [kotaDomisili, setKotaDomisili] = useState('');
  const [aktivitasInput, setAktivitasInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [bahasaInput, setBahasaInput] = useState('');

  const formatEventType = (eventType: string) => {
    switch (eventType) {
      case 'account_settings_updated':
        return 'Pengaturan akun diperbarui';
      case 'wrong_current_password':
        return 'Percobaan password saat ini gagal';
      default:
        return eventType;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meRes, accountRes, profileRes] = await Promise.all([
          fetch('/api/me', { cache: 'no-store' }),
          fetch('/api/account-settings', { cache: 'no-store' }),
          fetch('/api/get-profile', { cache: 'no-store' }),
        ]);

        if (!meRes.ok) {
          throw new Error('Sesi login tidak valid. Silakan login ulang.');
        }

        if (!accountRes.ok) {
          const accountBody = await accountRes.json();
          throw new Error(accountBody.error || 'Gagal memuat pengaturan akun.');
        }

        const meBody = (await meRes.json()) as MeResponse;
        const accountBody = (await accountRes.json()) as AccountResponse;

        setUserId(meBody.userId);
        setProfileCompleted(Boolean(meBody.profileCompleted));
        setAccount(accountBody);
        setNewEmail(accountBody.email || '');

        if (profileRes.ok) {
          const profileBody = (await profileRes.json()) as ProfileSummary;
          setProfile(profileBody);
          setKotaDomisili(profileBody.kota_domisili || '');
          setAktivitasInput(normalizeAktivitas(profileBody.aktivitas).join(', '));
          setSkillInput(profileBody.skill_gabungan || '');
          setBahasaInput(profileBody.bahasa_dikuasai || '');
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Gagal memuat halaman pengaturan.';
        toast.error('Tidak bisa memuat pengaturan.', { description: message });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const aktivitasRingkas = useMemo(() => {
    return normalizeAktivitas(profile?.aktivitas).join(', ') || 'Belum diisi';
  }, [profile?.aktivitas]);

  const handleSaveAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword.trim()) {
      toast.error('Password saat ini wajib diisi.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Konfirmasi password baru tidak sama.');
      return;
    }

    if (account?.mustChangePassword && !newPassword.trim()) {
      toast.error('Anda wajib mengisi Password Baru sebelum melanjutkan.');
      return;
    }

    setSavingAccount(true);

    try {
      const payload: { currentPassword: string; newEmail?: string; newPassword?: string } = {
        currentPassword,
      };

      if (account && newEmail.trim() && newEmail.trim().toLowerCase() !== account.email.toLowerCase()) {
        payload.newEmail = newEmail.trim().toLowerCase();
      }

      if (newPassword.trim()) {
        payload.newPassword = newPassword.trim();
      }

      if (!payload.newEmail && !payload.newPassword) {
        toast.info('Tidak ada perubahan untuk disimpan.');
        setSavingAccount(false);
        return;
      }

      const response = await fetch('/api/account-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Gagal memperbarui pengaturan akun.');
      }

      setAccount(body.user);
      setNewEmail(body.user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success('Pengaturan akun berhasil diperbarui.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan akun.';
      toast.error('Perubahan akun gagal disimpan.', { description: message });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!kotaDomisili.trim() || !aktivitasInput.trim() || !skillInput.trim() || !bahasaInput.trim()) {
      toast.error('Semua field pengaturan profil wajib diisi.');
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch('/api/profile-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kota_domisili: kotaDomisili,
          aktivitas: aktivitasInput,
          skill_gabungan: skillInput,
          bahasa_dikuasai: bahasaInput,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || 'Gagal memperbarui pengaturan profil.');
      }

      setProfile(body.profile);
      toast.success('Pengaturan profil berhasil diperbarui.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan profil.';
      toast.error('Perubahan profil gagal disimpan.', { description: message });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">
        Memuat pengaturan akun dan profil...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 stagger-children">
      {account?.mustChangePassword ? (
        <div
          className="rounded-2xl border-2 p-5 shadow-md"
          style={{
            borderColor: '#ef4444',
            backgroundColor: '#fee2e2',
          }}
        >
          <h2
            className="text-base font-extrabold flex items-center gap-2"
            style={{ color: '#7f1d1d' }}
          >
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
            >
              !
            </span>
            Tindakan Wajib: Ganti Password Sekarang
          </h2>
          <p className="mt-2 text-sm font-medium" style={{ color: '#991b1b' }}>
            Akun Anda masih menggunakan password sementara (default dari email). Demi keamanan, Anda harus mengisi Password Baru dan menyimpan perubahan akun sebelum dapat menggunakan pengaturan profil lainnya.
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1b1f23] p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Pengaturan Akun & Profil</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Kelola kredensial login Anda secara aman sekaligus perbarui identitas profesional yang tampil di HubTalent.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="premium-light-card liquid-glass-border">
        <CardHeader>
          <CardTitle className="text-xl">Pengaturan Akun</CardTitle>
          <CardDescription>
            Kelola data akun dasar Anda seperti email login dan password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSaveAccount}>
            {account?.mustChangePassword ? (
              <div
                className="rounded-lg border-l-4 border p-3 text-xs font-semibold"
                style={{
                  borderLeftColor: '#d97706',
                  borderColor: '#f59e0b',
                  backgroundColor: '#fef3c7',
                  color: '#78350f',
                }}
              >
                Anda masih menggunakan password sementara (default dari email). Segera isi Password Baru lalu simpan perubahan akun.
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input value={account?.username || '-'} readOnly className="bg-slate-100 dark:bg-slate-900/50" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="nama@email.com"
                disabled={Boolean(account?.mustChangePassword)}
              />
              {account?.mustChangePassword ? (
                <p className="text-xs font-semibold" style={{ color: '#92400e' }}>
                  Perubahan email dinonaktifkan sementara sampai password diganti.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password Saat Ini (wajib untuk menyimpan perubahan)</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Masukkan password saat ini"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password Baru (opsional)</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Konfirmasi Password Baru</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi password baru"
              />
            </div>

            <Button type="submit" disabled={savingAccount} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
              {savingAccount ? 'Menyimpan Perubahan Akun...' : 'Simpan Pengaturan Akun'}
            </Button>

            <div className="rounded-lg border p-3 text-xs bg-slate-50/80 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Aktivitas keamanan terakhir</p>
              {account?.lastSecurityEvent ? (
                <>
                  <p>{formatEventType(account.lastSecurityEvent.eventType)}</p>
                  <p>{new Date(account.lastSecurityEvent.createdAt).toLocaleString('id-ID')}</p>
                  <p>IP: {account.lastSecurityEvent.ipAddress || 'tidak tersedia'}</p>
                </>
              ) : (
                <p>Belum ada catatan aktivitas keamanan.</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="premium-light-card liquid-glass-border">
        <CardHeader>
          <CardTitle className="text-xl">Pengaturan Profil</CardTitle>
          <CardDescription>
            Perbarui informasi profesional, domisili, aktivitas, dan data profil publik Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {account?.mustChangePassword ? (
            <div
              className="rounded-lg border-l-4 border p-3 text-xs font-semibold"
              style={{
                borderLeftColor: '#d97706',
                borderColor: '#f59e0b',
                backgroundColor: '#fef3c7',
                color: '#78350f',
              }}
            >
              Pengaturan profil dikunci sementara. Selesaikan perubahan password terlebih dahulu di panel Pengaturan Akun.
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSaveProfile}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Domisili</label>
              <Input
                value={kotaDomisili}
                onChange={(event) => setKotaDomisili(event.target.value)}
                placeholder="Contoh: Bandung"
                disabled={Boolean(account?.mustChangePassword)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Aktivitas / Pekerjaan</label>
              <Input
                value={aktivitasInput}
                onChange={(event) => setAktivitasInput(event.target.value)}
                placeholder="Contoh: Pekerja, Entrepreneur"
                disabled={Boolean(account?.mustChangePassword)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Keahlian Utama</label>
              <Input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                placeholder="Contoh: Product Management, UI/UX"
                disabled={Boolean(account?.mustChangePassword)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bahasa yang Dikuasai</label>
              <Input
                value={bahasaInput}
                onChange={(event) => setBahasaInput(event.target.value)}
                placeholder="Contoh: Bahasa Indonesia, English"
                disabled={Boolean(account?.mustChangePassword)}
              />
            </div>

            <Button type="submit" disabled={savingProfile || Boolean(account?.mustChangePassword)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
              {savingProfile ? 'Menyimpan Perubahan Profil...' : 'Simpan Pengaturan Profil'}
            </Button>
          </form>

          <div className="rounded-lg border p-4 text-sm space-y-2 bg-slate-50/80 dark:bg-slate-900/30">
            <p><span className="font-semibold">Preview Aktivitas:</span> {aktivitasRingkas}</p>
            <p><span className="font-semibold">Preview Keahlian:</span> {profile?.skill_gabungan || 'Belum diisi'}</p>
            <p><span className="font-semibold">Preview Bahasa:</span> {profile?.bahasa_dikuasai || 'Belum diisi'}</p>
          </div>

          {userId ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={profileCompleted ? `/profile/edit/${userId}` : '/complete-profile'}>
                {profileCompleted ? 'Edit Profil Lengkap (Advanced)' : 'Lengkapi Profil Wajib'}
              </Link>
            </Button>
          ) : (
            <p className="text-sm text-amber-600">User ID tidak ditemukan. Silakan muat ulang halaman.</p>
          )}

          {userId ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/profile/${userId}`}>Kembali ke Halaman Profil</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
