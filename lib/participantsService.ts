/**
 * Participants Firestore Service
 * 
 * Handles CRUD operations for participants collection with filtering and export.
 * Supports real-time updates via Firestore onSnapshot.
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
  onSnapshot,
  Timestamp,
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot,
  Query,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Participant } from '@/types';
import { incrementParticipantStats, decrementParticipantStats } from './statsService';
import { incrementOrgParticipantStats, decrementOrgParticipantStats } from './organizationsService';

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
    
    // Update global stats
    await incrementParticipantStats(participant.category);
    
    // Update organization stats
    await incrementOrgParticipantStats(participant.organization, participant.category);
    
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
    // Get participant to know category before deleting
    const participantDoc = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(participantDoc);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      await deleteDoc(participantDoc);
      
      // Update global stats
      await decrementParticipantStats(data.category);
      
      // Update organization stats
      await decrementOrgParticipantStats(data.organization, data.category);
    } else {
      throw new Error('Participant not found');
    }
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
  gender?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export interface PaginatedResult {
  participants: Participant[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Build Firestore query with filters
 */
const buildFilteredQuery = (
  baseRef: CollectionReference<DocumentData>,
  filters?: ParticipantFilters
): Query<DocumentData> => {
  // Firestore has limitations on compound queries
  // We'll use the most selective filter for the query and apply others client-side
  
  // Priority: organization > category > gender (as these are equality filters)
  if (filters?.organization) {
    return query(
      baseRef,
      where('organization', '==', filters.organization),
      orderBy('createdAt', 'desc')
    );
  }
  
  if (filters?.category) {
    return query(
      baseRef,
      where('category', '==', filters.category),
      orderBy('createdAt', 'desc')
    );
  }
  
  if (filters?.gender) {
    return query(
      baseRef,
      where('gender', '==', filters.gender),
      orderBy('createdAt', 'desc')
    );
  }
  
  return query(baseRef, orderBy('createdAt', 'desc'));
};

/**
 * Apply client-side filters that couldn't be applied in Firestore query
 */
const applyClientSideFilters = (
  participants: Participant[],
  filters?: ParticipantFilters,
  appliedFilter?: 'organization' | 'category' | 'gender'
): Participant[] => {
  let result = [...participants];
  
  // Apply category filter if not already applied
  if (filters?.category && appliedFilter !== 'category') {
    result = result.filter(p => p.category === filters.category);
  }
  
  // Apply organization filter if not already applied
  if (filters?.organization && appliedFilter !== 'organization') {
    result = result.filter(p => p.organization === filters.organization);
  }
  
  // Apply gender filter if not already applied
  if (filters?.gender && appliedFilter !== 'gender') {
    result = result.filter(p => p.gender === filters.gender);
  }
  
  // Apply date range filters
  if (filters?.startDate) {
    const startDate = new Date(filters.startDate);
    startDate.setHours(0, 0, 0, 0);
    result = result.filter(p => {
      if (!p.createdAt) return false;
      const enrollDate = new Date(p.createdAt);
      enrollDate.setHours(0, 0, 0, 0);
      return enrollDate >= startDate;
    });
  }
  
  if (filters?.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);
    result = result.filter(p => {
      if (!p.createdAt) return false;
      return new Date(p.createdAt) <= endDate;
    });
  }
  
  // Apply search term filter
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.mobileNumber.includes(term)
    );
  }
  
  return result;
};

/**
 * Get paginated participants with filters
 * Uses offset-based pagination for better UX with arbitrary page navigation
 */
