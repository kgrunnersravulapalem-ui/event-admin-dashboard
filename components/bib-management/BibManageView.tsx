import React from 'react';
import { Button, Card } from '@/components/ui';
import { Participant } from '@/types';
import styles from '@/styles/BibManagement.module.css';

interface BibManageViewProps {
    category: string;
    participants: Participant[];
    editingId: string | null;
    editBibValue: string;
    duplicateParticipant: Participant | null;
    savingBib: boolean;
    onEdit: (participant: Participant) => void;
    onBibValueChange: (value: string) => void;
    onBibBlur: () => void;
    onSave: () => void;
    onCancel: () => void;
}

const BibManageView: React.FC<BibManageViewProps> = ({
    category,
    participants,
    editingId,
    editBibValue,
    duplicateParticipant,
    savingBib,
    onEdit,
    onBibValueChange,
    onBibBlur,
    onSave,
    onCancel,
}) => {
    return (
        <Card className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>
                All {category} Participants
            </h2>

            {participants.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No {category} participants in this organization.</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Bib Number</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map((p, index) => (
                                <tr key={p.id} className={p.disabled ? styles.disabledRow : ''}>
                                    <td>{index + 1}</td>
                                    <td>{p.name}</td>
                                    <td>{p.mobileNumber}</td>
                                    <td>
                                        {editingId === p.id ? (
                                            <div className={styles.editBibContainer}>
                                                <input
                                                    type="text"
                                                    value={editBibValue}
                                                    onChange={(e) => onBibValueChange(e.target.value)}
                                                    onBlur={onBibBlur}
                                                    className={styles.bibInput}
                                                    placeholder="Enter bib number"
                                                    autoFocus
                                                />
                                                {duplicateParticipant && (
                                                    <div className={styles.duplicateWarning}>
                                                        ⚠️ Already assigned to: {duplicateParticipant.name} ({duplicateParticipant.organization})
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className={p.bibNumber ? styles.bibNumber : styles.noBib}>
                                                {p.bibNumber || 'Not assigned'}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p.id ? (
                                            <div className={styles.editActions}>
                                                <Button
                                                    size="small"
                                                    onClick={onSave}
                                                    disabled={savingBib || !!duplicateParticipant}
                                                >
                                                    {savingBib ? 'Saving...' : 'Save'}
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="secondary"
                                                    onClick={onCancel}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="small"
                                                variant="outline"
                                                onClick={() => onEdit(p)}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};

export default BibManageView;
