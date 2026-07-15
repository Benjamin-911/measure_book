import './globals.css';
import { Fraunces, IBM_Plex_Mono, Inter } from 'next/font/google';
import AuthGuard from '@/components/AuthGuard';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-serif-raw',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-mono-raw',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans-raw',
  display: 'swap',
});

export const metadata = {
  title: 'Measure Track',
  description: 'Client measurement tracker for tailors and fashion designers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Measure Track',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1E3A5F',
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${ibmPlexMono.variable} ${inter.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}