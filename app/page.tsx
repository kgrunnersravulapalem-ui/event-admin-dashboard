/**
 * Home Page - Event Enrollment Application
 * 
 * Redirects to dashboard.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Home page component - Redirects to dashboard
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return null;
}
