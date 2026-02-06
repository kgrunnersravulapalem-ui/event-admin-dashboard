import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Participant } from '@/types';
import styles from '@/styles/Participants.module.css';

interface ParticipantsTableProps {
    participants: Participant[];
    selectedIds: Set<string>;
    onSelect: (id: string) => void;
    onSelectAll: () => void;
    onEdit: (participant: Participant) => void;
    onDelete: (id: string, name: string) => void;
    onToggleStatus: (participant: Participant) => void;
    onToggleSwagKit: (participant: Participant) => void;
    onBulkDelete: () => void;
    onBulkToggleStatus: (disable: boolean) => void;
    onBulkToggleSwagKit: (swagKitGiven: boolean) => void;
    onClearSelection: () => void;
    isBulkDeleting: boolean;
    currentPage: number;
    itemsPerPage: number;
}

const ParticipantsTable: React.FC<ParticipantsTableProps> = ({
    participants,
    selectedIds,
    onSelect,
    onSelectAll,
    onEdit,
    onDelete,
    onToggleStatus,
    onToggleSwagKit,
    onBulkDelete,
    onBulkToggleStatus,
    onBulkToggleSwagKit,
    onClearSelection,
    isBulkDeleting,
    currentPage,
    itemsPerPage,
}) => {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Calculate starting serial number based on pagination
    const startingSerialNumber = (currentPage - 1) * itemsPerPage;

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && !(event.target as Element).closest(`.${styles.actionsCell}`)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openMenuId]);

    return (
        <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className={styles.bulkActions}>
                    <span className={styles.selectedCount}>
                        {selectedIds.size} selected
                    </span>
                    <Button
                        variant="outline"
                        size="small"
                        onClick={() => onBulkToggleStatus(true)}
                    >
                        Unenroll Selected
                    </Button>
                    <Button
                        variant="outline"
                        size="small"
                        onClick={() => onBulkToggleStatus(false)}
                    >
                        Re-enroll Selected
                    </Button>
                    <Button
                        variant="outline"
                        size="small"
                        onClick={() => onBulkToggleSwagKit(true)}
                    >
                        Mark Swag Kit Given
                    </Button>
                    <Button
                        variant="outline"
                        size="small"
                        onClick={() => onBulkToggleSwagKit(false)}
                    >
                        Mark Swag Kit Not Given
                    </Button>
                    <Button
                        variant="danger"
                        size="small"
                        onClick={onBulkDelete}
                        disabled={isBulkDeleting}
                    >
                        {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                    </Button>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={onClearSelection}
                    >
                        Clear Selection
                    </Button>
                </div>
            )}

            <div className={styles.list}>
                <div className={styles.listHeader}>
                    <div className={styles.checkboxCell}>
                        <input
                            type="checkbox"
                            checked={participants.length > 0 && selectedIds.size === participants.length}
                            onChange={onSelectAll}
                            className={styles.checkbox}
                        />
                    </div>
                    <div>S.No</div>
                    <div>Name</div>
                    <div>Organization/School</div>
                    <div>Mobile</div>
                    <div>Gender</div>
                    <div>Category</div>
                    <div>Size</div>
                    <div>Bib</div>
                    <div>Paid</div>
                    <div>Swag Kit</div>
                    <div></div>
                </div>
                {participants.map((participant: Participant, index) => (
                    <div
                        key={participant.id}
                        className={`${styles.participantCard} ${participant.disabled ? styles.disabledRow : ''}`}
                        onClick={(e) => {
                            // Don't trigger edit if clicking checkbox, toggle, or action menu
                            if (
                                (e.target as Element).closest(`.${styles.checkboxCell}`) ||
                                (e.target as Element).closest(`.${styles.swagKitCell}`) ||
                                (e.target as Element).closest(`.${styles.actionsCell}`)
                            ) {
                                return;
                            }
                            onEdit(participant);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.checkboxCell}>
                            <input
                                type="checkbox"
                                checked={selectedIds.has(participant.id!)}
                                onChange={() => onSelect(participant.id!)}
                                className={styles.checkbox}
                            />
                        </div>
                        <div className={styles.serialNumber}>{startingSerialNumber + index + 1}</div>
                        <div className={styles.participantName}>{participant.name}</div>
                        <div className={styles.organization}>{participant.organization}</div>
                        <div className={styles.detail}>{participant.mobileNumber}</div>
                        <div className={styles.detail}>{participant.gender}</div>
                        <div className={styles.detail}>
                            <span className={`${styles.categoryBadge} ${participant.category === '3K' ? styles.category3K :
                                participant.category === '5K' ? styles.category5K :
                                    participant.category === '10K' ? styles.category10K : ''
                                }`}>
                                {participant.category}
                            </span>
                        </div>
                        <div className={styles.detail}>{participant.size}</div>
                        <div className={styles.bibCell}>
                            {participant.bibNumber ? (
                                <span className={styles.bibBadge}>{participant.bibNumber}</span>
                            ) : (
                                <span className={styles.noBib}>-</span>
                            )}
                        </div>
                        <div className={styles.detail} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span
                                style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    backgroundColor: participant.isPaid ? '#dcfce7' : '#f1f5f9',
                                    color: participant.isPaid ? '#166534' : '#64748b',
                                }}
                            >
                                {participant.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                        </div>
                        <div className={styles.swagKitCell}>
                            <label className={styles.toggleSwitch}>
                                <input
                                    type="checkbox"
                                    checked={participant.swagKitGiven || false}
                                    onChange={() => onToggleSwagKit(participant)}
                                    className={styles.toggleInput}
                                />
                                <span className={styles.toggleSlider}></span>
                            </label>
                        </div>
                        <div className={styles.actionsCell}>
                            <button
                                className={styles.menuButton}
                                onClick={() => setOpenMenuId(openMenuId === participant.id ? null : participant.id || null)}
                                aria-label="Actions menu"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <circle cx="8" cy="3" r="1.5" />
                                    <circle cx="8" cy="8" r="1.5" />
                                    <circle cx="8" cy="13" r="1.5" />
                                </svg>
                            </button>
                            {openMenuId === participant.id && (
                                <div className={styles.actionMenu}>
                                    <button
                                        className={styles.menuItem}
                                        onClick={() => {
                                            onEdit(participant);
                                            setOpenMenuId(null);
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        className={styles.menuItem}
                                        onClick={() => {
                                            onToggleStatus(participant);
                                            setOpenMenuId(null);
                                        }}
                                    >
                                        {participant.disabled ? (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                Re-enroll
                                            </>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                                </svg>
                                                Unenroll
                                            </>
                                        )}
                                    </button>
                                    <div className={styles.menuDivider} />
                                    <button
                                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                        onClick={() => {
                                            if (participant.id) {
                                                onDelete(participant.id, participant.name);
                                            }
                                            setOpenMenuId(null);
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default ParticipantsTable;
