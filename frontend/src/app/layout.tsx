

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'CodeCollab - Real-time Code Collaboration',
  description: 'Turn-based collaborative coding platform with real-time synchronization. Code together with developers worldwide.',
  keywords: ['code collaboration', 'pair programming', 'real-time coding', 'developer tools', 'collaborative development'],
  authors: [{ name: 'CodeCollab Team' }],
  robots: 'index, follow',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'CodeCollab - Real-time Code Collaboration',
    description: 'Turn-based collaborative coding platform with real-time synchronization',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeCollab - Real-time Code Collaboration',
    description: 'Turn-based collaborative coding platform with real-time synchronization',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}