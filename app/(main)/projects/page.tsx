// app/(main)/projects/page.tsx
// PENTING: Pastikan TIDAK ADA 'use client' di atas baris ini.
// File ini adalah Server Component.

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers'; // Import headers
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectWithOwner } from '@/lib/types';

// Definisikan tipe kustom untuk pengguna
// Ini harus sama persis dengan yang ada di ProjectCard.tsx dan ProjectDetailModal.tsx
interface CustomUserForProjectCard {
  id: string;
  email: string;
  role: string | null;
}

export default async function ProjectsPage() {
  const cookieStore = await cookies();

  // --- Mengambil informasi pengguna dari HEADER yang di-inject oleh middleware ---
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const userEmail = headersList.get('x-user-email');
  const userRole = headersList.get('x-user-role');
  
  // Buat objek user kustom yang sesuai dengan ProjectCard
  // Pastikan 'email' tidak undefined, gunakan fallback string kosong jika perlu,
  // atau lakukan pengecekan yang lebih kuat.
  const currentUserForCard: CustomUserForProjectCard | null = userId && userEmail
    ? { id: userId, email: userEmail, role: userRole || null }
    : null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

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
    .order('created_at', { ascending: false }); // Hapus limit jika ini halaman "Semua Proyek"

  if (error) {
    console.error("Error fetching projects:", error);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          Semua Proyek
        </h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
          Jelajahi semua proyek yang tersedia di Indonesia Talent Hub.
        </p>
      </div>

      <div>
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project as unknown as ProjectWithOwner} 
                user={currentUserForCard} // Passing objek user yang sudah sesuai tipe
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

      {/* Informasi user dari header (tambahan untuk debugging) */}
      {userId && (
        <div className="w-full max-w-4xl bg-gray-50 p-6 rounded-lg shadow-sm mt-8 text-center">
          <p className="text-gray-700">User ID: <span className="font-semibold">{userId}</span></p>
          <p className="text-gray-700">Email: <span className="font-semibold">{userEmail}</span></p>
          {userRole && <p className="text-gray-700">Peran: <span className="font-semibold">{userRole}</span></p>}
        </div>
      )}
    </div>
  );
}
