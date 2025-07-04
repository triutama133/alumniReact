'use client'

import { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectWithOwner } from "@/lib/types" // Pastikan ini benar
import { ProjectDetailModal } from "./ProjectDetailModal" // Pastikan ini mengimpor dari file ProjectDetailModal yang terpisah

// Definisikan tipe kustom untuk pengguna
// Ini harus sama persis dengan CustomUserForProjectCard yang akan didefinisikan di ProjectDetailModal.tsx
// Idealnya, tipe ini harus ada di file tipe global (misalnya, '@/lib/types.ts')
interface CustomUserForProjectCard {
  id: string;
  email: string;
  role: string | null; // role bisa null
}

// Perbaikan: Definisikan interface ProjectCardProps di sini, sebelum digunakan oleh komponen
interface ProjectCardProps {
  project: ProjectWithOwner;
  user: CustomUserForProjectCard | null; // Perbarui tipe 'user' di sini
}

export function ProjectCard({ project, user }: ProjectCardProps) { // <--- Pastikan ProjectCardProps digunakan di sini
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Card className="flex flex-col h-full cursor-pointer hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle>{project.title}</CardTitle>
            <CardDescription>Oleh: {project.owner?.[0]?.nama_lengkap || 'Anonim'}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
          </CardContent>
          <CardFooter>
            <div className="w-full text-center text-sm text-primary">
              Lihat Detail & Ajukan Diri
            </div>
          </CardFooter>
        </Card>
      </DialogTrigger>
      
      {/* Sekarang kita bisa meneruskan 'user' ke modal detail */}
      <ProjectDetailModal 
        project={project} 
        user={user} 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </Dialog>
  );
}
