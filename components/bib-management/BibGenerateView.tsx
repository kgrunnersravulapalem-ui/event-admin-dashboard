import React from 'react';
import { Button, Card, Input } from '@/components/ui';
import { Participant } from '@/types';
import styles from '@/styles/BibManagement.module.css';

interface BibGenerateViewProps {
    category: string;
    prefix: string;
    startNumber: string;
    onPrefixChange: (value: string) => void;
    onStartNumberChange: (value: string) => void;
    participants: Participant[];
    onGenerate: () => void;
    generating: boolean;
}

const BibGenerateView: React.FC<BibGenerateViewProps> = ({
    category,
    prefix,
    startNumber,
    onPrefixChange,
    onStartNumberChange,
    participants,
    onGenerate,
    generating,
}) => {
    // Preview bib numbers that will be generated
    const previewBibs = participants.map((p, index) => ({
        ...p,
        previewBib: `${prefix}${parseInt(startNumber, 10) + index}`,
    }));

    return (
        <Card className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>
                Generate Bib Numbers for {category}
            </h2>

            {participants.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>All {category} participants have bib numbers assigned.</p>
                </div>
            ) : (
                <>
                    {/* Bib Configuration */}
                    <div className={styles.configGrid}>
                        <div className={styles.field}>
                            <Input
                                label="Prefix"
                                placeholder="e.g., 3K-"
                                value={prefix}
                                onChange={(e) => onPrefixChange(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <Input
                                label="Starting Number"
                                type="number"
                                min="1"
                                value={startNumber}
                                onChange={(e) => onStartNumberChange(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.previewLabel}>Preview Format</label>
                            <div className={styles.previewValue}>
                                {prefix}{startNumber} → {prefix}{parseInt(startNumber, 10) + participants.length - 1}
                            </div>
                        </div>
                    </div>

                    {/* Preview Table */}
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Mobile</th>
                                    <th>New Bib Number</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewBibs.map((p, index) => (
                                    <tr key={p.id}>
                                        <td>{index + 1}</td>
                                        <td>{p.name}</td>
                                        <td>{p.mobileNumber}</td>
                                        <td className={styles.bibPreview}>{p.previewBib}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.actions}>
                        <Button
                            onClick={onGenerate}
                            disabled={generating}
                        >
                            {generating
                                ? 'Generating...'
                                : `Generate ${participants.length} Bibs for ${category}`}
                        </Button>
                    </div>
                </>
            )}
        </Card>
    );
};

export default BibGenerateView;
