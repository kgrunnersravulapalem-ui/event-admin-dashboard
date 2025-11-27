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
import { getAllOrganizations } from '@/lib/organizationsService';
import { Participant, Organization } from '@/types';
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
  { value: '3K', label: '3K Run' },
  { value: '5K', label: '5K Run' },
  { value: '10K', label: '10K Run' },
];

/**
 * T-shirt size options
 */
const SIZE_OPTIONS = [
  { value: 'XS', label: 'Extra Small (XS)' },
  { value: 'S', label: 'Small (S)' },
  { value: 'M', label: 'Medium (M)' },
  { value: 'L', label: 'Large (L)' },
  { value: 'XL', label: 'Extra Large (XL)' },
  { value: 'XXL', label: 'XXL' },
];

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
};

/**
 * EnrollmentForm component
 */
const EnrollmentForm: React.FC = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  /**
   * Load organizations on mount
   */
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await getAllOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  };

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
   * Handle form reset
   */
  const handleReset = () => {
    setFormData(initialFormData);
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

    try {
      // Submit to Firestore
      const participantId = await addParticipant(formData);
      
      // Show success toast
      toast.success('Enrollment successful! 🎉', {
        duration: 4000,
        position: 'top-center',
      });
      
      // Reset form
      handleReset();
      
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
          label="Organization"
          name="organization"
          options={[
            { value: '', label: loadingOrgs ? 'Loading...' : 'Select your organization' },
            ...organizations.map((org) => ({
              value: org.name,
              label: org.name,
            })),
          ]}
          placeholder="Select your organization"
          value={formData.organization}
          onChange={handleChange}
          error={errors.organization}
          required
          disabled={loadingOrgs}
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
          autoComplete="name"
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
          autoComplete="tel"
        />

        {/* Size */}
        <Dropdown
          label="T-Shirt Size"
          name="size"
          options={SIZE_OPTIONS}
          placeholder="Select your size"
          value={formData.size}
          onChange={handleChange}
          error={errors.size}
          required
        />
      </div>

      {/* Buttons */}
      <div className={styles.buttonGroup}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Submitting...' : 'Submit Enrollment'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Reset Form
        </Button>
      </div>
    </form>
  );
};

export default EnrollmentForm;
