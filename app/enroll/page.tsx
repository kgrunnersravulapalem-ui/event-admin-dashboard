/**
 * Enrollment Page
 * 
 * Page for enrolling new participants
 */

'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EnrollmentForm from '@/components/forms/EnrollmentForm';
import { Card } from '@/components/ui';
import styles from '@/styles/Enroll.module.css';

/**
 * Enrollment page component
 */
export default function EnrollPage() {
  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>New Enrollment</h1>
          <p className={styles.subtitle}>
            Register a new participant for the event
          </p>
        </div>

        <Card className={styles.formCard}>
          <EnrollmentForm />
        </Card>
      </div>
    </DashboardLayout>
  );
}