export const getPaginatedParticipants = async (
  filters?: ParticipantFilters,
  page: number = 1,
  pageSize: number = 25
): Promise<PaginatedResult> => {
  try {
    // Get all filtered participants first
    const allParticipants = await getAllParticipants(filters);
    const totalCount = allParticipants.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Calculate offset
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Slice for current page
    const participants = allParticipants.slice(startIndex, endIndex);
    
    return {
      participants,
      totalCount,
      currentPage: page,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching paginated participants:', error);
    throw new Error('Failed to fetch participants. Please try again.');
  }
};

/**
 * Convert Firestore document to Participant
 */
const docToParticipant = (doc: QueryDocumentSnapshot<DocumentData>): Participant => {
  const data = doc.data();
  return {
    id: doc.id,
    organization: data.organization,
    name: data.name,
    gender: data.gender,
    mobileNumber: data.mobileNumber,
    category: data.category,
    size: data.size,
    disabled: data.disabled || false,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
  };
};

export const getAllParticipants = async (
  filters?: ParticipantFilters
): Promise<Participant[]> => {
  try {
    const participantsRef = getParticipantsCollection();
    
    // Determine which filter to apply at Firestore level
    let appliedFilter: 'organization' | 'category' | 'gender' | undefined;
    if (filters?.organization) appliedFilter = 'organization';
    else if (filters?.category) appliedFilter = 'category';
    else if (filters?.gender) appliedFilter = 'gender';
    
    const q = buildFilteredQuery(participantsRef, filters);
    const querySnapshot = await getDocs(q);
    
    let participants = querySnapshot.docs.map(doc => docToParticipant(doc));
    
    // Apply client-side filters
    participants = applyClientSideFilters(participants, filters, appliedFilter);
    
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

/**
 * Subscribe to real-time participant updates
 * Returns an unsubscribe function to stop listening
 */
export const subscribeToParticipants = (
  onUpdate: (participants: Participant[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const participantsRef = getParticipantsCollection();
  const q = query(participantsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const participants = snapshot.docs.map(doc => docToParticipant(doc));
      onUpdate(participants);
    },
    (error) => {
      console.error('Error in participants subscription:', error);
      if (onError) {
        onError(error);
      }
    }
  );
};

/**
 * Subscribe to participant count for real-time stats
 */
export const subscribeToParticipantCount = (
  onUpdate: (count: number) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const participantsRef = getParticipantsCollection();
  
  return onSnapshot(
    participantsRef,
    (snapshot) => {
      onUpdate(snapshot.size);
    },
    (error) => {
      console.error('Error in participant count subscription:', error);
      if (onError) {
        onError(error);
      }
    }
  );
};

/**
 * Toggle participant enrollment status (unenroll/re-enroll)
 */
export const toggleParticipantStatus = async (
  id: string,
  disabled: boolean
): Promise<void> => {
  try {
    const participantDoc = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(participantDoc);
    
    if (!snapshot.exists()) {
      throw new Error('Participant not found');
    }
    
    const data = snapshot.data();
    
    await updateDoc(participantDoc, {
      disabled,
      updatedAt: serverTimestamp(),
    });
    
    // Update stats based on status change
    if (disabled) {
      // Unenrolling - decrement stats
      await decrementParticipantStats(data.category);
      await decrementOrgParticipantStats(data.organization, data.category);
    } else {
      // Re-enrolling - increment stats
      await incrementParticipantStats(data.category);
      await incrementOrgParticipantStats(data.organization, data.category);
    }
  } catch (error) {
    console.error('Error toggling participant status:', error);
    throw new Error('Failed to update participant status. Please try again.');
  }
};

/**
 * Bulk delete multiple participants
 */
export const bulkDeleteParticipants = async (
  ids: string[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < ids.length; i++) {
    try {
      await deleteParticipant(ids[i]);
      success++;
    } catch (error) {
      console.error(`Failed to delete participant ${ids[i]}:`, error);
      failed++;
    }
    onProgress?.(i + 1, ids.length);
  }
  
  return { success, failed };
};

/**
 * Bulk toggle status for multiple participants
 */
export const bulkToggleParticipantStatus = async (
  ids: string[],
  disabled: boolean,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < ids.length; i++) {
    try {
      await toggleParticipantStatus(ids[i], disabled);
      success++;
    } catch (error) {
      console.error(`Failed to toggle status for participant ${ids[i]}:`, error);
      failed++;
    }
    onProgress?.(i + 1, ids.length);
  }
  
  return { success, failed };
};
