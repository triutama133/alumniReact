// app/(main)/super-admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shield, Users, Layers, AlertCircle, Trash2, ShieldCheck, PlayCircle, StopCircle, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { playClickSound } from '@/lib/audio';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'cohorts' | 'users'>('cohorts');
  const [data, setData] = useState<{ cohorts: any[]; users: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/super-admin');
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Akses ditolak atau server bermasalah.');
      }
      setData(payload);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Super Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action: string, payload: any) => {
    playClickSound();
    const actionKey = `${action}-${payload.cohortId || payload.targetUserId}`;
    setActionLoading(actionKey);

    try {
      const res = await fetch('/api/super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal mengeksekusi tindakan.');
      }

      toast.success(resData.message || 'Tindakan berhasil dijalankan.');
      await fetchData(); // Reload listings
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto py-16 text-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-500" />
        <p className="text-sm">Memuat Konsol Super Admin...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-16 max-w-md text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Akses Terbatas / Kesalahan Sistem</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error}</p>
        <Button onClick={() => window.location.href = '/'} className="mt-6 bg-indigo-600 text-white rounded-full"> Kembali ke Beranda </Button>
      </div>
    );
  }

  const cohorts = data?.cohorts || [];
  const users = data?.users || [];

  // Filter lists based on search
  const filteredCohorts = cohorts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl stagger-children">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center">
          <Shield className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Super Admin Control Panel</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Halaman manajemen pusat platform (Khusus Lingkungan Lokal/Dev)</p>
        </div>
      </div>

      {/* Tabs Switcher & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-slate-200 dark:border-white/5 pb-4">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900/60 rounded-full border border-slate-200 dark:border-white/5 shadow-inner">
          <button
            onClick={() => { playClickSound(); setActiveTab('cohorts'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              activeTab === 'cohorts' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Kelompok Komunitas ({cohorts.length})</span>
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('users'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
              activeTab === 'users' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Manajemen Pengguna ({users.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'cohorts' ? "Cari nama komunitas..." : "Cari email atau username..."}
            className="pl-9 h-9 bg-slate-50 border-slate-200 text-xs dark:bg-slate-900 dark:border-white/5 dark:text-white rounded-full focus:border-indigo-500"
          />
        </div>
      </div>

      {/* COHORTS TAB VIEW */}
      {activeTab === 'cohorts' && (
        <Card className="premium-light-card liquid-glass-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-400 dark:text-slate-550 border-b border-slate-200 dark:border-white/5 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Komunitas</th>
                  <th className="py-3.5 px-4">Owner ID</th>
                  <th className="py-3.5 px-4">Plan / Status</th>
                  <th className="py-3.5 px-4">Masa Berlaku</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-700 dark:text-slate-300">
                {filteredCohorts.length > 0 ? (
                  filteredCohorts.map((cohort) => {
                    const actionKey = (actName: string) => `${actName}-${cohort.id}`;
                    return (
                      <tr key={cohort.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                          <div>{cohort.name}</div>
                          {cohort.description && (
                            <div className="text-[10px] text-slate-400 mt-0.5 font-normal line-clamp-1">{cohort.description}</div>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-450">{cohort.owner_id}</td>
                        <td className="py-4 px-4 space-x-1.5">
                          <Badge variant="outline" className="text-[9px] uppercase border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">{cohort.subscription_plan}</Badge>
                          <Badge variant="outline" className={`text-[9px] uppercase ${cohort.subscription_status === 'active' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5'}`}>{cohort.subscription_status}</Badge>
                        </td>
                        <td className="py-4 px-4 font-medium">{formatDate(cohort.expires_at)}</td>
                        <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading !== null}
                            onClick={() => handleAction('extend_cohort', { cohortId: cohort.id })}
                            className="h-7 text-[10px] border-slate-200 dark:border-white/10 rounded-md"
                          >
                            {actionLoading === actionKey('extend_cohort') ? 'Memperpanjang...' : 'Tambah 30 Hari'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading !== null}
                            onClick={() => handleAction('toggle_cohort_status', { cohortId: cohort.id, currentStatus: cohort.subscription_status })}
                            className={`h-7 text-[10px] rounded-md ${cohort.subscription_status === 'active' ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500/5' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5'}`}
                          >
                            {cohort.subscription_status === 'active' ? 'Suspend' : 'Aktifkan'}
                          </Button>
                          <Button
                            size="sm"
                            disabled={actionLoading !== null}
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus komunitas "${cohort.name}"?`)) {
                                handleAction('delete_cohort', { cohortId: cohort.id });
                              }
                            }}
                            className="h-7 text-[10px] bg-rose-600 hover:bg-rose-500 text-white rounded-md px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">Tidak ada komunitas ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* USERS TAB VIEW */}
      {activeTab === 'users' && (
        <Card className="premium-light-card liquid-glass-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-[10px] font-bold text-slate-400 dark:text-slate-550 border-b border-slate-200 dark:border-white/5 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Tanggal Daftar</th>
                  <th className="py-3.5 px-4 text-right">Tindakan / Hak Akses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-700 dark:text-slate-300">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const actionKey = (actName: string) => `${actName}-${user.id}`;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">{user.email}</td>
                        <td className="py-4 px-4 font-mono text-[11px] text-slate-500">{user.username || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={`text-[9px] uppercase ${user.role === 'super_admin' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' : 'border-slate-500/30 text-slate-600 dark:text-slate-400'}`}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">{formatDate(user.created_at)}</td>
                        <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading !== null || user.role === 'super_admin'}
                            onClick={() => handleAction('update_user_role', { targetUserId: user.id, newRole: 'super_admin' })}
                            className="h-7 text-[10px] border-amber-500/20 text-amber-600 hover:bg-amber-500/5 rounded-md"
                          >
                            Jadikan Super Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading !== null || user.role === 'member'}
                            onClick={() => handleAction('update_user_role', { targetUserId: user.id, newRole: 'member' })}
                            className="h-7 text-[10px] border-slate-200 dark:border-white/10 rounded-md"
                          >
                            Set Member Biasa
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">Tidak ada pengguna ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
