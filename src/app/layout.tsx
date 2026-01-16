import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_Tamil } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const notoSans = Noto_Sans({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: '--font-noto-tamil',
  subsets: ['tamil'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'TamilPSLE - Tamil Exam Prep for Singapore Students',
  description:
    'Practice Tamil PSLE questions with MCQ drills, instant word meanings, and progress tracking for Singapore primary school students.',
  keywords: ['Tamil', 'PSLE', 'Singapore', 'exam prep', 'MCQ', 'primary school'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} ${notoSansTamil.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
