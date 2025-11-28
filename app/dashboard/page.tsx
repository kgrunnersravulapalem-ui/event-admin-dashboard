/**
 * Dashboard Home Page
 * 
 * Shows overview statistics and quick actions.
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui';
import Link from 'next/link';
import { getAllOrganizations } from '@/lib/organizationsService';
import styles from '@/styles/Dashboard.module.css';

/**
 * Dashboard statistics calculated from organizations
 */
interface DashboardStats {
  totalParticipants: number;
  totalOrganizations: number;
  category3K: number;
  category5K: number;
  category10K: number;
}

/**
 * Dashboard page component
 */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const organizations = await getAllOrganizations();
      
      // Calculate stats from organization data
      const calculatedStats: DashboardStats = {
        totalOrganizations: organizations.length,
        totalParticipants: organizations.reduce((sum, org) => sum + (org.totalParticipants || 0), 0),
        category3K: organizations.reduce((sum, org) => sum + (org.category3K || 0), 0),
        category5K: organizations.reduce((sum, org) => sum + (org.category5K || 0), 0),
        category10K: organizations.reduce((sum, org) => sum + (org.category10K || 0), 0),
      };
      
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <div className={styles.statLabel}>Organizations</div>
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
                  <div className={styles.linkTitle}>Manage Organizations</div>
                  <div className={styles.linkDesc}>Add or edit organizations</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
