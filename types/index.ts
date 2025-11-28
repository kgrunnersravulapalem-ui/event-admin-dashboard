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
  disabled?: boolean; // If true, participant is unenrolled but not deleted
  swagKitGiven?: boolean; // If true, swag kit has been given to participant
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
export type { Organization } from './organization';
