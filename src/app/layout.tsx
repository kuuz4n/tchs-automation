import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'The Happy Club Studios | Proposal & Invoice Automation',
  description: 'Automated proposals, service pricing rules, and sales invoice generation with Canva branding.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
        <AuthGuard>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
