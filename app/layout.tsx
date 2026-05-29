import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
