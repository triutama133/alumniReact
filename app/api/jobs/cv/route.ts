// app/api/jobs/cv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');

    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const userId = Number(userIdString);

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

    // 1. Try to fetch saved CV first
    const { data: savedCV, error: fetchErr } = await supabaseAdmin
      .from('user_cvs')
      .select('cv_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (savedCV && savedCV.cv_data && Object.keys(savedCV.cv_data).length > 0) {
      return NextResponse.json(savedCV.cv_data, { status: 200 });
    }

    // 2. If no CV saved, pull default user profile info to construct one
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('alumni_db')
      .select(`
        *,
        user(*),
        alumni_education_histories(*),
        alumni_pekerja(*),
        alumni_bisnis(*),
        alumni_sosial(*),
        alumni_kreatif(*),
        alumni_rumah_tangga(*),
        alumni_mahasiswa(*),
        alumni_informal(*),
        alumni_agri(*),
        alumni_pendidik(*)
      `)
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Gagal memuat profil pengguna untuk CV.' }, { status: 500 });
    }

    // Construct Default Georgia Serif ATS Document Templates (HTML strings)
    const headerHTML = `
      <div style="text-align: center; font-family: Georgia, serif; color: #000; line-height: 1.3;">
        <div style="font-size: 26px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${profile.nama_lengkap || 'NAMA LENGKAP ANDA'}</div>
        <div style="font-size: 11px; margin-bottom: 2px;">
          ${profile.nomor_handphone || '08123456789'} &nbsp;&bull;&nbsp; 
          ${profile.user?.email || 'email@example.com'} &nbsp;&bull;&nbsp; 
          ${profile.linkedin_link || 'linkedin.com/in/username'} &nbsp;&bull;&nbsp; 
          ${profile.kota_domisili || 'Domisili, Provinsi'}
        </div>
      </div>
    `.trim();

    const summaryHTML = `
      <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 14px; margin-bottom: 6px; padding-bottom: 1px; letter-spacing: 0.5px; font-family: Georgia, serif; color: #000;">Ringkasan Eksekutif</h3>
      <p style="font-size: 11px; margin-top: 0; margin-bottom: 12px; font-family: Georgia, serif; color: #111; line-height: 1.5; text-align: justify;">
        Alumni profesional yang memiliki keahlian di bidang ${profile.fakultas_jurusan || 'keahlian terkait'}. Memiliki pengalaman aktif dalam memimpin inisiatif, kerja sama tim, serta penyelesaian masalah dengan rekam jejak yang solid.
      </p>
    `.trim();

    // Compile Experiences list
    let expHTMLList = '';
    if (profile.alumni_pekerja && profile.alumni_pekerja.length > 0) {
      profile.alumni_pekerja.forEach((job: any) => {
        expHTMLList += `
          <div style="margin-bottom: 10px; font-family: Georgia, serif; color: #000;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 2px;">
              <span>${job.posisi || 'Jabatan'} &mdash; ${job.nama_instansi || 'Nama Instansi'}</span>
              <span style="font-style: italic; font-weight: normal; font-size: 10px;">${job.status_keaktifan || 'Aktif'}</span>
            </div>
            <ul style="margin: 0 0 0 16px; padding: 0; font-size: 11px; line-height: 1.4; color: #222; text-align: justify;">
              <li>${job.pengalaman_proyek || 'Menjalankan tugas profesional secara konsisten untuk memastikan keberhasilan operasional dan koordinasi instansi.'}</li>
            </ul>
          </div>
        `.trim();
      });
    }

    if (profile.alumni_bisnis && profile.alumni_bisnis.length > 0) {
      profile.alumni_bisnis.forEach((biz: any) => {
        expHTMLList += `
          <div style="margin-bottom: 10px; font-family: Georgia, serif; color: #000;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 2px;">
              <span>Founder / Owner &mdash; ${biz.nama_usaha || 'Bisnis Usaha'}</span>
              <span style="font-style: italic; font-weight: normal; font-size: 10px;">${biz.status_keaktifan || 'Aktif'}</span>
            </div>
            <ul style="margin: 0 0 0 16px; padding: 0; font-size: 11px; line-height: 1.4; color: #222; text-align: justify;">
              <li>Mengelola operasional bisnis skala ${biz.skala_usaha || 'Lokal'}, mengembangkan produk dan layanan utama, serta menargetkan pasar yang tepat.</li>
            </ul>
          </div>
        `.trim();
      });
    }

    if (!expHTMLList) {
      expHTMLList = `
        <div style="margin-bottom: 10px; font-family: Georgia, serif; color: #000;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 2px;">
            <span>Project Manager &mdash; Nama Instansi Contoh</span>
            <span style="font-style: italic; font-weight: normal; font-size: 10px;">2024 - Sekarang</span>
          </div>
          <ul style="margin: 0 0 0 16px; padding: 0; font-size: 11px; line-height: 1.4; color: #222;">
            <li>Memimpin tim lintas fungsional untuk menyelesaikan proyek tepat waktu dan sesuai anggaran.</li>
          </ul>
        </div>
      `.trim();
    }

    const experienceHTML = `
      <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 14px; margin-bottom: 6px; padding-bottom: 1px; letter-spacing: 0.5px; font-family: Georgia, serif; color: #000;">Pengalaman Profesional</h3>
      ${expHTMLList}
    `.trim();

    // Compile Educations list
    let eduHTMLList = '';
    if (profile.alumni_education_histories && profile.alumni_education_histories.length > 0) {
      profile.alumni_education_histories.forEach((edu: any) => {
        eduHTMLList += `
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: Georgia, serif; color: #000; margin-bottom: 4px;">
            <span><strong>${edu.level || 'S1'} ${edu.major_program || 'Jurusan'}</strong> &mdash; <em>${edu.institution_name || 'Universitas'}</em></span>
            <span style="font-weight: bold; font-size: 10px;">${edu.end_year ? String(edu.end_year) : (edu.start_year ? `${edu.start_year} - Sekarang` : '')}</span>
          </div>
        `.trim();
      });
    } else {
      eduHTMLList = `
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-family: Georgia, serif; color: #000; margin-bottom: 4px;">
          <span><strong>${profile.pendidikan_terakhir || 'Sarjana (S1)'} ${profile.jurusan_studi || 'Studi'}</strong> &mdash; <em>${profile.nama_institusi_pendidikan_terakhir || 'Institut Pertanian Bogor'}</em></span>
          <span style="font-weight: bold; font-size: 10px;">${profile.tahun_kelulusan ? String(profile.tahun_kelulusan) : ''}</span>
        </div>
      `.trim();
    }

    const educationHTML = `
      <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 14px; margin-bottom: 6px; padding-bottom: 1px; letter-spacing: 0.5px; font-family: Georgia, serif; color: #000;">Riwayat Pendidikan</h3>
      ${eduHTMLList}
    `.trim();

    // Compile Skills & Certifications
    const skillsListText = profile.skill_gabungan || 'Visualisasi Data, Analisis Data, Desain API, Manajemen Proyek';
    const certListText = profile.sertifikasi || 'Google UX Design Certificate, AWS Certified Cloud Practitioner';

    const skillsHTML = `
      <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 14px; margin-bottom: 6px; padding-bottom: 1px; letter-spacing: 0.5px; font-family: Georgia, serif; color: #000;">Keahlian (Skills)</h3>
      <p style="font-size: 11px; margin-top: 0; margin-bottom: 10px; font-family: Georgia, serif; color: #111; line-height: 1.4;">
        <strong>Teknis & Perangkat Lunak:</strong> ${skillsListText}
      </p>
    `.trim();

    const certificationsHTML = `
      <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-top: 14px; margin-bottom: 6px; padding-bottom: 1px; letter-spacing: 0.5px; font-family: Georgia, serif; color: #000;">Sertifikasi</h3>
      <p style="font-size: 11px; margin-top: 0; margin-bottom: 10px; font-family: Georgia, serif; color: #111; line-height: 1.4;">
        <strong>Sertifikasi Profesional:</strong> ${certListText}
      </p>
    `.trim();

    // Build default JSON
    const defaultCV = {
      layoutSettings: {
        layoutType: 'single',
        sidebarPosition: 'left',
        sidebarWidth: 30,
        columnGap: 24
      },
      htmlContent: {
        header: headerHTML,
        main: `
          ${summaryHTML}
          ${experienceHTML}
          ${educationHTML}
          ${skillsHTML}
          ${certificationsHTML}
        `.trim(),
        sidebar: `
          ${skillsHTML}
          ${certificationsHTML}
        `.trim()
      }
    };

    return NextResponse.json(defaultCV, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');

    if (!userIdString) {
      return NextResponse.json({ error: 'Autentikasi gagal.' }, { status: 401 });
    }

    const userId = Number(userIdString);
    const cvData = await req.json();

    if (!cvData) {
      return NextResponse.json({ error: 'Data CV tidak boleh kosong.' }, { status: 400 });
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

    const { error } = await supabaseAdmin
      .from('user_cvs')
      .upsert({
        user_id: userId,
        cv_data: cvData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
