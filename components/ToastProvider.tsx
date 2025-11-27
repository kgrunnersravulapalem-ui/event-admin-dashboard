'use client';

import { Toaster } from 'react-hot-toast';

/**
 * Toast Provider Component
 * 
 * Client-side wrapper for react-hot-toast Toaster
 */
export default function ToastProvider() {
  return (
    <Toaster 
      position="top-center"
      toastOptions={{
        duration: 1000,
        style: {
          background: '#1e293b',
          color: '#fff',
          fontWeight: 500,
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        success: {
          style: {
            background: '#059669',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#059669',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#dc2626',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#dc2626',
          },
        },
      }}
    />
  );
}
