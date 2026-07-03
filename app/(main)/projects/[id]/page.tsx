// app/(main)/projects/[id]/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProjectDetailClient } from '@/components/projects/ProjectDetailClient';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const headersList = await headers();

  const userIdString = headersList.get('x-user-id');
  if (!userIdString) {
    redirect('/landing');
  }

  const userId = Number(userIdString);

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

  // Fetch project details
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, created_at, title, description, required_skills, status, owner_id, owner:alumni_db (id, nama_lengkap)')
    .eq('id', id)
    .single();

  if (error || !project) {
    console.error('Error fetching project:', error?.message);
    redirect('/projects');
  }

  // Check if current user has already applied
  const { data: application } = await supabase
    .from('project_applications')
    .select('id, status, role')
    .eq('project_id', id)
    .eq('user_id', userId)
    .maybeSingle();

  // Serialize BigInt or other non-serializable fields if any
  const serializedProject = {
    ...project,
    owner_id: Number(project.owner_id),
    owner: (project.owner || []).map((o: any) => ({
      ...o,
      id: Number(o.id)
    }))
  };

  const isOwner = userId === Number(project.owner_id);

  return (
    <div className="py-8 bg-slate-950/20 min-h-screen">
      <ProjectDetailClient 
        project={serializedProject} 
        userId={userId} 
        isOwner={isOwner} 
        initialApplication={application} 
      />
    </div>
  );
}
