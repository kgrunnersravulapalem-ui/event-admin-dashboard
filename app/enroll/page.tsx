/**
 * Enrollment Page
 * 
 * Page for enrolling new participants
 */

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EnrollmentForm from '@/components/forms/EnrollmentForm';
import { Card } from '@/components/ui';
import { getAllOrganizations } from '@/lib/organizationsService';
import styles from '@/styles/Enroll.module.css';

/**
 * Enrollment page component
 */
/**
 * Enrollment page component
 */
export default async function EnrollPage() {
  const organizations = await getAllOrganizations();

  // Pass only necessary data to avoid serialization issues with Dates
  const simplifiedOrgs = organizations.map(org => ({ name: org.name }));

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
