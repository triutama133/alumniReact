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
  title: 'HubTalent',
  description: 'HubTalent — Platform kolaborasi dan pengembangan karir berbasis AI untuk talenta Indonesia',
  icons: {
    icon: '/logo_icon.png',
    shortcut: '/logo_icon.png',
    apple: '/logo_icon.png',
  },
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
