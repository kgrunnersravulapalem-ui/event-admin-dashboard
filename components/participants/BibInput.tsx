import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/Participants.module.css';

interface BibInputProps {
    participantId: string;
    currentBibNumber: string | undefined;
    onSave: (bibNumber: string) => Promise<void>;
    isLoading?: boolean;
    debounceDelay?: number;
}

const BibInput: React.FC<BibInputProps> = ({ 
    participantId, 
    currentBibNumber, 
    onSave, 
    isLoading = false,
    debounceDelay = 500
}) => {
    const [inputValue, setInputValue] = useState(currentBibNumber || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Clear debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleSave = async (valueToSave: string) => {
        setIsSaving(true);
        try {
            await onSave(valueToSave);
            setInputValue(valueToSave);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save bib number';
            setError(errorMessage);
            // Reset input on error
            setInputValue(currentBibNumber || '');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow digits
        const digitsOnly = value.replace(/\D/g, '');
        setInputValue(digitsOnly);
        setError(null);

        // Clear existing debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounce timer for auto-save (works for both empty and non-empty values)
        debounceTimerRef.current = setTimeout(() => {
            if (digitsOnly !== currentBibNumber) {
                handleSave(digitsOnly);
            }
        }, debounceDelay);
    };

    const handleBlur = () => {
        // Clear debounce timer on blur
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Save on blur if there's a value and it's different from current
        if (inputValue && inputValue.trim() !== '' && inputValue !== currentBibNumber) {
            handleSave(inputValue);
        } else if (!inputValue) {
            // Reset to current value if input is empty
            setInputValue(currentBibNumber || '');
        }
    };

    return (
        <div className={styles.bibInputWrapper}>
            <input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter bib"
                maxLength={10}
                className={`${styles.bibInputField} ${error ? styles.bibInputError : ''} ${isSaving ? styles.bibInputSaving : ''}`}
                disabled={isSaving || isLoading}
                title="Enter bib number"
            />
            {isSaving && <span className={styles.bibSavingIndicator}>Saving...</span>}
            {error && <span className={styles.bibErrorIndicator} title={error}>⚠️</span>}
        </div>
    );
};

export default BibInput;
