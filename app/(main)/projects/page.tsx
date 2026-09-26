import { cookies, headers } from 'next/headers';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectWithOwner } from '@/lib/types';
import { AIPromptHub } from '@/components/projects/AIPromptHub';
import { ProjectScoutTab } from '@/components/projects/ProjectScoutTab';

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
    // owner comes back from PostgREST as a single object (projects.owner_id is a
    // many-to-one FK into alumni_db, embedded as belongs-to, not as a list) — normalize
    // it to the array shape ProjectCard/ProjectWithOwner expect, same as the detail page.
    if (!error && data) {
      projects = (data as unknown as Array<Record<string, unknown> & { owner: { id: number; nama_lengkap: string } | null }>).map((p) => ({
        ...p,
        owner: p.owner ? [p.owner] : [],
      })) as unknown as ProjectWithOwner[];
    }

    // Attach the viewing user's own application status per project, so cards can show
    // "Sudah Melamar" without needing to open every project's detail page to find out.
    if (userId && projects.length > 0) {
      const { data: myApplications } = await supabase
        .from('project_applications')
        .select('project_id, status')
        .eq('user_id', userId)
        .in('project_id', projects.map((p) => p.id));

      const statusByProjectId = new Map((myApplications || []).map((a) => [a.project_id, a.status]));
      projects = projects.map((project) => ({
        ...project,
        applied_status: statusByProjectId.get(project.id) || null,
      }));
    }
  }

  let userFullName = '';
  if (currentTab === 'ai' && userId) {
    const { data } = await supabase.from('alumni_db').select('nama_lengkap').eq('id', userId).single();
    if (data) userFullName = data.nama_lengkap;
  }

  let myProjects: Array<{ id: string; title: string; description: string; required_skills: string[] | null }> = [];
  if (currentTab === 'scout' && userId) {
    const { data } = await supabase
      .from('projects')
      .select('id, title, description, required_skills')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    myProjects = data || [];
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-6xl stagger-children">
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
        {userId && (
          <Link href="/projects?tab=scout" className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${currentTab === 'scout' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}>
            Scout Talenta AI
          </Link>
        )}
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

      {currentTab === 'scout' && userId && (
        <ProjectScoutTab myProjects={myProjects} />
      )}
    </div>
  );
}
