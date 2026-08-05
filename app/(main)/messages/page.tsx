// app/(main)/messages/page.tsx
// Server Component: Halaman In-App Chat
import { headers } from 'next/headers';
import { ChatWindow } from '@/components/chat/ChatWindow';

export const metadata = {
    title: 'Pesan - HubTalent',
    description: 'Chat real-time antar pengguna HubTalent.',
};

export default async function MessagesPage() {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    const userId = userIdString ? Number(userIdString) : null;
    const userEmail = headersList.get('x-user-email');

    if (!userId || Number.isNaN(userId)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Akses Ditolak</h1>
                <p className="text-sm text-slate-500 mt-2">Silakan masuk ke akun Anda untuk mengakses pesan.</p>
            </div>
        );
    }

    return <ChatWindow currentUserId={userId} userEmail={userEmail} />;
}