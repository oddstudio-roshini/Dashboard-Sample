/**
 * app/page.tsx
 * ─────────────
 * Root page. Immediately redirects:
 *   → /dashboard if the user is logged in (token in localStorage)
 *   → /login if the user is not authenticated
 *
 * Uses next/navigation's redirect() for server-side redirect,
 * but since auth check is client-side (localStorage), we use
 * a client component with useRouter.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
