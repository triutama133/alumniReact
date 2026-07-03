// app/layout.tsx
import './globals.css'; // File CSS global Anda
import { Geist, Geist_Mono } from "next/font/google"; // Import font
import RootMotionShell from '@/components/layout/RootMotionShell';

// Inisialisasi font Geist
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Indonesia Talent Hub',
  description: 'Temukan peluang kolaborasi atau cari talenta terbaik untuk proyek Anda selanjutnya.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RootMotionShell>{children}</RootMotionShell>
      </body>
    </html>
  );
}
