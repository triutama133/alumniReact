// app/(main)/layout.tsx
// PENTING: Pastikan TIDAK ADA 'use client' di atas baris ini.
// File ini adalah Server Component.
import { headers } from 'next/headers';
import Navbar from '@/components/layout/Navbar'; // <-- IMPORT NAVBAR DARI FILE TERPISAH

// Layout utama yang akan membungkus halaman-halaman di grup (main)
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mengambil informasi pengguna dari header yang disetel oleh middleware
  const headersList = await headers();
  const userEmail = headersList.get('x-user-email');

  return (
    <>
      <Navbar userEmail={userEmail} /> {/* Render Navbar Client Component */}
      <main className="flex-grow">{children}</main>
      {/* Opsional: Tambahkan footer di sini */}
      {/* <footer className="bg-gray-800 text-white p-4 text-center">
        &copy; 2025 Indonesia Talent Hub
      </footer> */}
    </>
  );
}
