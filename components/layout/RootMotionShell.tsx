'use client';

import { usePathname } from 'next/navigation';

export default function RootMotionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLanding = pathname === '/landing';

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="app-ambient app-ambient--one" aria-hidden="true" />
      <div className="app-ambient app-ambient--two" aria-hidden="true" />
      <div className="app-ambient app-ambient--three" aria-hidden="true" />
      <div className="app-shell motion-page">{children}</div>
    </>
  );
}
