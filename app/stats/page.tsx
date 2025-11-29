/**
 * Statistics Page
 * 
 * Displays organization-level statistics with detailed breakdowns
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dropdown } from '@/components/ui';
import { Organization, Participant } from '@/types';
import { getAllOrganizations } from '@/lib/organizationsService';
import { getParticipantsByOrganization } from '@/lib/participantsService';
import { toast } from 'react-hot-toast';
import styles from '@/styles/Stats.module.css';

interface StatsData {
    totalParticipants: number;
    swagKitTaken: number;

    // 3K Stats
    total3K: number;
    male3K: number;
    female3K: number;
    swag3K: number;

    // 5K Stats
    total5K: number;
    male5K: number;
    female5K: number;
    swag5K: number;

    // 10K Stats
    total10K: number;
    male10K: number;
    female10K: number;
    swag10K: number;
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
                    swagKitTaken: 0,

                    total3K: 0,
                    male3K: 0,
                    female3K: 0,
                    swag3K: 0,

                    total5K: 0,
                    male5K: 0,
                    female5K: 0,
                    swag5K: 0,

                    total10K: 0,
                    male10K: 0,
                    female10K: 0,
                    swag10K: 0,
                };

                participants.forEach((p: Participant) => {
                    // Global Swag
                    if (p.swagKitGiven) newStats.swagKitTaken++;

                    // Category Specific Stats
                    if (p.category === '3K') {
                        newStats.total3K++;
                        if (p.gender === 'Male') newStats.male3K++;
                        else if (p.gender === 'Female') newStats.female3K++;
                        if (p.swagKitGiven) newStats.swag3K++;
                    }
                    else if (p.category === '5K') {
                        newStats.total5K++;
                        if (p.gender === 'Male') newStats.male5K++;
                        else if (p.gender === 'Female') newStats.female5K++;
                        if (p.swagKitGiven) newStats.swag5K++;
                    }
                    else if (p.category === '10K') {
                        newStats.total10K++;
                        if (p.gender === 'Male') newStats.male10K++;
                        else if (p.gender === 'Female') newStats.female10K++;
                        if (p.swagKitGiven) newStats.swag10K++;
                    }
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

    const renderCategoryCard = (
        title: string,
        total: number,
        male: number,
        female: number,
        swag: number
    ) => (
        <div className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
                <h3 className={styles.categoryTitle}>{title}</h3>
                <span className={styles.categoryTotal}>{total} Participants</span>
            </div>
            <div className={styles.categoryContent}>
                <div className={styles.statRow}>
                    <div className={styles.statRowLabel}>
                        <span className={styles.maleIcon}>♂</span> Male
                    </div>
                    <div className={styles.statRowValue}>{male}</div>
                </div>
                <div className={styles.statRow}>
                    <div className={styles.statRowLabel}>
                        <span className={styles.femaleIcon}>♀</span> Female
                    </div>
                    <div className={styles.statRowValue}>{female}</div>
                </div>
                <div className={styles.statRow}>
                    <div className={styles.statRowLabel}>
                        <span className={styles.swagIcon}>🎁</span> Swag Kits
                    </div>
                    <div className={styles.statRowValue}>
                        {swag} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                            ({total > 0 ? Math.round((swag / total) * 100) : 0}%)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Statistics Dashboard</h1>
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
                    <div className={styles.loading}>Calculating detailed statistics...</div>
                ) : !selectedOrg ? (
                    <div className={styles.emptyState}>
                        <p>Please select an organization to view detailed statistics.</p>
                    </div>
                ) : stats ? (
                    <>
                        {/* Summary Cards */}
                        <div className={styles.summaryGrid}>
                            <div className={`${styles.summaryCard} ${styles.totalCard}`}>
                                <div className={styles.summaryLabel}>Total Participants</div>
                                <div className={styles.summaryValue}>{stats.totalParticipants}</div>
                                <div className={styles.summarySubtext}>Across all categories</div>
                            </div>

                            <div className={`${styles.summaryCard} ${styles.swagCard}`}>
                                <div className={styles.summaryLabel}>Total Swag Kits Distributed</div>
                                <div className={styles.summaryValue}>{stats.swagKitTaken}</div>
                                <div className={styles.summarySubtext}>
                                    {stats.totalParticipants > 0
                                        ? `${Math.round((stats.swagKitTaken / stats.totalParticipants) * 100)}% of total participants`
                                        : '0%'}
                                </div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className={styles.categorySection}>
                            <h2 className={styles.sectionTitle}>Category Breakdown</h2>
                            <div className={styles.categoryGrid}>
                                {renderCategoryCard(
                                    '3K Run',
                                    stats.total3K,
                                    stats.male3K,
                                    stats.female3K,
                                    stats.swag3K
                                )}
                                {renderCategoryCard(
                                    '5K Run',
                                    stats.total5K,
                                    stats.male5K,
                                    stats.female5K,
                                    stats.swag5K
                                )}
                                {renderCategoryCard(
                                    '10K Run',
                                    stats.total10K,
                                    stats.male10K,
                                    stats.female10K,
                                    stats.swag10K
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
