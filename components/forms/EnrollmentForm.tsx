/**
 * EnrollmentForm Component
 * 
 * Main form component for participant enrollment.
 * Handles form state, validation, and submission to Firestore.
 * Follows Airbnb JavaScript Style Guide and React best practices.
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button, Input, Dropdown, RadioGroup } from '@/components/ui';
import { addParticipant, validateParticipant } from '@/lib/firestoreService';
import { checkBibNumberDuplicate } from '@/lib/participantsService';
import { Participant } from '@/types';
import styles from '@/styles/EnrollmentForm.module.css';

/**
 * Gender options
 */
const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

/**
 * Category options for race distance
 */
const CATEGORY_OPTIONS = [
  { value: '3K', label: '3K' },
  { value: '5K', label: '5K' },
  { value: '10K', label: '10K' },
];

/**
 * T-shirt size options
 */
const SIZE_OPTIONS = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
];

/**
 * LocalStorage key for persisted organization
 */
const STORAGE_KEY = 'trr_selected_organization';
const STORAGE_EXPIRY_KEY = 'trr_organization_expiry';
const EXPIRY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get persisted organization from localStorage
 */
const getPersistedOrganization = (): string => {
  if (typeof window === 'undefined') return '';

  try {
    const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      // Expired, clear storage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      return '';
    }
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

/**
 * Save organization to localStorage with expiry
 */
const persistOrganization = (org: string): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, org);
    localStorage.setItem(STORAGE_EXPIRY_KEY, String(Date.now() + EXPIRY_DURATION_MS));
  } catch (error) {
    console.warn('Failed to persist organization:', error);
  }
};

/**
 * Initial form state
 */
const initialFormData: Omit<Participant, 'id' | 'createdAt'> = {
  organization: '',
  name: '',
  gender: 'Male',
  mobileNumber: '',
  category: '3K',
  size: '',
  bibNumber: '',
  swagKitGiven: false, // Default to false
};

/**
 * EnrollmentForm component
 */
interface EnrollmentFormProps {
  organizations: { name: string }[];
}

/**
 * EnrollmentForm component
 */
const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ organizations }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load organizations and persisted selection on mount
   */
  /**
   * Load persisted selection on mount
   */
  useEffect(() => {
    // Load persisted organization
    const savedOrg = getPersistedOrganization();
    if (savedOrg) {
      setFormData(prev => ({ ...prev, organization: savedOrg }));
    }
  }, []);

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Handle form reset - preserves organization
   */
  const handleReset = (preserveOrg: boolean = true) => {
    const savedOrg = preserveOrg ? formData.organization : '';
    setFormData({
      ...initialFormData,
      organization: savedOrg,
    });
    setErrors({});
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form data
    const validationError = validateParticipant(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    // Check for bib number duplicate if bib is provided
    const bibNumber = formData.bibNumber?.trim();
    if (bibNumber) {
      try {
        const duplicate = await checkBibNumberDuplicate(bibNumber);
        if (duplicate) {
          toast.error(
            `Bib "${bibNumber}" is already assigned to ${duplicate.name} (${duplicate.organization})`
          );
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Error checking bib duplicate:', error);
        toast.error('Failed to verify bib number. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Submit to Firestore
      const participantId = await addParticipant(formData);

      // Persist organization for future enrollments
      persistOrganization(formData.organization);

      // Show success toast
      toast.success('Enrollment successful! 🎉', {
        duration: 1000,
        position: 'top-center',
      });

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset form but keep organization
      handleReset(true);

      console.log('Participant enrolled with ID:', participantId);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit enrollment. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formGrid}>
        {/* Organization */}
        <Dropdown
          label="Organization/School"
          name="organization"
          options={[
            { value: '', label: 'Select your organization/school' },
            ...organizations.map((org) => ({
              value: org.name,
              label: org.name,
            })),
          ]}
          placeholder="Select your organization/school"
          value={formData.organization}
          onChange={handleChange}
          error={errors.organization}
          required
        />

        {/* Name */}
        <Input
          label="Full Name"
          name="name"
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        // autoComplete="name"
        />

        {/* Gender and Category Row */}
        <div className={styles.rowGroup}>
          <RadioGroup
            label="Gender"
            name="gender"
            options={GENDER_OPTIONS}
            value={formData.gender}
            onChange={handleChange}
            error={errors.gender}
            direction="horizontal"
            required
            columns={3}
          />

          <RadioGroup
            label="Race Category"
            name="category"
            options={CATEGORY_OPTIONS}
            value={formData.category}
            onChange={handleChange}
            error={errors.category}
            direction="horizontal"
            required
            columns={3}
          />
        </div>

        {/* Mobile Number */}
        <Input
          label="Mobile Number"
          name="mobileNumber"
          type="tel"
          placeholder="Enter your mobile number"
          value={formData.mobileNumber}
          onChange={handleChange}
          error={errors.mobileNumber}
          required
        // autoComplete="tel"
        />

        {/* T-Shirt Size */}
        <RadioGroup
          label="T-Shirt Size"
          name="size"
          options={SIZE_OPTIONS}
          value={formData.size}
          onChange={handleChange}
          error={errors.size}
          columns={3}
          required
        />

        {/* Bib Number and Swag Kit Row */}
        <div className={styles.rowGroup}>
          {/* Bib Number (Optional) */}
          <Input
            label="Bib Number (Optional)"
            name="bibNumber"
            type="text"
            placeholder="e.g., 3K-101"
            value={formData.bibNumber || ''}
            onChange={handleChange}
            error={errors.bibNumber}
          />

          {/* Swag Kit Toggle (Optional) */}
          <div className={styles.swagFieldWrapper}>
            <div className={styles.swagLabel}>Swag Kit Given (Optional)</div>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                name="swagKitGiven"
                checked={formData.swagKitGiven || false}
                onChange={(e) => setFormData(prev => ({ ...prev, swagKitGiven: e.target.checked }))}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className={styles.buttonGroup}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Enrollment'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => handleReset(false)}
          disabled={isSubmitting}
        >
          Reset Form
        </Button>
      </div>
    </form>
  );
};

export default EnrollmentForm;
