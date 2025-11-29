/**
 * Statistics Page
 * 
 * Displays organization-level statistics
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dropdown, Card } from '@/components/ui';
import { Organization, Participant } from '@/types';
import { getAllOrganizations } from '@/lib/organizationsService';
import { getParticipantsByOrganization } from '@/lib/participantsService';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Stats.module.css';

interface StatsData {
    totalParticipants: number;
    maleCount: number;
    femaleCount: number;
    category3K: number;
    category5K: number;
    category10K: number;
    swagKitTaken: number;
}

export default function StatsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<StatsData | null>(null);

    // Load organizations on mount
    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const orgsData = await getAllOrganizations();
                setOrganizations(orgsData);
            } catch (error) {
                toast.error('Failed to load organizations');
                console.error(error);
            }
        };
        loadOrganizations();
    }, []);

    // Calculate stats when organization is selected
    useEffect(() => {
        if (!selectedOrg) {
            setStats(null);
            return;
        }

        const calculateStats = async () => {
            try {
                setLoading(true);
                const participants = await getParticipantsByOrganization(selectedOrg);

                const newStats: StatsData = {
                    totalParticipants: participants.length,
                    maleCount: 0,
                    femaleCount: 0,
                    category3K: 0,
                    category5K: 0,
                    category10K: 0,
                    swagKitTaken: 0,
                };

                participants.forEach((p: Participant) => {
                    // Gender
                    if (p.gender === 'Male') newStats.maleCount++;
                    else if (p.gender === 'Female') newStats.femaleCount++;

                    // Category
                    if (p.category === '3K') newStats.category3K++;
                    else if (p.category === '5K') newStats.category5K++;
                    else if (p.category === '10K') newStats.category10K++;

                    // Swag Kit
                    if (p.swagKitGiven) newStats.swagKitTaken++;
                });

                setStats(newStats);
            } catch (error) {
                toast.error('Failed to calculate statistics');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        calculateStats();
    }, [selectedOrg]);

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Statistics</h1>
                </div>

                <div className={styles.controls}>
                    <Dropdown
                        label="Select Organization"
                        options={[
                            { value: '', label: 'Select an organization...' },
                            ...organizations.map((org) => ({
                                value: org.name,
                                label: org.name,
                            })),
                        ]}
                        value={selectedOrg}
                        onChange={(e) => setSelectedOrg(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className={styles.loading}>Calculating statistics...</div>
                ) : !selectedOrg ? (
                    <div className={styles.emptyState}>
                        <p>Please select an organization to view statistics.</p>
                    </div>
                ) : stats ? (
                    <>
                        <div className={styles.statsGrid}>
                            <div className={`${styles.statCard} ${styles.totalCard}`}>
                                <div className={styles.statLabel}>Total Participants</div>
                                <div className={styles.statValue}>{stats.totalParticipants}</div>
                            </div>

                            <div className={`${styles.statCard} ${styles.swagCard}`}>
                                <div className={styles.statLabel}>Swag Kits Taken</div>
                                <div className={styles.statValue}>{stats.swagKitTaken}</div>
                                <div className={styles.statSubtext}>
                                    {stats.totalParticipants > 0
                                        ? `${Math.round((stats.swagKitTaken / stats.totalParticipants) * 100)}% of total`
                                        : '0%'}
                                </div>
                            </div>
                        </div>

                        <div className={styles.chartSection}>
                            <h2 className={styles.sectionTitle}>Gender Breakdown</h2>
                            <div className={styles.breakdownGrid}>
                                <div className={styles.breakdownCard}>
                                    <div className={styles.breakdownLabel}>Male</div>
                                    <div className={styles.breakdownValue}>{stats.maleCount}</div>
                                </div>
                                <div className={styles.breakdownCard}>
                                    <div className={styles.breakdownLabel}>Female</div>
                                    <div className={styles.breakdownValue}>{stats.femaleCount}</div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.chartSection}>
                            <h2 className={styles.sectionTitle}>Category Breakdown</h2>
                            <div className={styles.breakdownGrid}>
                                <div className={styles.breakdownCard}>
                                    <div className={styles.breakdownLabel}>3K Run</div>
                                    <div className={styles.breakdownValue}>{stats.category3K}</div>
                                </div>
                                <div className={styles.breakdownCard}>
                                    <div className={styles.breakdownLabel}>5K Run</div>
                                    <div className={styles.breakdownValue}>{stats.category5K}</div>
                                </div>
                                <div className={styles.breakdownCard}>
                                    <div className={styles.breakdownLabel}>10K Run</div>
                                    <div className={styles.breakdownValue}>{stats.category10K}</div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
