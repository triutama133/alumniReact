import { headers } from 'next/headers';
import Navbar from '@/components/layout/Navbar';
import { FloatingChat } from '@/components/chat/FloatingChat';

// Layout utama yang akan membungkus halaman-halaman di grup (main)
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mengambil informasi pengguna dari header yang disetel oleh middleware
  const headersList = await headers();
  const userEmail = headersList.get('x-user-email');
  const userId = headersList.get('x-user-id');

  return (
    <div className="min-h-screen bg-transparent motion-page">
      <Navbar userEmail={userEmail} userId={userId} />
      <main className="flex-1 py-6 sm:py-8">
        <div className="app-shell stagger-children">{children}</div>
      </main>
      {userId && <FloatingChat currentUserId={Number(userId)} userEmail={userEmail} />}
    </div>
  );
}
