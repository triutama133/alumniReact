import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectWithOwner } from '@/lib/types';
import { AIPromptHub } from '@/components/projects/AIPromptHub';

interface CustomUserForProjectCard {
  id: string;
  email: string;
  role: string | null;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const resolvedSearchParams = await searchParams;
  const currentTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'jelajah';

  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const userEmail = headersList.get('x-user-email');
  const userRole = headersList.get('x-user-role');
  
  const currentUserForCard: CustomUserForProjectCard | null = userId && userEmail ? {
    id: userId,
    email: userEmail,
    role: userRole,
  } : null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let projects: ProjectWithOwner[] = [];
  if (currentTab === 'jelajah') {
    const activeCohortId = cookieStore.get('active_cohort_id')?.value;
    
    let dbQuery = supabase
      .from('projects')
      .select(`id, created_at, title, description, required_skills, status, owner:alumni_db (id, nama_lengkap)`);
      
    if (activeCohortId && activeCohortId !== 'global') {
      dbQuery = dbQuery.eq('cohort_id', Number(activeCohortId));
    } else {
      dbQuery = dbQuery.is('cohort_id', null);
    }

    const { data, error } = await dbQuery.order('created_at', { ascending: false });
    if (!error && data) projects = data;
  }

  let userFullName = '';
  if (currentTab === 'ai' && userId) {
    const { data } = await supabase.from('alumni_db').select('nama_lengkap').eq('id', userId).single();
    if (data) userFullName = data.nama_lengkap;
  }

  return (
    <div className="container mx-auto py-8 stagger-children">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Hub Proyek & Kolaborasi</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Temukan peluang proyek secara manual atau gunakan pencarian semantik AI.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/projects/create">Upload Project Baru</Link>
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b mb-8 overflow-x-auto">
        <Link href="/projects?tab=jelajah" className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${currentTab === 'jelajah' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}>
          Jelajah Proyek
        </Link>
        <Link href="/projects?tab=ai" className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${currentTab === 'ai' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}>
          Pencarian Cerdas AI
        </Link>
      </div>

      {currentTab === 'jelajah' && (
        <div className="stagger-children">
          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project as unknown as ProjectWithOwner} user={currentUserForCard} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-md bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-semibold">Saat ini belum ada proyek.</h3>
            </div>
          )}
        </div>
      )}

      {currentTab === 'ai' && (
        <AIPromptHub userId={userId || ''} userFullName={userFullName} />
      )}
    </div>
  );
}
