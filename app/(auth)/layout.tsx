// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="motion-page">
      <div className="app-shell stagger-children">{children}</div>
    </div>
  );
}
