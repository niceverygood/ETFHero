import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { DisclaimerBar, Header } from '@/components';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'ETFHero | AI ETF Analysis',
  description: 'Watch Claude, Gemini, and GPT analyze and recommend ETFs in real-time. Entertainment-focused financial content.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${spaceGrotesk.variable} dark`}>
      <body className="bg-dark-950 text-dark-100 antialiased selection:bg-brand-500/30 font-sans">
        <Providers>
          <DisclaimerBar />
          <Header />
          <main className="pt-24">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
