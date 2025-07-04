import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlumniSearchResult } from "@/lib/types";
import Link from "next/link";

// Ambil hanya dua huruf pertama dari nama untuk fallback avatar
const getInitials = (name: string | null | undefined) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

type AlumniCardProps = {
  alumni: AlumniSearchResult;
};

export function AlumniCard({ alumni }: AlumniCardProps) {
  // Pecah skills untuk ditampilkan sebagai badge
  const skills = alumni.skill_gabungan?.split(',').map(s => s.trim()).filter(Boolean) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          {/* Anda bisa menambahkan kolom URL gambar profil di masa depan */}
          <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${alumni.nama_lengkap}`} />
          <AvatarFallback>{getInitials(alumni.nama_lengkap)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h3 className="text-xl font-bold">{alumni.nama_lengkap}</h3>
          <p className="text-sm text-muted-foreground">{alumni.aktivitas} • {alumni.fakultas_jurusan}</p>
        </div>
      </CardHeader>
      <CardContent>
        {skills.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {skills.slice(0, 5).map(skill => ( // Tampilkan maks 5 skill
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
        )}
        <Button asChild className="w-full">
          <Link href={`/profile/${alumni.id}`}>Lihat Profil Lengkap</Link>
        </Button>
      </CardContent>
    </Card>
  );
}