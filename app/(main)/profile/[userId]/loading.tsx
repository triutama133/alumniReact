import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <Skeleton className="h-28 w-full rounded-none" />
        <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
          <Skeleton className="h-24 w-24 rounded-full border-4 border-white dark:border-slate-900 flex-shrink-0" />
          <div className="space-y-2 pb-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
