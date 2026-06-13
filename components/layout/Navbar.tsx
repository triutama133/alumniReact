// components/layout/Navbar.tsx
'use client'; // <-- INI SANGAT PENTING. Menandakan ini Client Component

import Link from 'next/link';
import { Button } from '@/components/ui/button';
// router tidak dibutuhkan saat ini

interface NavbarProps {
  userEmail: string | null;
}

export default function Navbar({ userEmail }: NavbarProps) {
  // tidak memakai router saat ini

  const handleLogout = () => {
    // Mengarahkan ke API Route logout untuk menghapus cookie
    window.location.href = '/api/logout'; 
    // Atau jika Anda ingin navigasi lembut:
    // router.push('/api/logout');
    // router.refresh(); // Untuk memastikan state halaman diperbarui
  };

  return (
    <nav className="bg-white shadow-md p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          Indonesia Talent Hub
        </Link>
        <Link href="/projects" className="text-gray-600 hover:text-gray-900">
          Proyek
        </Link>
        <Link href="/talents" className="text-gray-600 hover:text-gray-900">
          Talenta
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        {userEmail ? (
          <>
            <span className="text-gray-700">Halo, {userEmail.split('@')[0]}!</span>
            <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
            <Link href="/register" className="text-green-500 hover:underline">
              Daftar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
