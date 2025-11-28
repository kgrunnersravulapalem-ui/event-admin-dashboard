import React from 'react';
import { Card, Dropdown } from '@/components/ui';
import { Organization } from '@/types';
import styles from '@/styles/BibManagement.module.css';

interface BibOrganizationSelectorProps {
    organizations: Organization[];
    selectedOrganization: string;
    onOrganizationChange: (org: string) => void;
    categoryCounts: Array<{
        category: string;
        withoutBibs: number;
        total: number;
    }>;
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    viewMode: 'generate' | 'manage';
    onViewModeChange: (mode: 'generate' | 'manage') => void;
    currentWithoutBibs: number;
    currentTotal: number;
}

const BibOrganizationSelector: React.FC<BibOrganizationSelectorProps> = ({
    organizations,
    selectedOrganization,
    onOrganizationChange,
    categoryCounts,
    activeCategory,
    onCategoryChange,
    viewMode,
    onViewModeChange,
    currentWithoutBibs,
    currentTotal,
}) => {
    const organizationOptions = [
        { value: '', label: 'Select Organization' },
        ...organizations.map(org => ({ value: org.name, label: org.name })),
    ];

    return (
        <>
            {/* Organization Selection */}
            <Card className={styles.selectionCard}>
                <div className={styles.selectionGrid}>
                    <div className={styles.field}>
                        <Dropdown
                            label="Organization"
                            options={organizationOptions}
                            value={selectedOrganization}
                            onChange={(e) => onOrganizationChange(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {selectedOrganization && (
                <>
                    {/* Category Summary Cards */}
                    <div className={styles.categorySummary}>
                        {categoryCounts.map(({ category, withoutBibs, total }) => (
                            <div
                                key={category}
                                className={`${styles.summaryCard} ${activeCategory === category ? styles.summaryCardActive : ''}`}
                                onClick={() => onCategoryChange(category)}
                            >
                                <div className={styles.summaryCategory}>{category}</div>
                                <div className={styles.summaryStats}>
                                    <span className={styles.summaryPending}>{withoutBibs} pending</span>
                                    <span className={styles.summaryTotal}>/ {total} total</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* View Mode Tabs */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${viewMode === 'generate' ? styles.tabActive : ''}`}
                            onClick={() => onViewModeChange('generate')}
                        >
                            Generate Bibs ({currentWithoutBibs})
                        </button>
                        <button
                            className={`${styles.tab} ${viewMode === 'manage' ? styles.tabActive : ''}`}
                            onClick={() => onViewModeChange('manage')}
                        >
                            Manage All ({currentTotal})
                        </button>
                    </div>
                </>
            )}
        </>
    );
};

export default BibOrganizationSelector;
