// app/api/complete-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as z from 'zod'; // Import zod untuk validasi di server
import { headers } from 'next/headers'; // Untuk mendapatkan userId dari header

import { AlumniProfileType } from '@/lib/types'; // Import tipe AlumniProfileType

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('ERROR: Variabel lingkungan Supabase tidak ditemukan untuk route complete-profile.');
  throw new Error('Missing environment variables for complete-profile API route.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// --- Zod Schema untuk Validasi Data Masuk (Harus cocok dengan schema form di klien) ---
const serverFormSchema = z.object({
  // Q1-Q16 (General Information)
  nama_lengkap: z.string().min(1),
  nama_panggilan: z.string().min(1),
  tahun_lahir: z.number().int().min(1900).max(new Date().getFullYear()),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']),
  kota_domisili: z.string().min(1),
  nomor_handphone: z.string().regex(/^62\d{9,12}$/),
  pendidikan_terakhir: z.enum(['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3']),
  nama_institusi_pendidikan_terakhir: z.string().min(1),
  jurusan_studi: z.string().min(1),
  tahun_kelulusan: z.number().int().min(1900).max(new Date().getFullYear() + 5),
  skill_gabungan: z.string().min(1),
  bahasa_dikuasai: z.string().min(1),
  sertifikasi: z.string().optional().nullable(),
  instagram_link: z.string().url().or(z.literal('')).optional().nullable(),
  linkedin_link: z.string().url().or(z.literal('')).optional().nullable(),
  portofolio_link: z.string().url().or(z.literal('')).optional().nullable(),

  // Q17 (Aktivitas/Pekerjaan - Disimpan sebagai string comma-separated di DB)
  aktivitas_db: z.string().min(1, 'Pilih minimal satu aktivitas/pekerjaan.'),

  // Q18 (Jenis Dukungan - Disimpan sebagai string comma-separated di DB)
  jenis_dukungan_dibutuhkan_db: z.string().min(1, 'Pilih minimal satu jenis dukungan.'),

  // Q19 (Bidang Kontribusi - Disimpan sebagai string comma-separated di DB)
  bidang_kontribusi_minat_db: z.string().min(1, 'Pilih minimal satu bidang kontribusi.'),

  // Conditional Schemas (perhatikan ini adalah array, tapi mungkin hanya ada satu entri)
  alumni_pekerja: z.array(z.object({
    keahlian_pekerja: z.string().min(1),
    nama_instansi: z.string().min(1),
    posisi: z.string().min(1),
    pengalaman_proyek: z.string().min(1),
    akses_jejaring: z.boolean(),
    pengalaman_bermitra: z.boolean(),
  })).optional(),
  alumni_bisnis: z.array(z.object({
    keahlian_wirausahaan: z.string().min(1),
    produk_layanan_utama: z.string().min(1),
    nama_usaha: z.string().min(1),
    skala_usaha: z.string().min(1),
    kendala_bisnis: z.string().min(1),
    target_pasar: z.enum(['B2C', 'B2B', 'B2C dan B2B']),
  })).optional(),
  alumni_sosial: z.array(z.object({
    keahlian_sosial: z.string().min(1),
    pengalaman_proyek_sosial: z.string().min(1),
    isu_fokus: z.string().min(1),
    nama_organisasi: z.string().min(1),
    pengalaman_bermitra_sosial: z.boolean(),
  })).optional(),
  alumni_kreatif: z.array(z.object({
    keahlian_kreatif: z.string().min(1),
    platform_digital_utama: z.string().min(1),
    jenis_konten: z.string().min(1),
    total_jangkauan: z.string().min(1),
    kisaran_rate_card: z.string().min(1),
    demografi_followers: z.string().min(1),
  })).optional(),
  alumni_rumah_tangga: z.array(z.object({
    keahlian_irt: z.string().min(1),
    kegiatan_organisasi_irt: z.string().min(1),
    pengalaman_tim_irt: z.boolean(),
    mencari_pekerjaan_kolaborasi_irt: z.boolean(),
  })).optional(),
  alumni_mahasiswa: z.array(z.object({
    keahlian_mahasiswa: z.string().min(1),
    kegiatan_organisasi_mahasiswa: z.string().min(1),
    pengalaman_tim_mahasiswa: z.boolean(),
    mencari_pekerjaan_kolaborasi_mahasiswa: z.boolean(),
    pengalaman_magang: z.string().min(1),
  })).optional(),
  alumni_informal: z.array(z.object({
    keahlian_informal: z.string().min(1),
    pengalaman_tim_informal: z.boolean(),
    pernah_rekrut_memimpin: z.boolean(),
  })).optional(),
  alumni_agri: z.array(z.object({
    keahlian_agri: z.string().min(1),
    komoditas_utama: z.string().min(1),
    tergabung_kelompok: z.boolean(),
    skala_usaha_agri: z.string().min(1),
    nilai_tambah_diterapkan: z.string().min(1),
    kendala_dihadapi_agri: z.string().min(1),
  })).optional(),
  alumni_pendidik: z.array(z.object({
    keahlian_pendidik: z.string().min(1),
    jenjang_pendidikan: z.string().min(1),
    mata_pelajaran: z.string().min(1),
    inovasi_pembelajaran: z.string().min(1),
    mengajar_bimbel: z.boolean(),
  })).optional(),
});

export async function POST(req: NextRequest) {
  console.log('--- Memulai Permintaan Complete Profile API ---');
  try {
    const headersList = await headers(); // Perbaikan: Tambahkan 'await' di sini
    const userId = headersList.get('x-user-id'); // Baris 124

    if (!userId) {
      console.log('[COMPLETE_PROFILE_API] User ID tidak ditemukan di header.');
      return NextResponse.json({ error: 'Autentikasi gagal: User ID tidak ditemukan.' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[COMPLETE_PROFILE_API] Menerima body:', body);

    const validationResult = serverFormSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[COMPLETE_PROFILE_API] Validasi Gagal:', validationResult.error.errors);
      return NextResponse.json({ error: 'Data tidak valid.', details: validationResult.error.errors }, { status: 400 });
    }
    const dataToSave = validationResult.data;

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
        pendidikan_terakhir: dataToSave.pendidikan_terakhir,
        nama_institusi_pendidikan_terakhir: dataToSave.nama_institusi_pendidikan_terakhir,
        jurusan_studi: dataToSave.jurusan_studi,
        tahun_kelulusan: dataToSave.tahun_kelulusan,
        skill_gabungan: dataToSave.skill_gabungan,
        bahasa_dikuasai: dataToSave.bahasa_dikuasai,
        sertifikasi: dataToSave.sertifikasi,
        instagram_link: dataToSave.instagram_link,
        linkedin_link: dataToSave.linkedin_link,
        portofolio_link: dataToSave.portofolio_link,
        aktivitas: dataToSave.aktivitas_db,
        jenis_dukungan_dibutuhkan: dataToSave.jenis_dukungan_dibutuhkan_db,
        bidang_kontribusi_minat: dataToSave.bidang_kontribusi_minat_db,
      }, { onConflict: 'id' });

    if (alumniDbError) {
      console.error('[COMPLETE_PROFILE_API] Error upserting alumni_db:', alumniDbError.message);
      return NextResponse.json({ error: 'Gagal menyimpan data dasar profil.', details: alumniDbError.message }, { status: 500 });
    }
    console.log('[COMPLETE_PROFILE_API] Data dasar profil berhasil disimpan/diperbarui.');

    const saveRelatedData = async (tableName: string, dataArray: any[], foreignKey: string) => {
      if (dataArray && dataArray.length > 0) {
        const dataToUpsert = { ...dataArray[0], [foreignKey]: userId };
        
        const { data: existingRelated, error: fetchRelatedError } = await supabaseAdmin
          .from(tableName)
          .select('id')
          .eq(foreignKey, userId)
          .single();

        if (fetchRelatedError && fetchRelatedError.code !== 'PGRST116') {
          console.error(`[COMPLETE_PROFILE_API] Error fetching existing ${tableName}:`, fetchRelatedError.message);
          throw new Error(`Gagal memuat data relasi ${tableName}.`);
        }

        let upsertResult;
        if (existingRelated) {
          upsertResult = await supabaseAdmin
            .from(tableName)
            .update(dataToUpsert)
            .eq('id', existingRelated.id);
          console.log(`[COMPLETE_PROFILE_API] Memperbarui data ${tableName}.`);
        } else {
          upsertResult = await supabaseAdmin
            .from(tableName)
            .insert(dataToUpsert);
          console.log(`[COMPLETE_PROFILE_API] Menyisipkan data ${tableName}.`);
        }

        if (upsertResult.error) {
          console.error(`[COMPLETE_PROFILE_API] Error upserting ${tableName}:`, upsertResult.error.message);
          throw new Error(`Gagal menyimpan data relasi ${tableName}.`);
        }
      }
    };

    if (dataToSave.alumni_pekerja && dataToSave.alumni_pekerja.length > 0) {
      await saveRelatedData('alumni_pekerja', dataToSave.alumni_pekerja, 'alumni_id');
    }
    if (dataToSave.alumni_bisnis && dataToSave.alumni_bisnis.length > 0) {
      await saveRelatedData('alumni_bisnis', dataToSave.alumni_bisnis, 'alumni_id');
    }
    if (dataToSave.alumni_sosial && dataToSave.alumni_sosial.length > 0) {
      await saveRelatedData('alumni_sosial', dataToSave.alumni_sosial, 'alumni_id');
    }
    if (dataToSave.alumni_kreatif && dataToSave.alumni_kreatif.length > 0) {
      await saveRelatedData('alumni_kreatif', dataToSave.alumni_kreatif, 'alumni_id');
    }
    if (dataToSave.alumni_rumah_tangga && dataToSave.alumni_rumah_tangga.length > 0) {
      await saveRelatedData('alumni_rumah_tangga', dataToSave.alumni_rumah_tangga, 'alumni_id');
    }
    if (dataToSave.alumni_mahasiswa && dataToSave.alumni_mahasiswa.length > 0) {
      await saveRelatedData('alumni_mahasiswa', dataToSave.alumni_mahasiswa, 'alumni_id');
    }
    if (dataToSave.alumni_informal && dataToSave.alumni_informal.length > 0) {
      await saveRelatedData('alumni_informal', dataToSave.alumni_informal, 'alumni_id');
    }
    if (dataToSave.alumni_agri && dataToSave.alumni_agri.length > 0) {
      await saveRelatedData('alumni_agri', dataToSave.alumni_agri, 'alumni_id');
    }
    if (dataToSave.alumni_pendidik && dataToSave.alumni_pendidik.length > 0) {
      await saveRelatedData('alumni_pendidik', dataToSave.alumni_pendidik, 'alumni_id');
    }

    console.log('[COMPLETE_PROFILE_API] Profil lengkap berhasil disimpan.');
    return NextResponse.json({ message: 'Profil berhasil disimpan!' }, { status: 200 });

  } catch (error: unknown) {
    console.error('[COMPLETE_PROFILE_API] ERROR FATAL:', (error as Error).message);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server.' }, { status: 500 });
  }
}
