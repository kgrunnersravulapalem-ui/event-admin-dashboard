/**
 * Overall Statistics Page
 * 
 * Displays aggregated statistics from all organizations with charts
 */

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Organization } from '@/types';
import { getAllOrganizations } from '@/lib/organizationsService';
import { kebabCase } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import styles from '@/styles/OverallStats.module.css';
import { useParticipants } from '@/hooks/useParticipants';
import { Participant, OrganizationStats } from '@/types';

// Feature flag for safe migration
const USE_REALTIME_STORE = true;
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface AggregatedStats {
    totalParticipants: number;
    swagKitTaken: number;

    // Demographics
    totalMale: number;
    totalFemale: number;

    // Categories
    total3K: number;
    total5K: number;
    total10K: number;

    // Category-wise gender breakdown
    male3K: number;
    male5K: number;
    male10K: number;
    female3K: number;
    female5K: number;
    female10K: number;

    // Category-wise swag
    swag3K: number;
    swag5K: number;
    swag10K: number;
}

const COLORS = {
    male: '#3b82f6',
    female: '#ec4899',
    swag: '#f43f5e',
    total: '#10b981',
};

// Custom tooltip to show sum of male and female
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const maleValue = payload.find((p: any) => p.dataKey === 'Male')?.value || 0;
        const femaleValue = payload.find((p: any) => p.dataKey === 'Female')?.value || 0;
        const total = Number(maleValue) + Number(femaleValue);

        return (
            <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#0f172a' }}>{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ margin: '4px 0', fontSize: '14px', color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
                <p style={{ margin: '8px 0 0 0', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a' }}>
                    Total Participants: {total}
                </p>
            </div>
        );
    }
    return null;
};

