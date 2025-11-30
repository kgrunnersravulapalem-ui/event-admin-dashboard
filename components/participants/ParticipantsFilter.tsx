import React from 'react';
import { Button, Dropdown } from '@/components/ui';
import { Organization } from '@/types';
import styles from '@/styles/Participants.module.css';

interface ParticipantsFilterProps {
    filters: {
        organization: string;
        category: string;
        gender: string;
        swagKitGiven: boolean | undefined;
        startDate?: Date;
        endDate?: Date;
    };
    setFilters: (filters: {
        organization: string;
        category: string;
        gender: string;
        swagKitGiven: boolean | undefined;
        startDate?: Date;
        endDate?: Date;
    }) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    organizations: Organization[];
    onClear: () => void;
    hasAppliedFilters: boolean;
}

const ParticipantsFilter: React.FC<ParticipantsFilterProps> = ({
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    organizations,
    onClear,
    hasAppliedFilters,
}) => {
    return (
        <>
            {/* Search Bar */}
            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search by name, mobile, or bib number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Filters */}
            <div className={styles.filtersCard}>
                <div className={styles.filtersGrid}>
                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Organization/School"
                            options={[
                                { value: '', label: 'All Organizations/Schools' },
                                ...organizations.map((org) => ({
                                    value: org.name,
                                    label: org.name,
                                })),
                            ]}
                            value={filters.organization}
                            onChange={(e) =>
                                setFilters({ ...filters, organization: e.target.value })
                            }
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Category"
                            options={[
                                { value: '', label: 'All Categories' },
                                { value: '3K', label: '3K' },
                                { value: '5K', label: '5K' },
                                { value: '10K', label: '10K' },
                            ]}
                            value={filters.category}
                            onChange={(e) =>
                                setFilters({ ...filters, category: e.target.value })
                            }
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Gender"
                            options={[
                                { value: '', label: 'All Genders' },
                                { value: 'Male', label: 'Male' },
                                { value: 'Female', label: 'Female' },
                                { value: 'Other', label: 'Other' },
                            ]}
                            value={filters.gender}
                            onChange={(e) =>
                                setFilters({ ...filters, gender: e.target.value })
                            }
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Swag Kit"
                            options={[
                                { value: '', label: 'All' },
                                { value: 'true', label: 'Given' },
                                { value: 'false', label: 'Not Given' },
                            ]}
                            value={
                                filters.swagKitGiven === undefined
                                    ? ''
                                    : filters.swagKitGiven
                                        ? 'true'
                                        : 'false'
                            }
                            onChange={(e) => {
                                const value = e.target.value;
                                const swagKitGiven =
                                    value === '' ? undefined : value === 'true';
                                setFilters({ ...filters, swagKitGiven });
                            }}
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <label className={styles.filterLabel}>From Date</label>
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                setFilters({ ...filters, startDate: date });
                            }}
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <label className={styles.filterLabel}>To Date</label>
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                setFilters({ ...filters, endDate: date });
                            }}
                        />
                    </div>

                    {hasAppliedFilters && (
                        <div className={styles.filterItem}>
                            <Button variant="danger" onClick={onClear}>
                                Clear All Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ParticipantsFilter;
