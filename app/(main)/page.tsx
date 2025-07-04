// app/(main)/page.tsx
// PENTING: Pastikan TIDAK ADA 'use client' di atas baris ini.
// File ini adalah Server Component.

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers'; // Import headers
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectWithOwner, AlumniProfileType } from '@/lib/types'; // Import AlumniProfileType
import LogoutButtonClient from '@/components/AuthButton'; // Import Client Component untuk Logout Button

// Definisikan tipe kustom untuk pengguna
interface CustomUserForProjectCard {
  id: string;
  email: string;
  role: string | null;
}

export default async function HomePage() { // Jadikan fungsi ini async
  const cookieStore = await cookies();

  // --- Mengambil informasi pengguna yang sedang login dari HEADER ---
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const userEmail = headersList.get('x-user-email');
  const userRole = headersList.get('x-user-role');
  
  const currentUser: CustomUserForProjectCard | null = userId && userEmail
    ? { id: userId, email: userEmail, role: userRole || null }
    : null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  // --- Ambil nama panggilan pengguna yang sedang login dari database ---
  let userNickname: string | null = null;
  if (userId) {
    const { data: alumniProfile, error: profileError } = await supabase
      .from('alumni_db') // Asumsi nama panggilan ada di tabel alumni_db
      .select('nama_panggilan')
      .eq('id', userId)
      .single() as { data: Pick<AlumniProfileType, 'nama_panggilan'> | null, error: any };

    if (profileError) {
      console.error("Error fetching user nickname:", profileError);
    } else if (alumniProfile) {
      userNickname = alumniProfile.nama_panggilan;
    }
  }
  // --- Akhir pengambilan nama panggilan ---

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      created_at,
      title,
      description,
      required_skills,
      status,
      owner:alumni_db (
        id, 
        nama_lengkap
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          Selamat Datang{userNickname ? `, ${userNickname}` : ''}! {/* Ucapan selamat datang dengan nama panggilan */}
        </h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
          Temukan peluang kolaborasi atau cari talenta terbaik untuk proyek Anda selanjutnya.
        </p>
        
        {currentUser && (
          <div className="mt-6">
            <Link href={`/profile/${currentUser.id}`} passHref>
              <Button variant="default" className="text-white bg-blue-500 hover:bg-blue-600">
                Lihat Profil Saya
              </Button>
            </Link>
          </div>
        )}

      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Proyek Terbaru</h2>
          <Button asChild variant="outline">
            <Link href="/projects">Lihat Semua Proyek</Link>
          </Button>
        </div>
        
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: ProjectWithOwner) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                user={currentUser} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-md bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-xl font-semibold">Saat ini belum ada proyek.</h3>
            <p className="text-muted-foreground mt-2">Jadilah yang pertama untuk membuat proyek baru!</p>
            <Button asChild className="mt-4">
              <Link href="/projects/create">Buat Proyek</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Informasi user dari header */}
      {currentUser && (
        <div className="w-full max-w-4xl bg-gray-50 p-6 rounded-lg shadow-sm mt-8 text-center">
          <p className="text-gray-700">User ID: <span className="font-semibold">{currentUser.id}</span></p>
          <p className="text-gray-700">Email: <span className="font-semibold">{currentUser.email}</span></p>
          {currentUser.role && <p className="text-gray-700">Peran: <span className="font-semibold">{currentUser.role}</span></p>}
          <LogoutButtonClient />
        </div>
      )}
    </div>
  );
}
