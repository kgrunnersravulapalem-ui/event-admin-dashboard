/**
 * Dashboard Home Page
 * 
 * Shows overview statistics and quick actions.
 */

'use client';

import React, { useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui';
import Link from 'next/link';
import styles from '@/styles/Dashboard.module.css';
import { useParticipants } from '@/hooks/useParticipants';
import { useOrganizations } from '@/hooks/useOrganizations';

// Feature flag for safe migration
const USE_REALTIME_STORE = true;



/**
 * Dashboard page component
 */
export default function DashboardPage() {


  // Real-time Store Integration
  const {
    allParticipants,
    isLoading: isStoreLoading,
    initialize: initializeStore
  } = useParticipants({
    autoInitialize: USE_REALTIME_STORE
  });

  const {
    allOrganizations,
    isLoading: isOrgsLoading,
  } = useOrganizations({
    autoInitialize: USE_REALTIME_STORE
  });

  const loading = isStoreLoading || isOrgsLoading;

  const stats = useMemo(() => {
    if (!USE_REALTIME_STORE || (allParticipants.length === 0 && allOrganizations.length === 0)) {
      return null;
    }

    return {
      totalOrganizations: allOrganizations.length,
      totalParticipants: allParticipants.length,
      category3K: allParticipants.filter(p => p.category === '3K').length,
      category5K: allParticipants.filter(p => p.category === '5K').length,
      category10K: allParticipants.filter(p => p.category === '10K').length,
    };
  }, [allParticipants, allOrganizations]);



  return (
    <DashboardLayout>
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Dashboard</h1>

        {/* Statistics Grid */}
        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#eff6ff' }}>
              <svg fill="none" stroke="#134e4a" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{loading ? '...' : stats?.totalParticipants || 0}</div>
              <div className={styles.statLabel}>Total Participants</div>
            </div>
          </Card>

          <Card className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
              <svg fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{loading ? '...' : stats?.totalOrganizations || 0}</div>
              <div className={styles.statLabel}>Organizations/Schools</div>
            </div>
          </Card>
        </div>

        {/* Category Breakdown */}
        <h2 className={styles.sectionTitle}>Category Breakdown</h2>
        <div className={styles.categoryGrid}>
          <Card className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryName}>3K Run</span>
              <span className={styles.categoryCount}>{loading ? '...' : stats?.category3K || 0}</span>
            </div>
            {!loading && stats && stats.totalParticipants > 0 && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${(stats.category3K / stats.totalParticipants) * 100}%`,
                    background: '#134e4a'
                  }}
                />
              </div>
            )}
          </Card>

          <Card className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryName}>5K Run</span>
              <span className={styles.categoryCount}>{loading ? '...' : stats?.category5K || 0}</span>
            </div>
            {!loading && stats && stats.totalParticipants > 0 && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${(stats.category5K / stats.totalParticipants) * 100}%`,
                    background: '#22c55e'
                  }}
                />
              </div>
            )}
          </Card>

          <Card className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryName}>10K Run</span>
              <span className={styles.categoryCount}>{loading ? '...' : stats?.category10K || 0}</span>
            </div>
            {!loading && stats && stats.totalParticipants > 0 && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${(stats.category10K / stats.totalParticipants) * 100}%`,
                    background: '#f59e0b'
                  }}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Quick Links */}
        <h2 className={styles.sectionTitle}>Quick Links</h2>
        <div className={styles.linksGrid}>
          <Link href="/participants" className={styles.linkCard}>
            <Card>
              <div className={styles.linkContent}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <div className={styles.linkTitle}>View Participants</div>
                  <div className={styles.linkDesc}>Manage all enrollments</div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/organizations" className={styles.linkCard}>
            <Card>
              <div className={styles.linkContent}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div>
                  <div className={styles.linkTitle}>Manage Organizations/Schools</div>
                  <div className={styles.linkDesc}>Add or edit organizations</div>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/stats" className={styles.linkCard}>
            <Card>
              <div className={styles.linkContent}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div>
                  <div className={styles.linkTitle}>Overall Statistics</div>
                  <div className={styles.linkDesc}>View global event stats</div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/registration-lookup" className={styles.linkCard}>
            <Card>
              <div className={styles.linkContent}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242m-4.243 4.242L9.88 9.88" />
                </svg>
                <div>
                  <div className={styles.linkTitle}>Registration Lookup</div>
                  <div className={styles.linkDesc}>Find registration by Order ID</div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/transaction-search" className={styles.linkCard}>
            <Card>
              <div className={styles.linkContent}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <div className={styles.linkTitle}>Transaction Search</div>
                  <div className={styles.linkDesc}>Search PhonePe transactions</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
