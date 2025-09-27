// app/layout.tsx
import './globals.css'; // File CSS global Anda
import { Geist, Geist_Mono } from "next/font/google"; // Import font

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Children di sini akan merujuk ke app/(main)/layout.tsx atau halaman lain yang tidak dalam grup */}
        {children}
      </body>
    </html>
  );
}
