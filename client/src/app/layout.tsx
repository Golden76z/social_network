import type { Metadata } from 'next';
import { Providers } from '@/context/Providers';
import { ErrorProvider } from '@/lib/error/errorContext';
import { ErrorToastContainer } from '@/components/ui/UserFriendlyError';
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
  title: 'Social Network',
  description: 'A modern social networking platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorProvider>
          <Providers>
            {children}
            <ErrorToastContainer />
          </Providers>
        </ErrorProvider>
      </body>
    </html>
  );
}
