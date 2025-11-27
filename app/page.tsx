/**
 * Home Page - Event Enrollment Application
 * 
 * Main landing page with enrollment form.
 * Implements client-side rendering for form interactivity.
 */

'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import EnrollmentForm from '@/components/forms/EnrollmentForm';
import { Card } from '@/components/ui';
import styles from '@/styles/Home.module.css';

/**
 * Home page component
 */
export default function Home() {
  return (
    <>
      {/* Toast notifications container */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.logoContainer}>
              <div className={styles.logo}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 4L4 10L16 16L28 10L16 4Z"
                    fill="#3b82f6"
                    opacity="0.8"
                  />
                  <path
                    d="M4 16L16 22L28 16"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 22L16 28L28 22"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className={styles.title}>Event Enrollment</h1>
            </div>
            <p className={styles.subtitle}>
              Register for our upcoming marathon event
            </p>
          </header>

          {/* Form Card */}
          <Card className={styles.card}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Participant Registration</h2>
              <p className={styles.formDescription}>
                Please fill in your details to complete your enrollment
              </p>
            </div>
            
            <EnrollmentForm />
          </Card>

          {/* Footer */}
          <footer className={styles.footer}>
            <p>© 2025 Event Enrollment. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </>
  );
}
