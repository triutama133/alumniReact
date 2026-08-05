import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlumniSearchResult } from "@/lib/types";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

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
  // Pecah skills untuk ditampilkan sebagai badge (pisahkan koma atau titik koma)
  const skills = alumni.skill_gabungan?.split(/[;,]/).map(s => s.trim()).filter(Boolean) || [];

  return (
    <Card className="premium-light-card liquid-glass-border flex flex-col h-full hover:scale-[1.02] hover:border-primary/45 hover:shadow-md transition-all duration-300 text-slate-800 dark:text-slate-200">
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <Avatar className="h-12 w-12 border border-slate-200 dark:border-slate-800">
          <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${alumni.nama_lengkap}`} />
          <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-850 dark:text-slate-200 text-sm font-semibold">
            {getInitials(alumni.nama_lengkap)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={alumni.nama_lengkap || ''}>
            {alumni.nama_lengkap}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={`${alumni.aktivitas || ''} • ${alumni.fakultas_jurusan || ''}`}>
            <span className="font-medium text-primary">{alumni.aktivitas}</span>
            {alumni.fakultas_jurusan && ` • ${alumni.fakultas_jurusan}`}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between pt-2">
        {skills.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-1">
            {skills.slice(0, 4).map(skill => (
              <Badge 
                key={skill} 
                variant="secondary"
                className="bg-primary/5 hover:bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary-foreground/90 text-[9px] font-semibold py-0.5 px-2 rounded-full border border-primary/20"
              >
                {skill}
              </Badge>
            ))}
            {skills.length > 4 && (
              <span className="text-[9px] text-slate-450 dark:text-slate-500 self-center font-medium ml-1">
                +{skills.length - 4} lainnya
              </span>
            )}
          </div>
        ) : (
          <div className="mb-4 h-5" /> // Spacer jika tidak ada skill
        )}
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white rounded-full text-xs font-semibold py-1.5 h-9 transition-all mt-auto flex items-center justify-center gap-1">
          <Link href={`/profile/${alumni.id}`}>
            <span>Lihat Profil Lengkap</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}