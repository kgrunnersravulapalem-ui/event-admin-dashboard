/**
 * Firestore Service
 * 
 * Handles all database operations for participant enrollment.
 * Follows best practices for error handling and data validation.
 * 
 * @module firestoreService
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Participant } from '@/types';

/**
 * Collection name for participants
 */
const COLLECTION_NAME = 'participants';

/**
 * Get participants collection reference
 */
const getParticipantsCollection = (): CollectionReference<DocumentData> => {
  return collection(db, COLLECTION_NAME);
};

/**
 * Add a new participant to Firestore
 * 
 * @param {Omit<Participant, 'id' | 'createdAt'>} participant - Participant data without id and createdAt
 * @returns {Promise<string>} The ID of the newly created document
 * @throws {Error} If the operation fails
 * 
 * @example
 * ```ts
 * const participantId = await addParticipant({
 *   organization: 'Tech Corp',
 *   name: 'John Doe',
 *   gender: 'Male',
 *   mobileNumber: '+1234567890',
 *   category: '5K',
 *   size: 'M'
 * });
 * ```
 */
export const addParticipant = async (
  participant: Omit<Participant, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const participantsRef = getParticipantsCollection();
    
    const docRef = await addDoc(participantsRef, {
      ...participant,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding participant:', error);
    throw new Error('Failed to add participant. Please try again.');
  }
};

/**
 * Validate participant data before submission
 * 
 * @param {Omit<Participant, 'id' | 'createdAt'>} participant - Participant data to validate
 * @returns {string | null} Error message if validation fails, null if valid
 */
export const validateParticipant = (
  participant: Omit<Participant, 'id' | 'createdAt'>
): string | null => {
  if (!participant.organization || participant.organization.trim() === '') {
    return 'Organization is required';
  }
  
  if (!participant.name || participant.name.trim() === '') {
    return 'Name is required';
  }
  
  if (!participant.gender) {
    return 'Gender is required';
  }
  
  if (!participant.mobileNumber || participant.mobileNumber.trim() === '') {
    return 'Mobile number is required';
  }
  
  // Basic mobile number validation (10-15 digits)
  const mobileRegex = /^[0-9]{10,15}$/;
  const cleanedNumber = participant.mobileNumber.replace(/[\s\-\(\)]/g, '');
  if (!mobileRegex.test(cleanedNumber)) {
    return 'Please enter a valid mobile number (10-15 digits)';
  }
  
  if (!participant.category) {
    return 'Category is required';
  }
  
  if (!participant.size || participant.size.trim() === '') {
    return 'Size is required';
  }
  
  return null;
};
