import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as z from 'zod';
import { headers } from 'next/headers';

const profileSettingsSchema = z.object({
  kota_domisili: z.string().min(1, 'Domisili wajib diisi.'),
  aktivitas: z.string().min(1, 'Aktivitas atau pekerjaan wajib diisi.'),
  skill_gabungan: z.string().min(1, 'Keahlian wajib diisi.'),
  bahasa_dikuasai: z.string().min(1, 'Bahasa yang dikuasai wajib diisi.'),
});

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Server misconfigured: missing environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');

    if (!userIdString) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(userIdString);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const parsed = profileSettingsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data pengaturan profil tidak valid.', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('alumni_db')
      .select('id')
      .eq('id', userId)
      .maybeSingle<{ id: number }>();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profil belum tersedia. Silakan lengkapi onboarding profil terlebih dahulu.' },
        { status: 404 }
      );
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('alumni_db')
      .update({
        kota_domisili: parsed.data.kota_domisili.trim(),
        aktivitas: parsed.data.aktivitas.trim(),
        skill_gabungan: parsed.data.skill_gabungan.trim(),
        bahasa_dikuasai: parsed.data.bahasa_dikuasai.trim(),
      })
      .eq('id', userId)
      .select('id, kota_domisili, aktivitas, skill_gabungan, bahasa_dikuasai')
      .single<{
        id: number;
        kota_domisili: string | null;
        aktivitas: string | null;
        skill_gabungan: string | null;
        bahasa_dikuasai: string | null;
      }>();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: 'Pengaturan profil berhasil diperbarui.',
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
