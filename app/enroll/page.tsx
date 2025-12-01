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
import { useOrganizations } from '@/hooks/useOrganizations';

/**
 * Enrollment page component
 */
export default function EnrollPage() {
  // Use real-time store for organizations
  const { allOrganizations } = useOrganizations({
    autoInitialize: true
  });

  // Pass simplified orgs to form
  const simplifiedOrgs = allOrganizations.map(org => ({ name: org.name }));

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>New Enrollment</h1>
        </div>

        <Card className={styles.formCard}>
          <EnrollmentForm organizations={simplifiedOrgs} />
        </Card>
      </div>
    </DashboardLayout>
  );
}
