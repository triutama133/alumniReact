// app/(main)/dashboard/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const headersList = await headers();

  const userIdString = headersList.get('x-user-id');
  if (!userIdString) {
    redirect('/landing');
  }

  const userId = Number(userIdString);
  if (Number.isNaN(userId)) {
    redirect('/landing');
  }

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

  // Verify the user profile exists
  const { data: profile, error: profileError } = await supabase
    .from('alumni_db')
    .select('id, nama_lengkap')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    redirect('/complete-profile');
  }

  // Fetch the cohorts this user belongs to
  const { data: memberCohorts, error: cohortsError } = await supabase
    .from('cohort_members')
    .select(`
      cohort_id,
      cohorts (
        id,
        name,
        description
      )
    `)
    .eq('user_id', userId);

  const cohorts = (memberCohorts || [])
    .map((mc: any) => mc.cohorts)
    .filter(Boolean);

  return (
    <div className="py-8 bg-slate-950/20 min-h-screen">
      <DashboardClient userCohorts={cohorts} />
    </div>
  );
}
