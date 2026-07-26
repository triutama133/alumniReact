// app/api/complete-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as z from 'zod'; // Import zod untuk validasi di server
import { headers } from 'next/headers'; // Untuk mendapatkan userId dari header
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, signAuthToken } from '@/lib/auth';

// Import tipe tidak diperlukan di route ini

// Delay creating Supabase admin client until runtime inside the handler so
// the build process does not fail when environment variables are not set.

const activityStatusEnum = z.enum(['Aktif saat ini', '<1 tahun lalu', '1-3 tahun lalu', '3-5 tahun lalu', '>5 tahun']);

// --- Zod Schema untuk Validasi Data Masuk (Harus cocok dengan schema form di klien) ---
const serverFormSchema = z.object({
  // Q1-Q16 (General Information)
  nama_lengkap: z.string().min(1),
  nama_panggilan: z.string().min(1),
  tahun_lahir: z.number().int().min(1900).max(new Date().getFullYear()),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']),
  kota_domisili: z.string().min(1),
  nomor_handphone: z.string().regex(/^62\d{9,12}$/),
  pendidikan_terakhir: z.enum(['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3']).optional(),
  nama_institusi_pendidikan_terakhir: z.string().optional(),
  jurusan_studi: z.string().optional(),
  tahun_kelulusan: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional(),
  skill_gabungan: z.string().min(1),
  bahasa_dikuasai: z.string().min(1),
  sertifikasi: z.string().optional().nullable(),
  instagram_link: z.string().url().or(z.literal('')).optional().nullable(),
  linkedin_link: z.string().url().or(z.literal('')).optional().nullable(),
  portofolio_link: z.string().url().or(z.literal('')).optional().nullable(),
  domisili_city_ref_id: z.string().optional().nullable(),
  domisili_provinsi: z.string().optional().nullable(),
  domisili_kota_kabupaten: z.string().optional().nullable(),
  education_histories: z.array(z.object({
    level: z.enum(['SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3']),
    institution_name: z.string().min(1),
    major_program: z.string().min(1),
    start_year: z.number().int().min(1900).max(new Date().getFullYear() + 10).optional().nullable(),
    end_year: z.number().int().min(1900).max(new Date().getFullYear() + 10).optional().nullable(),
    is_current: z.boolean().optional().default(false),
  })).optional(),

  // Q17 (Aktivitas/Pekerjaan - Disimpan sebagai string comma-separated di DB)
  aktivitas_db: z.string().min(1, 'Pilih minimal satu aktivitas/pekerjaan.'),

  // Q18 (Jenis Dukungan - Disimpan sebagai string comma-separated di DB)
  jenis_dukungan_dibutuhkan_db: z.string().min(1, 'Pilih minimal satu jenis dukungan.'),

  // Q19 (Bidang Kontribusi - Disimpan sebagai string comma-separated di DB)
  bidang_kontribusi_minat_db: z.string().min(1, 'Pilih minimal satu bidang kontribusi.'),

  // Conditional Schemas (perhatikan ini adalah array, tapi mungkin hanya ada satu entri)
  alumni_pekerja: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_pekerja: z.string().optional().default(''),
    nama_instansi: z.string().optional().default(''),
    posisi: z.string().optional().default(''),
    pengalaman_proyek: z.string().optional().default(''),
    akses_jejaring: z.boolean().optional().default(false),
    pengalaman_bermitra: z.boolean().optional().default(false),
  })).optional(),
  alumni_bisnis: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_wirausahaan: z.string().optional().default(''),
    produk_layanan_utama: z.string().optional().default(''),
    nama_usaha: z.string().optional().default(''),
    skala_usaha: z.string().optional().default(''),
    kendala_bisnis: z.string().optional().default(''),
    target_pasar: z.enum(['B2C', 'B2B', 'B2C dan B2B']).optional(),
    kolaborasi_terbuka: z.string().optional().default(''),
    keahlian_dibagikan: z.string().optional().default(''),
  })).optional(),
  alumni_sosial: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_sosial: z.string().optional().default(''),
    pengalaman_proyek_sosial: z.string().optional().default(''),
    isu_fokus: z.string().optional().default(''),
    nama_organisasi: z.string().optional().default(''),
    pengalaman_bermitra_sosial: z.boolean().optional().default(false),
  })).optional(),
  alumni_kreatif: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_kreatif: z.string().optional().default(''),
    platform_digital_utama: z.string().optional().default(''),
    jenis_konten: z.string().optional().default(''),
    total_jangkauan: z.string().optional().default(''),
    kisaran_rate_card: z.string().optional().default(''),
    demografi_followers: z.string().optional().default(''),
  })).optional(),
  alumni_rumah_tangga: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_irt: z.string().optional().default(''),
    kegiatan_organisasi_irt: z.string().optional().default(''),
    pengalaman_tim_irt: z.boolean().optional().default(false),
    mencari_pekerjaan_kolaborasi_irt: z.boolean().optional().default(false),
  })).optional(),
  alumni_mahasiswa: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_mahasiswa: z.string().optional().default(''),
    kegiatan_organisasi_mahasiswa: z.string().optional().default(''),
    pengalaman_tim_mahasiswa: z.boolean().optional().default(false),
    mencari_pekerjaan_kolaborasi_mahasiswa: z.boolean().optional().default(false),
    pengalaman_magang: z.string().optional().default(''),
  })).optional(),
  alumni_informal: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_informal: z.string().optional().default(''),
    pengalaman_tim_informal: z.boolean().optional().default(false),
    pernah_rekrut_memimpin: z.boolean().optional().default(false),
  })).optional(),
  alumni_agri: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_agri: z.string().optional().default(''),
    komoditas_utama: z.string().optional().default(''),
    tergabung_kelompok: z.boolean().optional().default(false),
    skala_usaha_agri: z.string().optional().default(''),
    nilai_tambah_diterapkan: z.string().optional().default(''),
    kendala_dihadapi_agri: z.string().optional().default(''),
  })).optional(),
  alumni_pendidik: z.array(z.object({
    status_keaktifan: activityStatusEnum.optional(),
    keahlian_pendidik: z.string().optional().default(''),
    jenjang_pendidikan: z.string().optional().default(''),
    mata_pelajaran: z.string().optional().default(''),
    inovasi_pembelajaran: z.string().optional().default(''),
    mengajar_bimbel: z.boolean().optional().default(false),
  })).optional(),
  aktivitas_status_durasi: z.record(z.any()).optional(),
}).superRefine((values, ctx) => {
  const isFilled = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

  const validateActivity = (
    key: keyof typeof values,
    requiredFields: string[]
  ) => {
    const rows = values[key];
    if (!Array.isArray(rows)) return;

    rows.forEach((row, index) => {
      const status = row && typeof row === 'object' ? (row as Record<string, unknown>).status_keaktifan : undefined;
      if (status === '>5 tahun') return;

      requiredFields.forEach((field) => {
        const fieldValue = row && typeof row === 'object' ? (row as Record<string, unknown>)[field] : undefined;
        if (!isFilled(fieldValue)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key, index, field],
            message: `${field} wajib diisi untuk status aktivitas ini.`,
          });
        }
      });
    });
  };

  validateActivity('alumni_pekerja', ['keahlian_pekerja', 'nama_instansi', 'posisi', 'pengalaman_proyek']);
  validateActivity('alumni_bisnis', ['keahlian_wirausahaan', 'produk_layanan_utama', 'nama_usaha', 'skala_usaha', 'kendala_bisnis', 'target_pasar', 'kolaborasi_terbuka', 'keahlian_dibagikan']);
  validateActivity('alumni_sosial', ['keahlian_sosial', 'pengalaman_proyek_sosial', 'isu_fokus', 'nama_organisasi']);
  validateActivity('alumni_kreatif', ['keahlian_kreatif', 'platform_digital_utama', 'jenis_konten', 'total_jangkauan', 'kisaran_rate_card', 'demografi_followers']);
  validateActivity('alumni_rumah_tangga', ['keahlian_irt', 'kegiatan_organisasi_irt']);
  validateActivity('alumni_mahasiswa', ['keahlian_mahasiswa', 'kegiatan_organisasi_mahasiswa', 'pengalaman_magang']);
  validateActivity('alumni_informal', ['keahlian_informal']);
  validateActivity('alumni_agri', ['keahlian_agri', 'komoditas_utama', 'skala_usaha_agri', 'nilai_tambah_diterapkan', 'kendala_dihadapi_agri']);
  validateActivity('alumni_pendidik', ['keahlian_pendidik', 'jenjang_pendidikan', 'mata_pelajaran', 'inovasi_pembelajaran']);
});

