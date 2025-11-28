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
  writeBatch,
  startAfter,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { Participant } from '@/types';
import {
  incrementOrgParticipantStats,
  decrementOrgParticipantStats,
  bulkDecrementOrgParticipantStats
} from './organizationsService';

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
  swagKitGiven?: boolean; // Filter by swag kit status
}

export interface PaginatedResult {
  participants: Participant[];
  lastVisible: string | null; // ID of the last document
  hasMore: boolean;
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

  // Apply swag kit filter
  if (filters?.swagKitGiven !== undefined) {
    result = result.filter(p => p.swagKitGiven === filters.swagKitGiven);
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
 * Get paginated participants with filters using cursors
 * Uses cursor-based pagination for performance
 */
export const getPaginatedParticipants = async (
  filters?: ParticipantFilters,
  lastVisibleId?: string | null,
  pageSize: number = 25
): Promise<PaginatedResult> => {
  try {
    const participantsRef = getParticipantsCollection();

    // Determine which filter to apply at Firestore level
    // Priority: organization > category > gender
    let appliedFilter: 'organization' | 'category' | 'gender' | undefined;
    let constraints: any[] = [orderBy('createdAt', 'desc')];

    if (filters?.organization) {
      constraints = [where('organization', '==', filters.organization), orderBy('createdAt', 'desc')];
      appliedFilter = 'organization';
    } else if (filters?.category) {
      constraints = [where('category', '==', filters.category), orderBy('createdAt', 'desc')];
      appliedFilter = 'category';
    } else if (filters?.gender) {
      constraints = [where('gender', '==', filters.gender), orderBy('createdAt', 'desc')];
      appliedFilter = 'gender';
    }

    // Add cursor if provided
    if (lastVisibleId) {
      const lastDocRef = doc(db, COLLECTION_NAME, lastVisibleId);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        constraints.push(startAfter(lastDocSnap));
      }
    }

    // Add limit (fetch one extra to check if there are more)
    constraints.push(limit(pageSize + 1));

    const q = query(participantsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    let docs = querySnapshot.docs;
    const hasMore = docs.length > pageSize;

    if (hasMore) {
      docs = docs.slice(0, pageSize);
    }

    let participants = docs.map(doc => docToParticipant(doc));

    // Apply client-side filters
    // Note: This is tricky with cursor pagination because we might filter out all results in the current page
    // Ideally, we should apply all filters in Firestore, but we are limited by composite indexes
    participants = applyClientSideFilters(participants, filters, appliedFilter);

    const lastVisible = docs.length > 0 ? docs[docs.length - 1].id : null;

    return {
      participants,
      lastVisible,
      hasMore,
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
    bibNumber: data.bibNumber || undefined,
    disabled: data.disabled || false,
    swagKitGiven: data.swagKitGiven || false,
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
  const headers = [
    'Name',
    'Organization',
    'Gender',
    'Mobile Number',
    'Category',
    'Size',
    'Bib Number',
    'Swag Kit Given',
    'Status',
    'Enrollment Date',
    'Last Updated'
  ];

  const rows = participants.map((p) => [
    p.name,
    p.organization,
    p.gender,
    p.mobileNumber,
    p.category,
    p.size,
    p.bibNumber || '',
    p.swagKitGiven ? 'Yes' : 'No',
    p.disabled ? 'Unenrolled' : 'Active',
    p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A',
    p.updatedAt ? new Date(p.updatedAt).toLocaleString() : 'N/A',
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
 * Note: Does not affect organization stats - unenrolled participants still count towards totals
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

    await updateDoc(participantDoc, {
      disabled,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling participant status:', error);
    throw new Error('Failed to update participant status. Please try again.');
  }
};

/**
 * Bulk delete multiple participants using batch operations
 * Collects all participant data first, then deletes in batch, then updates stats
 */
export const bulkDeleteParticipants = async (
  ids: string[]
): Promise<{ success: number; failed: number }> => {
  if (ids.length === 0) return { success: 0, failed: 0 };

  try {
    // Step 1: Fetch all participant data first (for stats update)
    const participantDataMap: Map<string, { organization: string; category: '3K' | '5K' | '10K' }> = new Map();

    const fetchPromises = ids.map(async (id) => {
      const participantDoc = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(participantDoc);
      if (snapshot.exists()) {
        const data = snapshot.data();
        participantDataMap.set(id, {
          organization: data.organization,
          category: data.category,
        });
      }
    });

    await Promise.all(fetchPromises);

    // Step 2: Delete all documents in batches (Firestore limit is 500 per batch)
    const BATCH_SIZE = 500;
    const validIds = Array.from(participantDataMap.keys());

    for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchIds = validIds.slice(i, i + BATCH_SIZE);

      batchIds.forEach((id) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.delete(docRef);
      });

      await batch.commit();
    }

    // Step 3: Update organization stats (aggregate by org and category)
    const statsUpdates: Map<string, { org: string; category: '3K' | '5K' | '10K'; count: number }> = new Map();

    participantDataMap.forEach(({ organization, category }) => {
      const key = `${organization}-${category}`;
      const existing = statsUpdates.get(key);
      if (existing) {
        existing.count++;
      } else {
        statsUpdates.set(key, { org: organization, category, count: 1 });
      }
    });

    // Update stats for each org/category combination with correct count
    const statsPromises = Array.from(statsUpdates.values()).map(({ org, category, count }) =>
      bulkDecrementOrgParticipantStats(org, category, count)
    );

    await Promise.all(statsPromises);

    return { success: validIds.length, failed: ids.length - validIds.length };
  } catch (error) {
    console.error('Bulk delete error:', error);
    throw new Error('Failed to delete participants');
  }
};

/**
 * Bulk toggle status for multiple participants using batch operations
 * Note: Does not affect organization stats - unenrolled participants still count towards totals
 */
export const bulkToggleParticipantStatus = async (
  ids: string[],
  disabled: boolean
): Promise<{ success: number; failed: number }> => {
  if (ids.length === 0) return { success: 0, failed: 0 };

  try {
    // Update all documents in batches (Firestore limit is 500 per batch)
    const BATCH_SIZE = 500;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchIds = ids.slice(i, i + BATCH_SIZE);

      batchIds.forEach((id) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.update(docRef, {
          disabled,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    }

    return { success: ids.length, failed: 0 };
  } catch (error) {
    console.error('Bulk toggle status error:', error);
    throw new Error('Failed to update participant statuses');
  }
};

/**
 * Toggle swag kit status for a participant
 */
export const toggleSwagKitStatus = async (
  id: string,
  swagKitGiven: boolean
): Promise<void> => {
  try {
    const participantDoc = doc(db, COLLECTION_NAME, id);

    await updateDoc(participantDoc, {
      swagKitGiven,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error toggling swag kit status:', error);
    throw new Error('Failed to update swag kit status. Please try again.');
  }
};

// ============================================
// BIB MANAGEMENT FUNCTIONS
// ============================================

/**
 * Check if a bib number is already assigned to any participant
 * Returns the participant with the bib number if found, null otherwise
 */
export const checkBibNumberDuplicate = async (
  bibNumber: string,
  excludeParticipantId?: string
): Promise<Participant | null> => {
  try {
    const participantsRef = getParticipantsCollection();
    const q = query(participantsRef, where('bibNumber', '==', bibNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Filter out the excluded participant (for edit scenarios)
    const docs = querySnapshot.docs.filter(doc => doc.id !== excludeParticipantId);

    if (docs.length === 0) {
      return null;
    }

    return docToParticipant(docs[0]);
  } catch (error) {
    console.error('Error checking bib duplicate:', error);
    throw new Error('Failed to check bib number');
  }
};

/**
 * Get all participants for an organization (with and without bibs)
 * Optionally filter by category
 */
export const getParticipantsByOrganization = async (
  organization: string,
  category?: string
): Promise<Participant[]> => {
  try {
    const participantsRef = getParticipantsCollection();
    let q;

    if (category) {
      q = query(
        participantsRef,
        where('organization', '==', organization),
        where('category', '==', category),
        orderBy('createdAt', 'asc')
      );
    } else {
      q = query(
        participantsRef,
        where('organization', '==', organization),
        orderBy('createdAt', 'asc')
      );
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => docToParticipant(doc));
  } catch (error) {
    console.error('Error fetching participants by organization:', error);
    throw new Error('Failed to fetch participants');
  }
};

/**
 * Generate and assign bib numbers to participants without bibs
 * Returns the number of bibs assigned
 */
export const generateBibNumbers = async (
  participantIds: string[],
  prefix: string,
  startNumber: number
): Promise<{ success: number; failed: number }> => {
  if (participantIds.length === 0) {
    return { success: 0, failed: 0 };
  }

  try {
    const BATCH_SIZE = 500;
    let currentNumber = startNumber;
    let success = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < participantIds.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const batchIds = participantIds.slice(i, i + BATCH_SIZE);

      for (const id of batchIds) {
        const bibNumber = `${prefix}${currentNumber}`;

        // Check for duplicate before assigning
        const existingParticipant = await checkBibNumberDuplicate(bibNumber);
        if (existingParticipant) {
          console.warn(`Bib ${bibNumber} already exists, skipping`);
          failed++;
          currentNumber++;
          continue;
        }

        const docRef = doc(db, COLLECTION_NAME, id);
        batch.update(docRef, {
          bibNumber,
          updatedAt: serverTimestamp(),
        });

        success++;
        currentNumber++;
      }

      await batch.commit();
    }

    return { success, failed };
  } catch (error) {
    console.error('Error generating bib numbers:', error);
    throw new Error('Failed to generate bib numbers');
  }
};

/**
 * Update a single participant's bib number
 * Returns duplicate participant if bib already exists
 */
export const updateBibNumber = async (
  participantId: string,
  bibNumber: string | null
): Promise<{ success: boolean; duplicateParticipant?: Participant }> => {
  try {
    // If clearing bib number, just update
    if (!bibNumber) {
      const participantDoc = doc(db, COLLECTION_NAME, participantId);
      await updateDoc(participantDoc, {
        bibNumber: null,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    }

    // Check for duplicates
    const duplicate = await checkBibNumberDuplicate(bibNumber, participantId);
    if (duplicate) {
      return { success: false, duplicateParticipant: duplicate };
    }

    // Update bib number
    const participantDoc = doc(db, COLLECTION_NAME, participantId);
    await updateDoc(participantDoc, {
      bibNumber,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating bib number:', error);
    throw new Error('Failed to update bib number');
  }
};

/**
 * Get all existing bib numbers (for validation)
 */
export const getAllBibNumbers = async (): Promise<Map<string, Participant>> => {
  try {
    const participantsRef = getParticipantsCollection();
    const querySnapshot = await getDocs(participantsRef);

    const bibMap = new Map<string, Participant>();
    querySnapshot.docs.forEach(doc => {
      const participant = docToParticipant(doc);
      if (participant.bibNumber) {
        bibMap.set(participant.bibNumber, participant);
      }
    });

    return bibMap;
  } catch (error) {
    console.error('Error fetching all bib numbers:', error);
    throw new Error('Failed to fetch bib numbers');
  }
};
