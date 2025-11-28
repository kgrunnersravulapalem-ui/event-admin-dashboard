import React from 'react';
import { Button, Modal, Input, Dropdown, RadioGroup } from '@/components/ui';
import { Participant, Organization } from '@/types';
import styles from '@/styles/Participants.module.css';

interface EditParticipantModalProps {
    isOpen: boolean;
    onClose: () => void;
    editFormData: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onUpdate: () => void;
    organizations: Organization[];
    bibDuplicate: Participant | null;
    onBibBlur: () => void;
}

const EditParticipantModal: React.FC<EditParticipantModalProps> = ({
    isOpen,
    onClose,
    editFormData,
    onInputChange,
    onUpdate,
    organizations,
    bibDuplicate,
    onBibBlur,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Participant"
            size="medium"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={onUpdate}>
                        Update
                    </Button>
                </>
            }
        >
            <div className={styles.editForm}>
                <Input
                    label="Name"
                    name="name"
                    value={editFormData.name}
                    onChange={onInputChange}
                    required
                />

                <Dropdown
                    label="Organization"
                    name="organization"
                    options={organizations.map((org) => ({
                        value: org.name,
                        label: org.name,
                    }))}
                    value={editFormData.organization}
                    onChange={onInputChange}
                    required
                />

                <RadioGroup
                    label="Gender"
                    name="gender"
                    options={[
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                        { value: 'Other', label: 'Other' },
                    ]}
                    value={editFormData.gender}
                    onChange={onInputChange}
                    direction="horizontal"
                    required
                />

                <Input
                    label="Mobile Number"
                    name="mobileNumber"
                    type="tel"
                    value={editFormData.mobileNumber}
                    onChange={onInputChange}
                    required
                />

                <RadioGroup
                    label="Category"
                    name="category"
                    options={[
                        { value: '3K', label: '3K' },
                        { value: '5K', label: '5K' },
                        { value: '10K', label: '10K' },
                    ]}
                    value={editFormData.category}
                    onChange={onInputChange}
                    direction="horizontal"
                    required
                />

                <Dropdown
                    label="T-Shirt Size"
                    name="size"
                    options={[
                        { value: 'XS', label: 'XS' },
                        { value: 'S', label: 'S' },
                        { value: 'M', label: 'M' },
                        { value: 'L', label: 'L' },
                        { value: 'XL', label: 'XL' },
                        { value: 'XXL', label: 'XXL' },
                    ]}
                    value={editFormData.size}
                    onChange={onInputChange}
                    required
                />

                <div className={styles.bibInputContainer}>
                    <Input
                        label="Bib Number"
                        name="bibNumber"
                        value={editFormData.bibNumber || ''}
                        onChange={onInputChange}
                        onBlur={onBibBlur}
                        placeholder="e.g., 3K-101"
                    />
                    {bibDuplicate && (
                        <div className={styles.bibDuplicateWarning}>
                            ⚠️ Already assigned to: {bibDuplicate.name} ({bibDuplicate.organization})
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EditParticipantModal;
