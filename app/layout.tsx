import type { Metadata, Viewport } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-fraunces',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: { default: 'Magpie', template: '%s · Magpie' },
  description:
    'A personal wiki for the things you find shiny, with a conversation partner who remembers.',
  icons: { icon: '/favicon.png' },
  metadataBase: new URL('https://magpie.wiki'),
};

export const viewport: Viewport = {
  themeColor: '#0A0A09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${fraunces.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
