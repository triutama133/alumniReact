// components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { playClickSound } from '@/lib/audio';
import {
  Globe,
  Home,
  Search,
  FolderKanban,
  User,
  LogOut,
  BarChart3,
  Settings,
  Shield,
  PlusCircle,
  Users,
  Clock,
  TrendingUp,
  Briefcase,
  Menu,
  X,
  Bell,
  MessageCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NavbarProps {
  userEmail: string | null;
  userId: string | null;
}

export default function Navbar({ userEmail, userId }: NavbarProps) {
  const pathname = usePathname();

  // Cohorts State
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [activeCohortId, setActiveCohortId] = useState<string>('global');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortDesc, setNewCohortDesc] = useState('');
  const [isCreatingCohort, setIsCreatingCohort] = useState(false);
  const [activeCohortRole, setActiveCohortRole] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  // Load cohorts, active cohort ID, and user role
  useEffect(() => {
    if (!userId) return;

    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const activeId = getCookie('active_cohort_id') || 'global';
    setActiveCohortId(activeId);

    // Fetch user details from /api/me to check global role (super_admin, etc.)
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role || null);
        }
      } catch (err) {
        console.error('Error fetching user role in navbar:', err);
      }
    };

    const fetchCohorts = async () => {
      try {
        const res = await fetch('/api/cohorts');
        if (res.ok) {
          const data = await res.json();
          setCohorts(data);

          if (activeId !== 'global') {
            const active = data.find((c: any) => String(c.id) === activeId);
            if (active) {
              setActiveCohortRole(active.role || null);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching cohorts in navbar:', err);
      }
    };

    fetchMe();
    fetchCohorts();

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, [userId]);

  const handlePortalChange = (val: string) => {
    if (val === 'create_new') {
      setShowCreateModal(true);
      return;
    }

    const setCookie = (name: string, value: string, days = 365) => {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};path=/;expires=${date.toUTCString()}`;
    };

    const eraseCookie = (name: string) => {
      document.cookie = `${name}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    };

    if (val === 'global') {
      eraseCookie('active_cohort_id');
    } else {
      setCookie('active_cohort_id', val);
    }

    window.location.reload();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      try {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notification.id }),
        });
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }

    setShowNotifications(false);

    // Navigasi berdasarkan tipe notifikasi
    if (notification.type === 'post_like' || notification.type === 'post_comment') {
      window.location.href = '/';
    } else if (notification.type === 'project_apply' || notification.type === 'project_status') {
      window.location.href = '/projects';
    } else if (notification.type === 'chat') {
      window.location.href = '/messages';
    } else {
      window.location.href = '/';
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName.trim()) return;

    setIsCreatingCohort(true);
    try {
      const res = await fetch('/api/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCohortName,
          description: newCohortDesc || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat komunitas.');
      }

      const setCookie = (name: string, value: string, days = 365) => {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};path=/;expires=${date.toUTCString()}`;
      };

      setCookie('active_cohort_id', String(data.cohort.id));
      toast.success('Komunitas eksklusif berhasil dibuat!');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat komunitas.');
    } finally {
      setIsCreatingCohort(false);
      setShowCreateModal(false);
    }
  };

  const menuItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/projects', label: 'Hub Proyek', icon: FolderKanban },
    { href: '/search', label: 'Cari Talenta', icon: Search },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/messages', label: 'Pesan', icon: MessageCircle },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-slate-950/70 px-6 py-3 backdrop-blur-md shadow-md dark:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300">

          {/* Brand Logo & Portal Selector */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => { playClickSound(); setIsMobileOpen(!isMobileOpen); }}
              className="p-1.5 -ml-1 rounded-full md:hidden hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-350 transition-colors"
              aria-label="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <Image
                src="/logo.png"
                alt="HubTalent"
                width={110}
                height={30}
                className="h-7 w-auto dark:brightness-0 dark:invert"
              />
            </Link>

            {userId && (
              <div className="hidden sm:block w-40 sm:w-48 ml-1">
                <Select value={activeCohortId} onValueChange={handlePortalChange}>
                  <SelectTrigger className="h-8 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 rounded-full px-3">
                    <SelectValue placeholder="Pilih Portal" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                    <SelectItem value="global" className="text-xs">🌐 Portal Global</SelectItem>
                    {cohorts.length > 0 && (
                      <>
                        <div className="text-[9px] font-extrabold text-slate-400 dark:text-slate-600 px-2 py-1 select-none border-t border-slate-100 dark:border-white/5 mt-1 tracking-wider">KOMUNITAS SAYA</div>
                        {cohorts.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} className="text-xs pl-4">👥 {c.name}</SelectItem>
                        ))}
                      </>
                    )}
                    <div className="border-t border-slate-100 dark:border-white/5 my-1" />
                    <SelectItem value="create_new" className="text-xs text-primary font-semibold focus:text-primary">➕ Buat Komunitas baru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="hidden items-center gap-1 md:flex">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-300 ${isActive
                    ? 'bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/10 dark:text-white dark:border-white/10 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Auth / Profile Actions */}
          <div className="flex items-center gap-3">
            {userEmail ? (
              <>
                {/* Local Super Admin Route Shortcut */}
                {userRole === 'super_admin' && (
                  <Link
                    href="/super-admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${pathname === '/super-admin'
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                      : 'text-amber-500 hover:bg-amber-500/10 border-amber-500/20'
                      }`}
                  >
                    <Shield className="h-3 w-3" />
                    <span>Super Admin</span>
                  </Link>
                )}

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => { playClickSound(); setShowNotifications(!showNotifications); }}
                    className="relative flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    aria-label="Notifikasi"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Notifikasi</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={async () => {
                                try {
                                  await fetch('/api/notifications/read-all', { method: 'POST' });
                                  setUnreadCount(0);
                                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                                } catch (err) {
                                  console.error('Error marking all read:', err);
                                }
                              }}
                              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Tandai semua dibaca
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto py-1">
                          {notifications.length === 0 ? (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center py-6">
                              Belum ada notifikasi.
                            </p>
                          ) : (
                            notifications.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[11px] font-semibold truncate ${!n.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {n.title}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{n.content}</p>
                                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">{formatRelativeTime(n.created_at)}</p>
                                </div>
                                {!n.is_read && (
                                  <span className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Community Admin Route Shortcut */}
                {activeCohortId !== 'global' && activeCohortRole === 'admin' && (
                  <Link
                    href="/cohort-admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold border transition-all duration-300 ${pathname === '/cohort-admin'
                      ? 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-white/10 dark:text-white dark:border-white/10'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white border-transparent'
                      }`}
                  >
                    <Shield className="h-3 w-3" />
                    <span>Kelola Komunitas</span>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-all text-xs font-semibold"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span className="max-w-[80px] truncate hidden sm:inline">{userEmail.split('@')[0]}</span>
                  </button>

                  {showUserDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                      <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-2xl p-1.5 space-y-0.5 animate-fadeIn">
                        <div className="px-3 py-2 text-[10px] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 mb-1 truncate">
                          {userEmail}
                        </div>
                        {userId && (
                          <Link
                            href={`/profile/${userId}`}
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <User className="h-3.5 w-3.5 text-slate-450" />
                            Profil Saya
                          </Link>
                        )}
                        <Link
                          href="/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <Settings className="h-3.5 w-3.5 text-slate-450" />
                          Pengaturan
                        </Link>
                        <div className="border-t border-slate-100 dark:border-white/5 my-1" />
                        <button
                          onClick={() => { setShowUserDropdown(false); handleLogout(); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-455 dark:hover:bg-rose-950/20 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Keluar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 rounded-md transition-all"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-white rounded-md transition-all shadow-sm"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Cohort Creation Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Buat Komunitas Eksklusif</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Buat portal komunitas Anda sendiri. Undang anggota, buat proyek tim, dan bagikan ide secara eksklusif.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCohort} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Komunitas</label>
              <Input
                value={newCohortName}
                onChange={(e) => setNewCohortName(e.target.value)}
                placeholder="Contoh: Indo Tech Innovators"
                className="h-9 bg-slate-50 border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-md focus:border-primary"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deskripsi Singkat</label>
              <Textarea
                value={newCohortDesc}
                onChange={(e) => setNewCohortDesc(e.target.value)}
                placeholder="Jelaskan visi dan misi dari komunitas Anda..."
                className="bg-slate-50 border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-white rounded-md resize-none focus:border-primary"
                rows={3}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateModal(false)} className="rounded-md text-xs">Batal</Button>
              <Button type="submit" size="sm" disabled={isCreatingCohort || !newCohortName.trim()} className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-md px-5 shadow-sm">
                {isCreatingCohort ? 'Membuat...' : 'Buat Komunitas'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Content */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-850 shadow-2xl p-6 transition-all duration-300 md:hidden flex flex-col justify-between ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="space-y-6">
          {/* Header & Close Button */}
          <div className="flex justify-between items-center">
            <Link href="/" onClick={() => setIsMobileOpen(false)} className="flex items-center">
              <Image
                src="/logo.png"
                alt="HubTalent"
                width={100}
                height={28}
                className="h-6 w-auto dark:brightness-0 dark:invert"
              />
            </Link>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded text-slate-500 dark:text-slate-400"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Portal Selector inside Drawer */}
          {userId && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-wider">Portal Aktif</label>
              <Select value={activeCohortId} onValueChange={(val) => { handlePortalChange(val); setIsMobileOpen(false); }}>
                <SelectTrigger className="h-9 w-full bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-md px-3">
                  <SelectValue placeholder="Pilih Portal" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10">
                  <SelectItem value="global" className="text-xs">🌐 Portal Global</SelectItem>
                  {cohorts.length > 0 && (
                    <>
                      <div className="text-[9px] font-extrabold text-slate-400 dark:text-slate-600 px-2 py-1 select-none border-t border-slate-100 dark:border-white/5 mt-1 tracking-wider">KOMUNITAS SAYA</div>
                      {cohorts.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)} className="text-xs pl-4">👥 {c.name}</SelectItem>
                      ))}
                    </>
                  )}
                  <div className="border-t border-slate-100 dark:border-white/5 my-1" />
                  <SelectItem value="create_new" className="text-xs text-primary font-semibold focus:text-primary">➕ Buat Komunitas baru</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Vertical Menu Navigation links */}
          <div className="flex flex-col gap-1.5 pt-2">
            <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1">Navigasi</span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-300 ${isActive
                    ? 'bg-slate-100 text-slate-900 border border-slate-200 dark:bg-white/10 dark:text-white dark:border-white/10'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions inside Drawer */}
        <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-3">
          {userEmail ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="h-6.5 w-6.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                  {userEmail[0]}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate w-36">
                  {userEmail}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {userId && (
                  <Link
                    href={`/profile/${userId}`}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <User className="h-4 w-4" />
                    <span>Profil Saya</span>
                  </Link>
                )}
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <Settings className="h-4 w-4" />
                  <span>Pengaturan</span>
                </Link>
                <Button
                  onClick={() => { setIsMobileOpen(false); handleLogout(); }}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-9 rounded-md text-xs font-semibold text-rose-600 hover:text-rose-500 hover:bg-rose-50 dark:text-rose-450 dark:hover:bg-rose-500/10 gap-2 px-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="w-full text-center px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/5 rounded-md"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileOpen(false)}
                className="w-full text-center px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-white rounded-md shadow-sm"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
