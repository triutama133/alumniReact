import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectWithOwner } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Calendar, User, ArrowUpRight } from "lucide-react"

interface CustomUserForProjectCard {
  id: string;
  email: string;
  role: string | null;
}

interface ProjectCardProps {
  project: ProjectWithOwner;
  user: CustomUserForProjectCard | null;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const skills = project.required_skills || [];

  return (
    <Link href={`/projects/${project.id}`} className="block h-full group">
      <Card className="premium-light-card liquid-glass-border flex flex-col h-full cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] text-slate-800 dark:text-slate-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-slate-900 dark:text-white text-base group-hover:text-indigo-650 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
              {project.title}
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-550 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
          </div>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
            <User className="h-3 w-3 text-slate-500" />
            <span>Oleh: {project.owner?.[0]?.nama_lengkap || 'Anonim'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow pb-4">
          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
            {project.description}
          </p>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill) => (
                <Badge 
                  key={skill} 
                  variant="secondary"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-900/50 dark:text-slate-300 text-[10px] py-0.5 px-2 rounded-full border border-slate-200 dark:border-white/5"
                >
                  {skill}
                </Badge>
              ))}
              {skills.length > 3 && (
                <span className="text-[10px] text-slate-550 dark:text-slate-500 self-center font-medium ml-1">
                  +{skills.length - 3} lainnya
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-slate-200 dark:border-white/5 pt-3 pb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-500" />
            {new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-750 dark:group-hover:text-indigo-300 font-semibold flex items-center gap-0.5">
            Detail Proyek &rarr;
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