export default function OverallStatsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AggregatedStats>({
        totalParticipants: 0,
        swagKitTaken: 0,
        totalMale: 0,
        totalFemale: 0,
        total3K: 0,
        total5K: 0,
        total10K: 0,
        male3K: 0,
        male5K: 0,
        male10K: 0,
        female3K: 0,
        female5K: 0,
        female10K: 0,
        swag3K: 0,
        swag5K: 0,
        swag10K: 0,
    });

    // Real-time Store Integration
    const {
        allParticipants,
        isLoading: isStoreLoading,
        initialize: initializeStore
    } = useParticipants({
        autoInitialize: USE_REALTIME_STORE
    });

    // Calculate stats from real-time data
    useEffect(() => {
        if (USE_REALTIME_STORE && allParticipants.length > 0 && organizations.length > 0) {
            calculateRealtimeStats();
        }
    }, [USE_REALTIME_STORE, allParticipants, organizations.length]);

    const calculateRealtimeStats = () => {
        // 1. Aggregate Global Stats
        const aggregated: AggregatedStats = {
            totalParticipants: 0,
            swagKitTaken: 0,
            totalMale: 0,
            totalFemale: 0,
            total3K: 0,
            total5K: 0,
            total10K: 0,
            male3K: 0,
            male5K: 0,
            male10K: 0,
            female3K: 0,
            female5K: 0,
            female10K: 0,
            swag3K: 0,
            swag5K: 0,
            swag10K: 0,
        };

        // Helper to init org stats
        const orgStatsMap = new Map<string, OrganizationStats>();
        organizations.forEach(org => {
            orgStatsMap.set(org.name, {
                totalParticipants: 0,
                swagKitTaken: 0,
                total3K: 0, male3K: 0, female3K: 0, swag3K: 0,
                total5K: 0, male5K: 0, female5K: 0, swag5K: 0,
                total10K: 0, male10K: 0, female10K: 0, swag10K: 0,
            });
        });

        allParticipants.forEach(p => {
            // Global Aggregation
            aggregated.totalParticipants++;
            if (p.swagKitGiven) aggregated.swagKitTaken++;

            if (p.gender === 'Male') aggregated.totalMale++;
            else if (p.gender === 'Female') aggregated.totalFemale++;

            if (p.category === '3K') {
                aggregated.total3K++;
                if (p.gender === 'Male') aggregated.male3K++;
                else if (p.gender === 'Female') aggregated.female3K++;
                if (p.swagKitGiven) aggregated.swag3K++;
            } else if (p.category === '5K') {
                aggregated.total5K++;
                if (p.gender === 'Male') aggregated.male5K++;
                else if (p.gender === 'Female') aggregated.female5K++;
                if (p.swagKitGiven) aggregated.swag5K++;
            } else if (p.category === '10K') {
                aggregated.total10K++;
                if (p.gender === 'Male') aggregated.male10K++;
                else if (p.gender === 'Female') aggregated.female10K++;
                if (p.swagKitGiven) aggregated.swag10K++;
            }

            // Organization Aggregation
            if (p.organization) {
                const stats = orgStatsMap.get(p.organization);
                if (stats) {
                    stats.totalParticipants++;
                    if (p.swagKitGiven) stats.swagKitTaken++;

                    if (p.category === '3K') {
                        stats.total3K++;
                        if (p.gender === 'Male') stats.male3K++;
                        else if (p.gender === 'Female') stats.female3K++;
                        if (p.swagKitGiven) stats.swag3K++;
                    } else if (p.category === '5K') {
                        stats.total5K++;
                        if (p.gender === 'Male') stats.male5K++;
                        else if (p.gender === 'Female') stats.female5K++;
                        if (p.swagKitGiven) stats.swag5K++;
                    } else if (p.category === '10K') {
                        stats.total10K++;
                        if (p.gender === 'Male') stats.male10K++;
                        else if (p.gender === 'Female') stats.female10K++;
                        if (p.swagKitGiven) stats.swag10K++;
                    }
                }
            }
        });

        setStats(aggregated);

        // Update organizations with real-time stats
        setOrganizations(prev => prev.map(org => ({
            ...org,
            stats: orgStatsMap.get(org.name) || org.stats
        })));
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const orgsData = await getAllOrganizations();
                setOrganizations(orgsData);

                // If using real-time store, we'll calculate stats in the other effect
                if (USE_REALTIME_STORE) {
                    setLoading(false);
                    return;
                }

                // Aggregate stats (Legacy)
                const aggregated: AggregatedStats = {
                    totalParticipants: 0,
                    swagKitTaken: 0,
                    totalMale: 0,
                    totalFemale: 0,
                    total3K: 0,
                    total5K: 0,
                    total10K: 0,
                    male3K: 0,
                    male5K: 0,
                    male10K: 0,
                    female3K: 0,
                    female5K: 0,
                    female10K: 0,
                    swag3K: 0,
                    swag5K: 0,
                    swag10K: 0,
                };

                orgsData.forEach(org => {
                    if (org.stats) {
                        aggregated.totalParticipants += org.stats.totalParticipants;
                        aggregated.swagKitTaken += org.stats.swagKitTaken;

                        // Gender
                        aggregated.totalMale += (org.stats.male3K + org.stats.male5K + org.stats.male10K);
                        aggregated.totalFemale += (org.stats.female3K + org.stats.female5K + org.stats.female10K);

                        // Categories
                        aggregated.total3K += org.stats.total3K;
                        aggregated.total5K += org.stats.total5K;
                        aggregated.total10K += org.stats.total10K;

                        // Category-wise gender
                        aggregated.male3K += org.stats.male3K;
                        aggregated.male5K += org.stats.male5K;
                        aggregated.male10K += org.stats.male10K;
                        aggregated.female3K += org.stats.female3K;
                        aggregated.female5K += org.stats.female5K;
                        aggregated.female10K += org.stats.female10K;

                        // Category-wise swag
                        aggregated.swag3K += org.stats.swag3K;
                        aggregated.swag5K += org.stats.swag5K;
                        aggregated.swag10K += org.stats.swag10K;
                    }
                });

                setStats(aggregated);
            } catch (error) {
                toast.error('Failed to load overall statistics');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Combined chart data - Category with Gender and Swag breakdown
    const combinedCategoryData = [
        {
            category: '3K',
            Male: stats.male3K,
            Female: stats.female3K,
            'Swag Kits': stats.swag3K,
            Total: stats.total3K
        },
        {
            category: '5K',
            Male: stats.male5K,
            Female: stats.female5K,
            'Swag Kits': stats.swag5K,
            Total: stats.total5K
        },
        {
            category: '10K',
            Male: stats.male10K,
            Female: stats.female10K,
            'Swag Kits': stats.swag10K,
            Total: stats.total10K
        },
    ];

    // Gender distribution pie chart data
    const genderData = [
        { name: 'Male', value: stats.totalMale },
        { name: 'Female', value: stats.totalFemale },
    ];

    return (
        <DashboardLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Overall Event Statistics</h1>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading aggregated data...</div>
                ) : (
                    <>
                        {/* Grand Totals */}
                        <div className={styles.summaryGrid}>
                            <div className={`${styles.summaryCard} ${styles.totalCard}`}>
                                <div className={styles.summaryLabel}>Total Participants</div>
                                <div className={styles.summaryValue}>{stats.totalParticipants}</div>
                                <div className={styles.summarySubtext}>Across all organizations/schools</div>
                            </div>

                            <div className={`${styles.summaryCard} ${styles.swagCard}`}>
                                <div className={styles.summaryLabel}>Total Swag Kits</div>
                                <div className={styles.summaryValue}>{stats.swagKitTaken}</div>
                                <div className={styles.summarySubtext}>
                                    {stats.totalParticipants > 0
                                        ? `${Math.round((stats.swagKitTaken / stats.totalParticipants) * 100)}% distribution rate`
                                        : '0%'}
                                </div>
                            </div>
                        </div>

                        {/* Main Charts Side by Side */}
                        <div className={styles.mainChartsGrid}>
                            {/* Combined Category Chart */}
                            <div className={styles.largeChartCard}>
                                <h2 className={styles.chartTitle}>Category Overview - Gender & Swag Distribution</h2>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={combinedCategoryData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="category" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar dataKey="Male" fill={COLORS.male} />
                                        <Bar dataKey="Female" fill={COLORS.female} />
                                        <Bar dataKey="Swag Kits" fill={COLORS.swag} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Gender Distribution Pie */}
                            <div className={styles.largeChartCard}>
                                <h2 className={styles.chartTitle}>Overall Gender Distribution</h2>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={genderData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            <Cell fill={COLORS.male} />
                                            <Cell fill={COLORS.female} />
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Organization-Specific Breakdown */}
                        <div className={styles.section}>
                            <h2 className={styles.sectionTitle}>Organization/School Specific Breakdown</h2>
                            <div className={styles.orgChartsGrid}>
                                {organizations.filter(org => org.stats).map(org => {
                                    const orgCombinedData = [
                                        {
                                            category: '3K',
                                            Male: org.stats!.male3K,
                                            Female: org.stats!.female3K,
                                            Swag: org.stats!.swag3K
                                        },
                                        {
                                            category: '5K',
                                            Male: org.stats!.male5K,
                                            Female: org.stats!.female5K,
                                            Swag: org.stats!.swag5K
                                        },
                                        {
                                            category: '10K',
                                            Male: org.stats!.male10K,
                                            Female: org.stats!.female10K,
                                            Swag: org.stats!.swag10K
                                        },
                                    ];

                                    return (
                                        <div key={org.id} className={styles.orgChartCard}>
                                            <h3 className={styles.orgChartTitle}>{kebabCase(org.name)}</h3>
                                            <div className={styles.orgStats}>
                                                <span>Total: {org.stats!.totalParticipants}</span>
                                                <span>Swag: {org.stats!.swagKitTaken}</span>
                                            </div>
                                            <ResponsiveContainer width="100%" height={400}>
                                                <BarChart data={orgCombinedData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="category" />
                                                    <YAxis />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                    <Bar dataKey="Male" fill={COLORS.male} />
                                                    <Bar dataKey="Female" fill={COLORS.female} />
                                                    <Bar dataKey="Swag" fill={COLORS.swag} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
