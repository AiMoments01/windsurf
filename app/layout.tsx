import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/navigation';
import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Rehasport Management System',
  description: 'Ein System zur Verwaltung von Rehasport-Kursen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
      </head>
      <body className={`h-full ${inter.className}`}>
        <ThemeProvider>
          <div className="min-h-full">
            <Navigation />
            <main>
              <div className="mx-auto max-w-7xl py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
