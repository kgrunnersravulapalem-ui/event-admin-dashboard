/**
 * Upload Participants Modal Component
 * 
 * Modal for bulk uploading participants via CSV file.
 * Includes organization selection and CSV validation.
 */

'use client';

import React, { useState, useRef } from 'react';
import { Modal, Button, Dropdown, Toggle } from '@/components/ui';
import { Organization } from '@/types';
import {
  parseCSVFile,
  parseCSVContent,
  bulkUploadParticipants,
  downloadSampleCSV,
  EXPECTED_HEADERS,
  CSVParseResult,
} from '@/lib/csvUploadService';
import { toast } from 'react-hot-toast';
import styles from '@/styles/UploadModal.module.css';

interface UploadParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  onUploadStart?: () => void;
  onUploadComplete: () => void;
}

type UploadStep = 'select' | 'preview' | 'uploading' | 'complete';
type InputMode = 'file' | 'paste';

/**
 * Upload Participants Modal
 */
const UploadParticipantsModal: React.FC<UploadParticipantsModalProps> = ({
  isOpen,
  onClose,
  organizations,
  onUploadStart,
  onUploadComplete,
}) => {
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pastedContent, setPastedContent] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [isPaid, setIsPaid] = useState(true);
  const [step, setStep] = useState<UploadStep>('select');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Reset modal state
   */
  const resetModal = () => {
    setSelectedOrganization('');
    setFile(null);
    setPastedContent('');
    setInputMode('file');
    setIsPaid(true);
    setStep('select');
    setParseResult(null);
    setUploadProgress({ current: 0, total: 0 });
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    resetModal();
    onClose();
  };

  /**
   * Handle file selection
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);

    try {
      const content = await parseCSVFile(selectedFile);
      console.log('CSV Content:', content); // Debug
      const result = parseCSVContent(content, isPaid);
      console.log('Parse Result:', result); // Debug
      setParseResult(result);

      // Show toast for immediate feedback
      if (result.errors.length > 0 && result.data.length === 0) {
        toast.error('CSV has validation errors. Check the details below.');
      } else if (result.data.length > 0) {
        toast.success(`Found ${result.data.length} valid rows`);
      }
    } catch (error) {
      toast.error('Failed to read file');
      console.error(error);
    }
  };

  /**
   * Handle pasted content
   */
  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setPastedContent(content);

    if (!content.trim()) {
      setParseResult(null);
      return;
    }

    try {
      const result = parseCSVContent(content, isPaid);
      console.log('Paste Parse Result:', result); // Debug
      setParseResult(result);

      // Show toast for immediate feedback
      if (result.errors.length > 0 && result.data.length === 0) {
        toast.error('Pasted data has validation errors. Check the details below.');
      } else if (result.data.length > 0) {
        toast.success(`Found ${result.data.length} valid rows`);
      }
    } catch (error) {
      toast.error('Failed to parse pasted content');
      console.error(error);
    }
  };

  /**
   * Handle upload
   */
  const handleUpload = async () => {
    if (!parseResult || !selectedOrganization) return;

    setStep('uploading');
    onUploadStart?.();

    try {
      const result = await bulkUploadParticipants(
        parseResult.data,
        selectedOrganization,
        (current, total) => setUploadProgress({ current, total })
      );

      setUploadResult({ success: result.successCount, failed: result.failedCount });
      setStep('complete');

      if (result.successCount > 0) {
        toast.success(`Successfully uploaded ${result.successCount} participants`);
        onUploadComplete();
      }

      if (result.failedCount > 0) {
        toast.error(`Failed to upload ${result.failedCount} participants`);
      }
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
      setStep('preview');
    }
  };

  /**
   * Get organization options for dropdown
   */
  const organizationOptions = [
    { value: '', label: 'Select Organization/School' },
    ...organizations.map(org => ({ value: org.name, label: org.name })),
  ];

  /**
   * Render file selection step
   */
  const renderSelectStep = () => (
    <>
      <div className={styles.field}>
        <label className={styles.label}>Organization/School *</label>
        <Dropdown
          options={organizationOptions}
          value={selectedOrganization}
          onChange={(e) => setSelectedOrganization(e.target.value)}
          placeholder="Select Organization/School"
        />
      </div>

      {/* Payment Status Toggle */}
      <div className={styles.field}>
        <Toggle
          id="payment-status"
          label="Mark as Paid"
          checked={isPaid}
          onChange={setIsPaid}
          description={isPaid ? 'All uploaded participants will be marked as paid' : 'Participants will be marked as unpaid'}
        />
      </div>

      {/* Input Mode Toggle */}
      <div className={styles.field}>
        <label className={styles.label}>Input Method</label>
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={`${styles.modeButton} ${inputMode === 'file' ? styles.modeButtonActive : ''}`}
            onClick={() => {
              setInputMode('file');
              setPastedContent('');
              setParseResult(null);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
            Upload File
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${inputMode === 'paste' ? styles.modeButtonActive : ''}`}
            onClick={() => {
              setInputMode('paste');
              setFile(null);
              setParseResult(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            Paste Data
          </button>
        </div>
      </div>

      {/* File Upload Mode */}
      {inputMode === 'file' && (
        <div className={styles.field}>
          <label className={styles.label}>CSV File *</label>
          <div className={styles.fileInputWrapper}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className={styles.fileInput}
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className={styles.fileInputLabel}>
              {file ? file.name : 'Choose CSV file...'}
            </label>
          </div>
        </div>
      )}

      {/* Paste Mode */}
      {inputMode === 'paste' && (
        <div className={styles.field}>
          <label className={styles.label}>Paste CSV Data *</label>
          <textarea
            className={styles.pasteArea}
            placeholder="Paste your CSV data here (including headers)&#10;Example:&#10;Name,Gender,MobileNumber,Category,Size&#10;John Doe,Male,9876543210,5K,L"
            value={pastedContent}
            onChange={handlePasteChange}
            rows={10}
          />
          <p className={styles.pasteHint}>
            💡 Tip: Copy data directly from Google Sheets or Excel (including headers)
          </p>
        </div>
      )}

      {/* Show parsing errors if file was selected but has issues */}
      {parseResult && parseResult.errors.length > 0 && parseResult.data.length === 0 && (
        <div className={styles.errorList}>
          <div className={styles.errorTitle}>CSV Validation Errors</div>
          <ul>
            {parseResult.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Show success indicator when valid rows found */}
      {parseResult && parseResult.data.length > 0 && (
        <div className={styles.successBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Found <strong>{parseResult.data.length}</strong> valid participant(s) ready to upload</span>
        </div>
      )}

      <div className={styles.infoBox}>
        <div className={styles.infoTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          CSV Format Requirements
        </div>
        <p className={styles.infoText}>
          The CSV file must have the following headers in order:
        </p>
        <code className={styles.headersList}>
          {EXPECTED_HEADERS.join(', ')}
        </code>
        <button
          type="button"
          className={styles.sampleLink}
          onClick={downloadSampleCSV}
        >
          Download sample CSV
        </button>
      </div>
    </>
  );

  /**
   * Render preview step
   */
  const renderPreviewStep = () => (
    <>
      <div className={styles.previewHeader}>
        <div className={styles.previewStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{parseResult?.data.length || 0}</span>
            <span className={styles.statLabel}>Valid Rows</span>
          </div>
          {(parseResult?.errors.length || 0) > 0 && (
            <div className={`${styles.statItem} ${styles.statError}`}>
              <span className={styles.statValue}>{parseResult?.errors.length}</span>
              <span className={styles.statLabel}>Errors</span>
            </div>
          )}
        </div>
        <p className={styles.orgLabel}>
          Organization/School: <strong>{selectedOrganization}</strong>
        </p>
      </div>

      {parseResult?.errors && parseResult.errors.length > 0 && (
        <div className={styles.errorList}>
          <div className={styles.errorTitle}>Validation Errors</div>
          <ul>
            {parseResult.errors.slice(0, 5).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
            {parseResult.errors.length > 5 && (
              <li className={styles.moreErrors}>
                ...and {parseResult.errors.length - 5} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      {parseResult?.warnings && parseResult.warnings.length > 0 && (
        <div className={styles.warningList}>
          <div className={styles.warningTitle}>Warnings</div>
          <ul>
            {parseResult.warnings.slice(0, 3).map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
            {parseResult.warnings.length > 3 && (
              <li>...and {parseResult.warnings.length - 3} more warnings</li>
            )}
          </ul>
        </div>
      )}

      {parseResult?.data && parseResult.data.length > 0 && (
        <div className={styles.previewTable}>
          <div className={styles.tableTitle}>Preview (first 5 rows)</div>
          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Mobile</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.data.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td>{row.name}</td>
                    <td>{row.gender}</td>
                    <td>{row.mobileNumber}</td>
                    <td>{row.category}</td>
                    <td>{row.size || '-'}</td>
                    <td>
                      <span className={row.isPaid ? styles.paidStatus : styles.unpaidStatus}>
                        {row.isPaid ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  /**
   * Render uploading step
   */
  const renderUploadingStep = () => (
    <div className={styles.uploadingContainer}>
      <div className={styles.spinner} />
      <p className={styles.uploadingText}>
        Uploading participants...
      </p>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
        />
      </div>
      <p className={styles.progressText}>
        {uploadProgress.current} of {uploadProgress.total}
      </p>
    </div>
  );

  /**
   * Render complete step
   */
  const renderCompleteStep = () => (
    <div className={styles.completeContainer}>
      <div className={styles.completeIcon}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3 className={styles.completeTitle}>Upload Complete</h3>
      <div className={styles.completeStats}>
        <div className={styles.completeStat}>
          <span className={styles.completeStatValue}>{uploadResult?.success || 0}</span>
          <span className={styles.completeStatLabel}>Successful</span>
        </div>
        {(uploadResult?.failed || 0) > 0 && (
          <div className={`${styles.completeStat} ${styles.completeStatError}`}>
            <span className={styles.completeStatValue}>{uploadResult?.failed}</span>
            <span className={styles.completeStatLabel}>Failed</span>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Render footer based on current step
   */
  const renderFooter = () => {
    switch (step) {
      case 'select':
        return (
          <div className={styles.footer}>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => parseResult && parseResult.data.length > 0 && setStep('preview')}
              disabled={
                !selectedOrganization ||
                !parseResult ||
                parseResult.data.length === 0 ||
                (inputMode === 'file' && !file) ||
                (inputMode === 'paste' && !pastedContent.trim())
              }
            >
              Continue
            </Button>
          </div>
        );
      case 'preview':
        return (
          <div className={styles.footer}>
            <Button variant="outline" onClick={() => setStep('select')}>
              Back
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!parseResult || parseResult.data.length === 0}
            >
              Upload {parseResult?.data.length || 0} Participants
            </Button>
          </div>
        );
      case 'uploading':
        return null;
      case 'complete':
        return (
          <div className={styles.footer}>
            <Button onClick={handleClose}>
              Done
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'uploading' ? () => { } : handleClose}
      title="Upload Participants"
      size="medium"
      footer={renderFooter()}
      closeOnOverlayClick={step !== 'uploading'}
    >
      <div className={styles.content}>
        {step === 'select' && renderSelectStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'uploading' && renderUploadingStep()}
        {step === 'complete' && renderCompleteStep()}
      </div>
    </Modal>
  );
};

export default UploadParticipantsModal;
