import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FnB Operations & Financial Analytics Portal',
  description:
    'Consolidated executive reporting, multi-brand unit economics & kitchen throughput across Greenville & Kemang',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#121316] text-[#f4f4f6] selection:bg-emerald-500/25 selection:text-emerald-200 min-h-screen`}
      >
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
