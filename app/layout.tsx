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
      <body className={`h-full ${inter.className}`}>
        <ThemeProvider>
          <div className="min-h-full">
            <Navigation />
            <main>
              <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
