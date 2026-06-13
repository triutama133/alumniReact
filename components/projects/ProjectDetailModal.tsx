'use client'

import { useState } from "react";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ProjectWithOwner } from "@/lib/types" // Pastikan ini benar
import { Badge } from "@/components/ui/badge"; // <--- Tambahkan import Badge di sini

// Hapus import User dari "@supabase/supabase-js" karena kita tidak lagi menggunakan User tipe Supabase di sini
// import { User } from "@supabase/supabase-js"; 

// Definisikan tipe kustom untuk pengguna
// Ini harus sama persis dengan yang ada di ProjectCard.tsx dan app/(main)/page.tsx
interface CustomUserForProjectCard {
  id: string;
  email: string;
  role: string | null;
}

// Definisikan tipe untuk props ProjectDetailModal
interface ProjectDetailModalProps {
  project: ProjectWithOwner;
  user: CustomUserForProjectCard | null; // <--- PERBARUI TIPE INI
  _open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailModal({ project, user, onOpenChange }: ProjectDetailModalProps) {
  // Anda mungkin memiliki state dan logika lain di sini, seperti untuk mengajukan diri
  const [isApplying, setIsApplying] = useState(false); // Contoh state
  const isOwner = user?.id === project.owner?.[0]?.id; // Pindahkan logika isOwner di sini

  const handleApply = () => {
    setIsApplying(true);
    // Logika pengajuan diri ke API atau database
    console.log(`User ${user?.email} mengajukan diri untuk proyek ${project.title}`);
    // Setelah selesai (misalnya, ada respons dari API), Anda bisa menutup modal
    setTimeout(() => {
      setIsApplying(false);
      onOpenChange(false); // Tutup modal setelah pengajuan
      alert('Anda berhasil mengajukan diri untuk proyek ini!'); // Ganti dengan pesan UI yang lebih baik
    }, 1500);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="text-2xl">{project.title}</DialogTitle>
        <DialogDescription>
          Oleh: {project.owner?.[0]?.nama_lengkap || 'Anonim'} • Dibuat pada {new Date(project.created_at).toLocaleDateString('id-ID')}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6"> {/* Perbaiki tata letak agar sesuai dengan struktur Anda */}
        <div>
          <h4 className="font-semibold mb-2">Deskripsi Proyek</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Skill yang Dibutuhkan</h4>
          <div className="flex flex-wrap gap-2">
            {project.required_skills?.map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
        {/* Tambahkan status proyek dan info user (opsional) */}
        <p className="text-sm text-gray-500">
          Status: {project.status}
        </p>
        {user && (
          <p className="text-sm text-gray-600">
            Login sebagai: {user.email} (Role: {user.role || 'N/A'})
          </p>
        )}
      </div>
      <DialogFooter>
        {/* Tombol Ajukan Diri hanya jika bukan pemilik dan user login */}
        {!isOwner && user ? (
          <Button onClick={handleApply} disabled={isApplying}>
            {isApplying ? 'Mengajukan...' : 'Ajukan Diri'}
          </Button>
        ) : user ? ( // Jika user login tapi dia owner
          <p className="text-sm text-muted-foreground">Anda adalah pemilik proyek ini.</p>
        ) : ( // Jika user tidak login
          <p className="text-sm text-muted-foreground">Login untuk mengajukan diri.</p>
        )}
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
