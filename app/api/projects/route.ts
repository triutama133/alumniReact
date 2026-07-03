import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import * as z from 'zod';

const projectSchema = z.object({
  title: z.string().min(10),
  description: z.string().min(50),
  required_skills: z.array(z.string().min(1)).min(1),
  cohortId: z.number().int().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const ownerIdString = headersList.get('x-user-id');

    if (!ownerIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const ownerId = Number(ownerIdString);
    if (Number.isNaN(ownerId)) {
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data proyek tidak valid.', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { error } = await supabaseAdmin.from('projects').insert({
      title: validationResult.data.title,
      description: validationResult.data.description,
      required_skills: validationResult.data.required_skills,
      owner_id: ownerId,
      cohort_id: validationResult.data.cohortId || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Proyek berhasil dibuat!' }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
