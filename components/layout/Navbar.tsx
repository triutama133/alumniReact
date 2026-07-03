// components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Globe, Home, Search, FolderKanban, User, LogOut, BarChart3, Settings } from 'lucide-react';

interface NavbarProps {
  userEmail: string | null;
  userId: string | null;
}

export default function Navbar({ userEmail, userId }: NavbarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const menuItems = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/projects', label: 'Hub Proyek', icon: FolderKanban },
    { href: '/search', label: 'Cari Talenta', icon: Search },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-slate-950/70 px-6 py-3 backdrop-blur-md shadow-md dark:shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Globe className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
          <span className="font-semibold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
            Indonesia Talent Hub
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-1 md:flex">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.08)] dark:shadow-[0_0_15px_rgba(99,102,241,0.15)]'
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
              {userId && (
                <Link
                  href={`/profile/${userId}`}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                    pathname.startsWith(`/profile/${userId}`)
                      ? 'bg-indigo-600/10 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Profil</span>
                </Link>
              )}
              <Link
                href="/settings"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  pathname.startsWith('/settings')
                    ? 'bg-indigo-600/10 text-indigo-600 border border-indigo-500/20 dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Pengaturan</span>
              </Link>
              <span className="hidden lg:inline text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-white/10 pl-3">
                {userEmail.split('@')[0]}
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs font-medium text-rose-600 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20 transition-all duration-300 gap-1.5 px-4"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 rounded-full transition-all"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
