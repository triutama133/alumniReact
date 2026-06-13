// components/AuthButton.tsx
'use client'; // Ini adalah Client Component

import { Button } from '@/components/ui/button';
export default function LogoutButtonClient() {
  // router tidak diperlukan saat ini

  const handleLogout = () => {
    // Client-side redirect to logout API route
    // Ini akan memicu API route yang menghapus cookie
    window.location.href = '/api/logout'; 
    // Atau jika Anda ingin navigasi lembut:
    // router.push('/api/logout');
    // router.refresh(); // Untuk memastikan state halaman diperbarui
  };

  return (
    <Button onClick={handleLogout} className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white">
      Logout
    </Button>
  );
}
