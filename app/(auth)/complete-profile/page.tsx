// app/(auth)/complete-profile/page.tsx
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { User } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabaseClient"

// Skema Zod yang mencakup SEMUA kemungkinan field.
// Field spesialisasi kita buat opsional, karena hanya salah satu grup yang akan diisi.
const formSchema = z.object({
  // Fields dari alumni_db
  nama_lengkap: z.string().min(3),
  nama_panggilan: z.string().min(1),
  angkatan: z.string().min(4, "Masukkan tahun angkatan, misal: 2015"),
  fakultas_jurusan: z.string().min(5, "Wajib diisi"),
  aktivitas: z.string({ required_error: "Pilih aktivitas utama Anda." }),
  skill_gabungan: z.string().min(3, "Masukkan minimal satu skill, pisahkan dengan koma. Cth: Marketing, Desain Grafis"),
  // ... tambahkan field lain dari alumni_db jika perlu

  // Fields dari alumni_pekerja (opsional)
  nama_instansi: z.string().optional(),
  posisi: z.string().optional(),

  // Fields dari alumni_bisnis (opsional)
  nama_usaha: z.string().optional(),
  bidang_usaha: z.string().optional(),

  // Fields dari alumni_rumah_tangga (opsional)
  bidang_minat: z.string().optional(),
  // ... tambahkan semua field relevan lainnya dan buat .optional()
});

export default function CompleteProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  // Tonton perubahan pada field 'aktivitas' untuk menampilkan form dinamis
  const aktivitas = form.watch("aktivitas");

  // Cek status login saat halaman dimuat
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Anda harus login untuk melengkapi profil.");
        router.push('/login');
        return;
      }
      setUser(session.user);
      // Isi form dengan data yang mungkin sudah ada dari proses registrasi
      form.reset({
        nama_lengkap: session.user.user_metadata.nama_lengkap || '',
        nama_panggilan: session.user.user_metadata.nama_panggilan || '',
      });
    }
    fetchUser();
  }, [router, form, supabase.auth]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast.error("Sesi tidak ditemukan, silakan login kembali.");
      return;
    }
    setLoading(true);

    try {
      // 1. INSERT KE alumni_db
      const { error: alumniDbError } = await supabase
        .from('alumni_db')
        .insert({
          id: user.id,
          email: user.email,
          nama_lengkap: values.nama_lengkap,
          nama_panggilan: values.nama_panggilan,
          angkatan: parseInt(values.angkatan),
          fakultas_jurusan: values.fakultas_jurusan,
          aktivitas: values.aktivitas,
          skill_gabungan: values.skill_gabungan,
          // gabungan_data perlu di-generate oleh backend/trigger
        });

      if (alumniDbError) {
        throw new Error(`Gagal menyimpan profil utama: ${alumniDbError.message}`);
      }

      // 2. INSERT KE TABEL SPESIALISASI
      if (values.aktivitas === 'Pekerja') {
        const { error } = await supabase.from('alumni_pekerja').insert({
          alumni_id: user.id,
          nama_instansi: values.nama_instansi,
          posisi: values.posisi,
        });
        if (error) throw new Error(`Gagal menyimpan profil pekerja: ${error.message}`);

      } else if (values.aktivitas === 'Bisnis') {
        const { error } = await supabase.from('alumni_bisnis').insert({
          alumni_id: user.id,
          nama_usaha: values.nama_usaha,
          bidang_usaha: values.bidang_usaha,
        });
        if (error) throw new Error(`Gagal menyimpan profil bisnis: ${error.message}`);

      } else if (values.aktivitas === 'Rumah Tangga') {
        const { error } = await supabase.from('alumni_rumah_tangga').insert({
          alumni_id: user.id,
          bidang_minat: values.bidang_minat,
        });
        if (error) throw new Error(`Gagal menyimpan profil rumah tangga: ${error.message}`);
      }
      
      toast.success("Profil berhasil disimpan!");
      router.push('/'); // Arahkan ke homepage

    } catch (error: any) {
      toast.error("Terjadi Kesalahan", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <div>Memuat...</div>; // Tampilkan loading saat cek sesi
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <CardTitle className="text-2xl">Lengkapi Profil Anda</CardTitle>
          <CardDescription>Satu langkah lagi untuk mengaktifkan akun Anda sepenuhnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* === BAGIAN PROFIL UMUM === */}
              <FormField name="nama_lengkap" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField name="nama_panggilan" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Nama Panggilan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField name="angkatan" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Tahun Angkatan</FormLabel><FormControl><Input type="number" placeholder="2015" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField name="fakultas_jurusan" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Fakultas / Jurusan</FormLabel><FormControl><Input placeholder="Fakultas Teknik / Teknik Informatika" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField name="skill_gabungan" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Keahlian Utama (Skills)</FormLabel><FormControl><Textarea placeholder="Digital Marketing, Public Speaking, Python" {...field} /></FormControl><FormDescription>Pisahkan setiap keahlian dengan koma.</FormDescription><FormMessage /></FormItem> )} />
              
              <FormField
                control={form.control}
                name="aktivitas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktivitas Utama Saat Ini</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih aktivitas Anda" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Pekerja">Pekerja / Profesional</SelectItem>
                        <SelectItem value="Bisnis">Wirausaha</SelectItem>
                        <SelectItem value="Rumah Tangga">Ibu Rumah Tangga</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* === BAGIAN FORM DINAMIS === */}
              {aktivitas === 'Pekerja' && (
                <div className="p-4 border rounded-md space-y-4">
                  <h3 className="font-semibold">Detail Pekerjaan</h3>
                  <FormField name="nama_instansi" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Nama Perusahaan/Instansi</FormLabel><FormControl><Input placeholder="PT Teknologi Maju" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField name="posisi" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Posisi/Jabatan</FormLabel><FormControl><Input placeholder="Software Engineer" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              )}

              {aktivitas === 'Bisnis' && (
                <div className="p-4 border rounded-md space-y-4">
                  <h3 className="font-semibold">Detail Bisnis</h3>
                  <FormField name="nama_usaha" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Nama Usaha</FormLabel><FormControl><Input placeholder="Kopi Senja" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField name="bidang_usaha" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Bidang Usaha</FormLabel><FormControl><Input placeholder="Kuliner" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              )}
              
              {aktivitas === 'Rumah Tangga' && (
                <div className="p-4 border rounded-md space-y-4">
                   <h3 className="font-semibold">Minat dan Komunitas</h3>
                  <FormField name="bidang_minat" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Bidang Minat</FormLabel><FormControl><Input placeholder="Memasak, Menulis, Kerajinan Tangan" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Profil & Lanjutkan"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}