import React from 'react';
import { Button } from '@/components/ui';
import styles from '@/styles/Participants.module.css';

interface ParticipantsPaginationProps {
    currentPage: number;
    hasMore: boolean;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (value: number) => void;
    currentCount: number;
    showInfo?: boolean;
    showNavigation?: boolean;
}

const ParticipantsPagination: React.FC<ParticipantsPaginationProps> = ({
    currentPage,
    hasMore,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    currentCount,
    showInfo = true,
    showNavigation = true,
}) => {
    return (
        <>
            {showInfo && (
                <div className={styles.paginationTop}>
                    <div className={styles.paginationInfo}>
                        Showing {currentCount} participants
                    </div>
                    <div className={styles.itemsPerPageContainer}>
                        <span className={styles.itemsPerPageLabel}>Show:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className={styles.itemsPerPageSelect}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            )}

            {showNavigation && (
                <div className={styles.pagination}>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>

                    <div className={styles.pageNumbers}>
                        <span className={styles.pageNumber}>Page {currentPage}</span>
                    </div>

                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={!hasMore}
                    >
                        Next
                    </Button>
                </div>
            )}
        </>
    );
};

export default ParticipantsPagination;