function pickLatestEducation(
  histories: Array<{
    level: 'SMA/SMK' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3';
    institution_name: string;
    major_program: string;
    start_year?: number | null;
    end_year?: number | null;
    is_current?: boolean;
  }> | undefined
) {
  if (!histories || histories.length === 0) {
    return null;
  }

  const sorted = [...histories].sort((a, b) => {
    const aCurrent = a.is_current ? 1 : 0;
    const bCurrent = b.is_current ? 1 : 0;
    if (aCurrent !== bCurrent) {
      return bCurrent - aCurrent;
    }

    const aEnd = a.end_year || 0;
    const bEnd = b.end_year || 0;
    if (aEnd !== bEnd) {
      return bEnd - aEnd;
    }

    return (b.start_year || 0) - (a.start_year || 0);
  });

  return sorted[0];
}

export async function POST(req: NextRequest) {
  console.log('--- Memulai Permintaan Complete Profile API ---');
  try {
    const headersList = await headers(); // Perbaikan: Tambahkan 'await' di sini
    const userIdString = headersList.get('x-user-id'); // Baris 124

    if (!userIdString) {
      console.log('[COMPLETE_PROFILE_API] User ID tidak ditemukan di header.');
      return NextResponse.json({ error: 'Autentikasi gagal: User ID tidak ditemukan.' }, { status: 401 });
    }

    // Convert string to bigint/number for database operations
    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      console.log('[COMPLETE_PROFILE_API] User ID tidak valid.');
      return NextResponse.json({ error: 'User ID tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    console.log('[COMPLETE_PROFILE_API] Menerima body:', body);
    const hasEducationHistoriesField = Object.prototype.hasOwnProperty.call(body, 'education_histories');

    const validationResult = serverFormSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[COMPLETE_PROFILE_API] Validasi Gagal:', validationResult.error.errors);
      return NextResponse.json({ error: 'Data tidak valid.', details: validationResult.error.errors }, { status: 400 });
    }
    const dataToSave = validationResult.data;
    const currentYear = new Date().getFullYear();

    const latestEducation = pickLatestEducation(dataToSave.education_histories);
    const pendidikanTerakhir = latestEducation?.level || dataToSave.pendidikan_terakhir;
    const namaInstitusiPendidikanTerakhir = latestEducation?.institution_name || dataToSave.nama_institusi_pendidikan_terakhir;
    const jurusanStudi = latestEducation?.major_program || dataToSave.jurusan_studi;
    const tahunKelulusan = latestEducation
      ? (latestEducation.is_current ? currentYear : (latestEducation.end_year ?? currentYear))
      : dataToSave.tahun_kelulusan;

    if (!pendidikanTerakhir || !namaInstitusiPendidikanTerakhir || !jurusanStudi || !tahunKelulusan) {
      return NextResponse.json(
        { error: 'Data pendidikan tidak lengkap. Isi riwayat pendidikan atau lengkapi data pendidikan terakhir.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('ERROR: Variabel lingkungan Supabase tidak ditemukan untuk route complete-profile.');
      return NextResponse.json({ error: 'Server misconfigured: missing environment variables.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { error: alumniDbError } = await supabaseAdmin
      .from('alumni_db')
      .upsert({
        id: userId,
        nama_lengkap: dataToSave.nama_lengkap,
        nama_panggilan: dataToSave.nama_panggilan,
        tahun_lahir: dataToSave.tahun_lahir,
        jenis_kelamin: dataToSave.jenis_kelamin,
        kota_domisili: dataToSave.kota_domisili,
        nomor_handphone: dataToSave.nomor_handphone,
        pendidikan_terakhir: pendidikanTerakhir,
        nama_institusi_pendidikan_terakhir: namaInstitusiPendidikanTerakhir,
        jurusan_studi: jurusanStudi,
        tahun_kelulusan: tahunKelulusan,
        skill_gabungan: dataToSave.skill_gabungan,
        bahasa_dikuasai: dataToSave.bahasa_dikuasai,
        sertifikasi: dataToSave.sertifikasi,
        instagram_link: dataToSave.instagram_link,
        linkedin_link: dataToSave.linkedin_link,
        portofolio_link: dataToSave.portofolio_link,
        domisili_city_ref_id: dataToSave.domisili_city_ref_id || null,
        domisili_provinsi: dataToSave.domisili_provinsi || null,
        domisili_kota_kabupaten: dataToSave.domisili_kota_kabupaten || dataToSave.kota_domisili,
        aktivitas: dataToSave.aktivitas_db,
        jenis_dukungan_dibutuhkan: dataToSave.jenis_dukungan_dibutuhkan_db,
        bidang_kontribusi_minat: dataToSave.bidang_kontribusi_minat_db,
        aktivitas_status_durasi: dataToSave.aktivitas_status_durasi || {},
      }, { onConflict: 'id' });

    if (alumniDbError) {
      console.error('[COMPLETE_PROFILE_API] Error upserting alumni_db:', alumniDbError.message);
      return NextResponse.json({ error: 'Gagal menyimpan data dasar profil.', details: alumniDbError.message }, { status: 500 });
    }
    console.log('[COMPLETE_PROFILE_API] Data dasar profil berhasil disimpan/diperbarui.');

    if (hasEducationHistoriesField) {
      const { error: deleteEduError } = await supabaseAdmin
        .from('alumni_education_histories')
        .delete()
        .eq('alumni_id', userId);

      if (deleteEduError) {
        console.error('[COMPLETE_PROFILE_API] Error clearing education histories:', deleteEduError.message);
        return NextResponse.json({ error: 'Gagal memperbarui riwayat pendidikan.' }, { status: 500 });
      }

      if (dataToSave.education_histories && dataToSave.education_histories.length > 0) {
        const eduRows = dataToSave.education_histories.map((edu) => ({
          alumni_id: userId,
          level: edu.level,
          institution_name: edu.institution_name,
          major_program: edu.major_program,
          start_year: edu.start_year ?? null,
          end_year: edu.end_year ?? null,
          is_current: Boolean(edu.is_current),
        }));

        const { error: insertEduError } = await supabaseAdmin
          .from('alumni_education_histories')
          .insert(eduRows);

        if (insertEduError) {
          console.error('[COMPLETE_PROFILE_API] Error inserting education histories:', insertEduError.message);
          return NextResponse.json({ error: 'Gagal menyimpan riwayat pendidikan.' }, { status: 500 });
        }
      }
    }

    const saveRelatedData = async (tableName: string, dataArray: Array<Record<string, unknown>> | undefined, foreignKey: string) => {
      const { error: deleteError } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq(foreignKey, userId);

      if (deleteError) {
        console.error(`[COMPLETE_PROFILE_API] Error clearing ${tableName}:`, deleteError.message);
        throw new Error(`Gagal membersihkan data relasi ${tableName}.`);
      }

      if (dataArray && dataArray.length > 0) {
        const rows = dataArray.map((row) => ({ ...row, [foreignKey]: userId }));
        const { error: insertError } = await supabaseAdmin
          .from(tableName)
          .insert(rows);

        if (insertError) {
          console.error(`[COMPLETE_PROFILE_API] Error inserting ${tableName}:`, insertError.message);
          throw new Error(`Gagal menyimpan data relasi ${tableName}.`);
        }
      }
    };

    await saveRelatedData('alumni_pekerja', dataToSave.alumni_pekerja, 'alumni_id');
    await saveRelatedData('alumni_bisnis', dataToSave.alumni_bisnis, 'alumni_id');
    await saveRelatedData('alumni_sosial', dataToSave.alumni_sosial, 'alumni_id');
    await saveRelatedData('alumni_kreatif', dataToSave.alumni_kreatif, 'alumni_id');
    await saveRelatedData('alumni_rumah_tangga', dataToSave.alumni_rumah_tangga, 'alumni_id');
    await saveRelatedData('alumni_mahasiswa', dataToSave.alumni_mahasiswa, 'alumni_id');
    await saveRelatedData('alumni_informal', dataToSave.alumni_informal, 'alumni_id');
    await saveRelatedData('alumni_agri', dataToSave.alumni_agri, 'alumni_id');
    await saveRelatedData('alumni_pendidik', dataToSave.alumni_pendidik, 'alumni_id');

    // Ambil data user untuk merestart token dengan status profile_completed = true
    const { data: userRow } = await supabaseAdmin
      .from('user')
      .select('email, role, username')
      .eq('id', userId)
      .single();

    const authToken = await signAuthToken({
      sub: userIdString,
      email: userRow?.email || '',
      role: userRow?.role || 'alumni',
      username: userRow?.username || undefined,
      profile_completed: true,
    });

    console.log('[COMPLETE_PROFILE_API] Profil lengkap berhasil disimpan. Memperbarui cookie JWT.');
    
    const response = NextResponse.json({ message: 'Profil berhasil disimpan!' }, { status: 200 });
    
    response.cookies.set(AUTH_COOKIE_NAME, authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_TOKEN_TTL_SECONDS,
    });

    return response;
  } catch (error: unknown) {
    console.error('[COMPLETE_PROFILE_API] ERROR FATAL:', (error as Error).message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
