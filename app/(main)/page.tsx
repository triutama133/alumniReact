// app/(main)/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { HomeFeedClient } from '@/components/feed/HomeFeedClient';

export default async function HomePage() {
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

  // Fetch the user's profile from alumni_db
  const { data: profile, error: profileError } = await supabase
    .from('alumni_db')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError?.message);
    // If profile is not found but user is authenticated, redirect to onboarding complete-profile
    redirect('/complete-profile');
  }

  // Fetch posts from posts_feed view
  const { data: posts, error: postsError } = await supabase
    .from('posts_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (postsError) {
    console.error('Error fetching posts feed:', postsError.message);
  }

  // Serialize BigInt or other non-serializable fields if any
  const serializedProfile = {
    ...profile,
    id: Number(profile.id),
  };

  const serializedPosts = (posts || []).map((post: any) => ({
    ...post,
    id: typeof post.id === 'bigint' ? Number(post.id) : post.id,
    user_id: typeof post.user_id === 'bigint' ? Number(post.user_id) : post.user_id,
  }));

  return (
    <div className="py-8 bg-slate-950/20 min-h-screen">
      <HomeFeedClient initialPosts={serializedPosts} userProfile={serializedProfile} />
    </div>
  );
}

