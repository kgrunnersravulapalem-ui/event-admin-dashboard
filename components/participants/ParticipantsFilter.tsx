import React from 'react';
import { Button, Dropdown } from '@/components/ui';
import { Organization } from '@/types';
import styles from '@/styles/Participants.module.css';

interface ParticipantsFilterProps {
    pendingFilters: {
        organization: string;
        category: string;
        swagKitGiven: boolean | undefined;
    };
    setPendingFilters: (filters: {
        organization: string;
        category: string;
        swagKitGiven: boolean | undefined;
    }) => void;
    pendingSearchTerm: string;
    setPendingSearchTerm: (term: string) => void;
    organizations: Organization[];
    onApply: () => void;
    onClear: () => void;
    onSearch: () => void;
    hasAppliedFilters: boolean;
    hasPendingChanges: boolean;
}

const ParticipantsFilter: React.FC<ParticipantsFilterProps> = ({
    pendingFilters,
    setPendingFilters,
    pendingSearchTerm,
    setPendingSearchTerm,
    organizations,
    onApply,
    onClear,
    onSearch,
    hasAppliedFilters,
    hasPendingChanges,
}) => {
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <>
            {/* Search Bar */}
            <div className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search by name or mobile number..."
                    value={pendingSearchTerm}
                    onChange={(e) => setPendingSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className={styles.searchInput}
                />
                <Button onClick={onSearch}>
                    Search
                </Button>
            </div>

            {/* Filters */}
            <div className={styles.filtersCard}>
                <div className={styles.filtersGrid}>
                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Organization"
                            options={[
                                { value: '', label: 'All Organizations' },
                                ...organizations.map((org) => ({
                                    value: org.name,
                                    label: org.name,
                                })),
                            ]}
                            value={pendingFilters.organization}
                            onChange={(e) =>
                                setPendingFilters({ ...pendingFilters, organization: e.target.value })
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
                            value={pendingFilters.category}
                            onChange={(e) =>
                                setPendingFilters({ ...pendingFilters, category: e.target.value })
                            }
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <Dropdown
                            label="Swag Kit"
                            options={[
                                { value: '', label: 'All' },
                                { value: 'true', label: 'Received' },
                                { value: 'false', label: 'Not Received' },
                            ]}
                            value={
                                pendingFilters.swagKitGiven === undefined
                                    ? ''
                                    : pendingFilters.swagKitGiven
                                        ? 'true'
                                        : 'false'
                            }
                            onChange={(e) => {
                                const value = e.target.value;
                                const swagKitGiven =
                                    value === '' ? undefined : value === 'true';
                                setPendingFilters({ ...pendingFilters, swagKitGiven });
                            }}
                        />
                    </div>

                    <div className={styles.filterItem}>
                        <Button onClick={onApply}>
                            Apply Filters
                        </Button>
                    </div>

                    {(hasAppliedFilters || hasPendingChanges) && (
                        <div className={styles.filterItem}>
                            <Button variant="danger" onClick={onClear}>
                                Clear All
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ParticipantsFilter;
