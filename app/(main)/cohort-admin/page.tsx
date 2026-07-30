// app/(main)/cohort-admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shield, Users, Settings, UserMinus, UserCheck, Plus, AlertCircle, RefreshCw, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { playClickSound } from '@/lib/audio';

export default function CohortAdminPage() {
  const [activeCohort, setActiveCohort] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit details form state
  const [cohortName, setCohortName] = useState('');
  const [cohortDesc, setCohortDesc] = useState('');
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);

  // Invite member state
  const [inviteInput, setInviteInput] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const activeCohortId = getCookie('active_cohort_id');

  const fetchData = async () => {
    if (!activeCohortId || activeCohortId === 'global') {
      setError('Tidak ada komunitas aktif terpilih. Pilih salah satu komunitas di Navbar.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch user's cohorts to find metadata and role
      const cohortsRes = await fetch('/api/cohorts');
      if (!cohortsRes.ok) throw new Error('Gagal memuat profil komunitas.');
      
      const cohortsData = await cohortsRes.json();
      const active = cohortsData.find((c: any) => String(c.id) === activeCohortId);
      
      if (!active) {
        throw new Error('Komunitas tidak ditemukan atau Anda bukan bagian dari komunitas ini.');
      }

      if (active.role !== 'admin') {
        throw new Error('Akses ditolak. Anda bukan Admin di komunitas ini.');
      }

      setActiveCohort(active);
      setCohortName(active.name);
      setCohortDesc(active.description || '');

      // 2. Fetch cohort members
      const membersRes = await fetch(`/api/cohorts/${activeCohortId}/members`);
      if (!membersRes.ok) throw new Error('Gagal memuat daftar anggota.');
      
      const membersData = await membersRes.json();
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCohortId]);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortName.trim()) return;

    playClickSound();
    setIsUpdatingDetails(true);

    try {
      const res = await fetch(`/api/cohorts/${activeCohortId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_cohort_details',
          name: cohortName,
          description: cohortDesc,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal memperbarui profil.');

      toast.success('Profil komunitas berhasil diperbarui!');
      await fetchData(); // Reload details
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    playClickSound();
    setIsInviting(true);

    try {
      const res = await fetch(`/api/cohorts/${activeCohortId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: inviteInput }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Gagal mengundang anggota.');

      toast.success(`Anggota "${inviteInput}" berhasil ditambahkan!`);
      setInviteInput('');
      await fetchData(); // Reload members list
    } catch (err: any) {
      toast.error('Gagal menambahkan', { description: err.message });
    } finally {
      setIsInviting(false);
    }
  };

  const handleMemberAction = async (action: string, targetUserId: number, extra = {}) => {
    playClickSound();
    const actionKey = `${action}-${targetUserId}`;
    setActionLoading(actionKey);

    try {
      const res = await fetch(`/api/cohorts/${activeCohortId}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetUserId, ...extra }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Tindakan gagal.');

      toast.success(resData.message || 'Tindakan berhasil dijalankan.');
      await fetchData(); // Reload members
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const getDaysRemaining = (expiresAtStr: string | null) => {
    if (!expiresAtStr) return 0;
    const expires = new Date(expiresAtStr);
    const diffTime = expires.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 text-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
        <p className="text-sm">Memuat Konsol Admin Komunitas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-16 max-w-md text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Akses Terbatas / Kesalahan</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error}</p>
        <Button onClick={() => window.location.href = '/'} className="mt-6 bg-indigo-600 text-white rounded-full"> Kembali ke Beranda </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8 stagger-children">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{activeCohort.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Konsol Manajemen & Pengaturan Komunitas Eksklusif Anda</p>
          </div>
        </div>

        {/* Quick Expiry badge */}
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border-slate-200 text-slate-650 dark:bg-slate-900/60 dark:border-white/5 dark:text-slate-300 rounded-full text-xs font-semibold">
          <Clock className="h-3.5 w-3.5 text-indigo-500" />
          <span>Sisa Langganan: <strong className="text-slate-900 dark:text-white">{getDaysRemaining(activeCohort.expires_at)} Hari</strong></span>
        </Badge>
      </div>

      {/* Grid: Edit Profil & Member Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Profile & Stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Cohort Stats Card */}
          <Card className="premium-light-card liquid-glass-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase text-slate-400">Statistik Komunitas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-xl p-3 text-center">
                <Users className="h-5 w-5 text-indigo-500 mx-auto mb-1.5" />
                <div className="text-lg font-bold text-slate-900 dark:text-white">{members.length}</div>
                <div className="text-[10px] text-slate-500">Anggota</div>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-xl p-3 text-center">
                <Clock className="h-5 w-5 text-indigo-500 mx-auto mb-1.5" />
                <div className="text-lg font-bold text-slate-900 dark:text-white">{activeCohort.subscription_plan}</div>
                <div className="text-[10px] text-slate-500">Paket</div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Cohort Details Form */}
          <Card className="premium-light-card liquid-glass-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-indigo-500" />
                <CardTitle className="text-base font-bold">Profil Komunitas</CardTitle>
              </div>
              <CardDescription className="text-xs">Ubah data visual komunitas yang ditampilkan ke anggota.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Komunitas</label>
                  <Input
                    value={cohortName}
                    onChange={(e) => setCohortName(e.target.value)}
                    placeholder="Nama Komunitas..."
                    className="h-9 bg-slate-50 border-slate-200 text-xs dark:bg-slate-900/50 dark:border-white/5 dark:text-white rounded-lg focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Deskripsi</label>
                  <Textarea
                    value={cohortDesc}
                    onChange={(e) => setCohortDesc(e.target.value)}
                    placeholder="Deskripsi atau visi misi..."
                    className="bg-slate-50 border-slate-200 text-xs dark:bg-slate-900/50 dark:border-white/5 dark:text-white rounded-lg resize-none focus:border-indigo-500"
                    rows={4}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isUpdatingDetails || !cohortName.trim()} 
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                >
                  {isUpdatingDetails ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Member Management */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="premium-light-card liquid-glass-border">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
              <div>
                <CardTitle className="text-lg font-bold">Daftar Anggota</CardTitle>
                <CardDescription className="text-xs">Kelola wewenang role dan keanggotaan kelompok komunitas.</CardDescription>
              </div>
              
              {/* Add member inline form */}
              <form onSubmit={handleInviteMember} className="flex gap-2 w-full sm:w-auto">
                <Input
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  placeholder="Email / username anggota..."
                  className="h-8 bg-slate-50 border-slate-200 text-xs dark:bg-slate-900/40 dark:border-white/5 dark:text-white rounded-md w-full sm:w-48 placeholder:text-slate-400"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isInviting || !inviteInput.trim()} 
                  size="sm"
                  className="h-8 bg-indigo-650 hover:bg-indigo-600 text-white text-xs rounded-md flex gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Undang</span>
                </Button>
              </form>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {members.length > 0 ? (
                  members.map((member) => {
                    const actionKey = (actName: string) => `${actName}-${member.user_id}`;
                    return (
                      <div key={member.user_id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            {member.nama_lengkap}
                            {member.nama_panggilan && (
                              <span className="text-xs font-normal text-slate-400">({member.nama_panggilan})</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${member.role === 'admin' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' : 'border-slate-500/20 text-slate-500'}`}>
                            {member.role}
                          </Badge>

                          <div className="flex gap-1.5 border-l border-slate-200 dark:border-white/5 pl-3 ml-2">
                            {member.role === 'admin' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionLoading !== null}
                                onClick={() => handleMemberAction('update_member_role', member.user_id, { newRole: 'member' })}
                                className="h-7 text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-2"
                                title="Jadikan Anggota Biasa"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionLoading !== null}
                                onClick={() => handleMemberAction('update_member_role', member.user_id, { newRole: 'admin' })}
                                className="h-7 text-[10px] text-amber-500 hover:text-amber-600 p-2"
                                title="Jadikan Admin"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={actionLoading !== null}
                              onClick={() => {
                                if (confirm(`Keluarkan ${member.nama_lengkap} dari komunitas?`)) {
                                  handleMemberAction('remove_member', member.user_id);
                                }
                              }}
                              className="h-7 text-[10px] text-rose-500 hover:text-rose-600 p-2"
                              title="Keluarkan Anggota"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-550 text-xs">Belum ada anggota terdaftar.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
