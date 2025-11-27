/**
 * Participants Firestore Service
 * 
 * Handles CRUD operations for participants collection with filtering and export.
 * 
 * @module participantsService
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Participant } from '@/types';

const COLLECTION_NAME = 'participants';

/**
 * Get participants collection reference
 */
const getParticipantsCollection = (): CollectionReference<DocumentData> => {
  return collection(db, COLLECTION_NAME);
};

/**
 * Add a new participant
 */
export const addParticipant = async (
  participant: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const participantsRef = getParticipantsCollection();
    
    const docRef = await addDoc(participantsRef, {
      ...participant,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding participant:', error);
    throw new Error('Failed to add participant. Please try again.');
  }
};

/**
 * Update an existing participant
 */
export const updateParticipant = async (
  id: string,
  data: Partial<Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const participantDoc = doc(db, COLLECTION_NAME, id);
    
    await updateDoc(participantDoc, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    throw new Error('Failed to update participant. Please try again.');
  }
};

/**
 * Delete a participant
 */
export const deleteParticipant = async (id: string): Promise<void> => {
  try {
    const participantDoc = doc(db, COLLECTION_NAME, id);
    await deleteDoc(participantDoc);
  } catch (error) {
    console.error('Error deleting participant:', error);
    throw new Error('Failed to delete participant. Please try again.');
  }
};

/**
 * Get all participants with optional filtering
 */
export interface ParticipantFilters {
  organization?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
}

export const getAllParticipants = async (
  filters?: ParticipantFilters
): Promise<Participant[]> => {
  try {
    const participantsRef = getParticipantsCollection();
    let q = query(participantsRef, orderBy('createdAt', 'desc'));
    
    // Apply filters
    if (filters?.organization) {
      q = query(participantsRef, where('organization', '==', filters.organization), orderBy('createdAt', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    
    let participants = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        organization: data.organization,
        name: data.name,
        gender: data.gender,
        mobileNumber: data.mobileNumber,
        category: data.category,
        size: data.size,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
      } as Participant;
    });
    
    // Apply date filters (client-side since Firestore has query limitations)
    if (filters?.startDate || filters?.endDate) {
      participants = participants.filter((p) => {
        if (!p.createdAt) return false;
        
        if (filters.startDate && p.createdAt < filters.startDate) return false;
        if (filters.endDate) {
          const endOfDay = new Date(filters.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (p.createdAt > endOfDay) return false;
        }
        
        return true;
      });
    }
    
    // Apply category filter (client-side)
    if (filters?.category) {
      participants = participants.filter((p) => p.category === filters.category);
    }
    
    return participants;
  } catch (error) {
    console.error('Error fetching participants:', error);
    throw new Error('Failed to fetch participants. Please try again.');
  }
};

/**
 * Get a single participant by ID
 */
export const getParticipantById = async (id: string): Promise<Participant | null> => {
  try {
    const participantDoc = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(participantDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        organization: data.organization,
        name: data.name,
        gender: data.gender,
        mobileNumber: data.mobileNumber,
        category: data.category,
        size: data.size,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching participant:', error);
    throw new Error('Failed to fetch participant. Please try again.');
  }
};

/**
 * Validate participant data
 */
export const validateParticipant = (
  participant: Omit<Participant, 'id' | 'createdAt' | 'updatedAt'>
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

/**
 * Export participants to CSV format
 */
export const exportParticipantsToCSV = (participants: Participant[]): string => {
  const headers = ['Name', 'Organization', 'Gender', 'Mobile Number', 'Category', 'Size', 'Enrollment Date'];
  
  const rows = participants.map((p) => [
    p.name,
    p.organization,
    p.gender,
    p.mobileNumber,
    p.category,
    p.size,
    p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
