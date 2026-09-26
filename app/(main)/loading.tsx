// Shown instantly by Next.js while any route under this layout's server
// component is still fetching its data, so navigation never leaves the user
// staring at a frozen previous page — the navbar (in the layout) stays live,
// only this content area shows a skeleton until the real page streams in.
import { Skeleton } from '@/components/ui/skeleton';

export default function MainLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
