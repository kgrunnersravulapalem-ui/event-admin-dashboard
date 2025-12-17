/**
 * Type definitions for the Event Enrollment application
 */

/**
 * Participant enrollment data structure
 */
export interface Participant {
  id?: string;
  organization: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string;
  category: '3K' | '5K' | '10K';
  size: string;
  bibNumber?: string; // Unique bib number for the participant (e.g., "RUN-101")
  disabled?: boolean; // If true, participant is unenrolled but not deleted
  swagKitGiven?: boolean; // If true, swag kit has been given to participant
  isPaid?: boolean; // If true, participant has paid
  dateOfBirth?: string; // Date of birth in dd/mm/yyyy format
  email?: string; // Email address
  bloodGroup?: string; // Blood group
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Organization option for dropdown
 */
export interface OrganizationOption {
  value: string;
  label: string;
}

// Re-export organization types
export type { Organization, OrganizationStats } from './organization';
