/**
 * app/layout.tsx
 * ───────────────
 * Root layout for the Next.js App Router.
 * Wraps every page with:
 *   - HTML + body structure
 *   - Global CSS (Tailwind + custom variables)
 *   - Google Fonts (Inter)
 *   - React Hot Toast provider for notifications
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ARthoMove Admin Portal',
  description: 'Doctor Account Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1d2e',
              color: '#fff',
              border: '1px solid #252840',
            },
          }}
        />
      </body>
    </html>
  );
}
