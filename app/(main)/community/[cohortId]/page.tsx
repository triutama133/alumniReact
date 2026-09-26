// app/(main)/community/[cohortId]/page.tsx
import { headers } from 'next/headers';
import Link from 'next/link';
import { getAdminClient } from '@/lib/adminClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import type { ProjectWithOwner } from '@/lib/types';
import { Users, Settings, CalendarClock } from 'lucide-react';

interface CohortMemberRow {
  id: number;
  role: string;
  joined_at: string;
  user_id: number;
  alumni: { nama_lengkap: string | null; nama_panggilan: string | null } | null;
}

interface CommunityPostRow {
  id: number;
  content: string;
  created_at: string;
  alumni_db: { nama_lengkap: string | null; nama_panggilan: string | null } | null;
}

function AccessMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-2">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Link href="/" className="inline-block pt-2">
        <Button variant="outline" size="sm">Kembali ke Beranda</Button>
      </Link>
    </div>
  );
}

export default async function CommunityPage({ params }: { params: Promise<{ cohortId: string }> }) {
  const { cohortId: cohortIdParam } = await params;
  const cohortId = Number(cohortIdParam);

  const headersList = await headers();
  const userIdString = headersList.get('x-user-id');
  const userId = userIdString ? Number(userIdString) : null;

  if (!userId || Number.isNaN(cohortId)) {
    return <AccessMessage title="Komunitas tidak ditemukan" description="Tautan komunitas yang Anda buka tidak valid." />;
  }

  const supabase = getAdminClient();

  const { data: membership } = await supabase
    .from('cohort_members')
    .select('role')
    .eq('cohort_id', cohortId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) {
    return (
      <AccessMessage
        title="Anda belum bergabung"
        description="Halaman ini hanya bisa diakses oleh anggota komunitas. Hubungi admin komunitas untuk mendapatkan undangan."
      />
    );
  }

  const [{ data: cohort }, { data: members }, { data: projects }, { data: posts }] = await Promise.all([
    supabase.from('cohorts').select('*').eq('id', cohortId).maybeSingle(),
    supabase
      .from('cohort_members')
      .select('id, role, joined_at, user_id, alumni:alumni_db ( nama_lengkap, nama_panggilan )')
      .eq('cohort_id', cohortId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('projects')
      .select('id, created_at, title, description, required_skills, status, owner:alumni_db ( id, nama_lengkap )')
      .eq('cohort_id', cohortId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('posts')
      .select('id, content, created_at, alumni_db ( nama_lengkap, nama_panggilan )')
      .eq('cohort_id', cohortId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (!cohort) {
    return <AccessMessage title="Komunitas tidak ditemukan" description="Komunitas ini mungkin sudah dihapus." />;
  }

  const memberRows = (members || []) as unknown as CohortMemberRow[];
  const postRows = (posts || []) as unknown as CommunityPostRow[];
  // owner comes back from PostgREST as a single object, not an array (projects.owner_id
  // is a many-to-one FK into alumni_db) — ProjectCard expects an array, same normalization
  // as the main projects list page.
  const projectRows = ((projects || []) as unknown as Array<Record<string, unknown> & { owner: { id: number; nama_lengkap: string } | null }>).map((p) => ({
    ...p,
    owner: p.owner ? [p.owner] : [],
  })) as unknown as ProjectWithOwner[];
  const isAdmin = membership.role === 'admin';
  const expiresAt = cohort.expires_at ? new Date(cohort.expires_at) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 stagger-children">
      <Card className="premium-light-card">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-foreground">{cohort.name}</CardTitle>
            <CardDescription className="mt-1">{cohort.description || 'Belum ada deskripsi komunitas.'}</CardDescription>
          </div>
          {isAdmin && (
            <Link href="/cohort-admin">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1.5" />
                Kelola Komunitas
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {memberRows.length} anggota
          </span>
          <Badge variant="secondary" className="capitalize">{cohort.subscription_plan}</Badge>
          <Badge variant={cohort.subscription_status === 'active' ? 'default' : 'destructive'} className="capitalize">
            {cohort.subscription_status}
          </Badge>
          {daysLeft !== null && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" />
              {daysLeft} hari tersisa
            </span>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Anggota ({memberRows.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {memberRows.map((m) => (
            <Card key={m.id} className="p-3">
              <p className="font-medium text-sm text-foreground">{m.alumni?.nama_lengkap || 'Anonim'}</p>
              <p className="text-xs text-muted-foreground">{m.role === 'admin' ? 'Admin Komunitas' : 'Anggota'}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Proyek Komunitas</h2>
        {projectRows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {projectRows.map((p) => (
              <ProjectCard key={p.id} project={p} user={null} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada proyek yang dibuat di komunitas ini.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Postingan Terbaru</h2>
        {postRows.length > 0 ? (
          <div className="space-y-3">
            {postRows.map((post) => (
              <Card key={post.id} className="p-4">
                <p className="text-sm font-medium text-foreground">{post.alumni_db?.nama_lengkap || 'Anonim'}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada postingan di komunitas ini.</p>
        )}
      </section>
    </div>
  );
}
