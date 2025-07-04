'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabaseClient"

const formSchema = z.object({
  title: z.string().min(10, "Judul harus lebih dari 10 karakter."),
  description: z.string().min(50, "Deskripsi harus lebih dari 50 karakter."),
  required_skills: z.string().min(3, "Masukkan minimal satu skill."),
});

export default function CreateProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", required_skills: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Anda harus login untuk membuat proyek.");
      setLoading(false);
      return;
    }
    
    // Ubah string skill (dipisahkan koma) menjadi array untuk disimpan di database
    const skillsArray = values.required_skills.split(',').map(skill => skill.trim());

    const { error } = await supabase
      .from('projects')
      .insert({
        title: values.title,
        description: values.description,
        required_skills: skillsArray,
        owner_id: user.id
      });
      
    if (error) {
      toast.error("Gagal membuat proyek", { description: error.message });
    } else {
      toast.success("Proyek berhasil dibuat!");
      router.push('/projects');
      router.refresh(); // Minta router untuk memuat ulang data di halaman /projects
    }
    setLoading(false);
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Buat Proyek Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Judul Proyek</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Deskripsi Lengkap Proyek</FormLabel><FormControl><Textarea rows={8} {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="required_skills" render={({ field }) => ( <FormItem><FormLabel>Skill yang Dibutuhkan</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Pisahkan setiap skill dengan koma ( , ).</FormDescription><FormMessage /></FormItem> )} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Publikasikan Proyek"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}