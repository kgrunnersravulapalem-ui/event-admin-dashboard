/**
 * Organizations Firestore Service
 * 
 * Handles CRUD operations for organizations collection.
 * 
 * @module organizationsService
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
  increment,
  CollectionReference,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Organization } from '@/types';

const COLLECTION_NAME = 'organizations';

/**
 * Get organizations collection reference
 */
const getOrganizationsCollection = (): CollectionReference<DocumentData> => {
  return collection(db, COLLECTION_NAME);
};

/**
 * Add a new organization
 */
export const addOrganization = async (
  organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const orgsRef = getOrganizationsCollection();

    const docRef = await addDoc(orgsRef, {
      ...organization,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding organization:', error);
    throw new Error('Failed to add organization. Please try again.');
  }
};

/**
 * Update an existing organization
 */
export const updateOrganization = async (
  id: string,
  data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const orgDoc = doc(db, COLLECTION_NAME, id);

    await updateDoc(orgDoc, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    throw new Error('Failed to update organization. Please try again.');
  }
};

/**
 * Delete an organization
 */
export const deleteOrganization = async (id: string): Promise<void> => {
  try {
    const orgDoc = doc(db, COLLECTION_NAME, id);
    await deleteDoc(orgDoc);
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw new Error('Failed to delete organization. Please try again.');
  }
};

/**
 * Get all organizations
 */
export const getAllOrganizations = async (): Promise<Organization[]> => {
  try {
    const orgsRef = getOrganizationsCollection();
    const q = query(orgsRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        code: data.code,
        totalParticipants: data.totalParticipants || 0,
        category3K: data.category3K || 0,
        category5K: data.category5K || 0,
        category10K: data.category10K || 0,

        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw new Error('Failed to fetch organizations. Please try again.');
  }
};

/**
 * Get a single organization by ID
 */
export const getOrganizationById = async (id: string): Promise<Organization | null> => {
  try {
    const orgDoc = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(orgDoc);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        code: data.code,
        totalParticipants: data.totalParticipants || 0,
        category3K: data.category3K || 0,
        category5K: data.category5K || 0,
        category10K: data.category10K || 0,

        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw new Error('Failed to fetch organization. Please try again.');
  }
};

/**
 * Validate organization data
 */
export const validateOrganization = (
  organization: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
): string | null => {
  if (!organization.name || organization.name.trim() === '') {
    return 'Organization name is required';
  }

  if (!organization.code || organization.code.trim() === '') {
    return 'Organization code is required';
  }

  // Validate code format (alphanumeric, no spaces)
  const codeRegex = /^[A-Z0-9]+$/;
  if (!codeRegex.test(organization.code)) {
    return 'Organization code must be uppercase alphanumeric without spaces';
  }

  return null;
};

/**
 * Get organization by name
 */
export const getOrganizationByName = async (name: string): Promise<Organization | null> => {
  try {
    const orgsRef = getOrganizationsCollection();
    const q = query(orgsRef, where('name', '==', name));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      code: data.code,
      totalParticipants: data.totalParticipants || 0,
      category3K: data.category3K || 0,
      category5K: data.category5K || 0,
      category10K: data.category10K || 0,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
    };
  } catch (error) {
    console.error('Error fetching organization by name:', error);
    return null;
  }
};

/**
 * Increment organization participant stats when adding a participant
 */
export const incrementOrgParticipantStats = async (
  organizationName: string,
  category: '3K' | '5K' | '10K'
): Promise<void> => {
  try {
    const org = await getOrganizationByName(organizationName);
    if (!org?.id) {
      console.warn(`Organization not found: ${organizationName}`);
      return;
    }

    const orgDoc = doc(db, COLLECTION_NAME, org.id);
    const categoryField = `category${category}`;

    await updateDoc(orgDoc, {
      totalParticipants: increment(1),
      [categoryField]: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error incrementing org participant stats:', error);
    // Don't throw error to avoid blocking participant creation
  }
};

/**
 * Decrement organization participant stats when deleting a participant
 */
export const decrementOrgParticipantStats = async (
  organizationName: string,
  category: '3K' | '5K' | '10K'
): Promise<void> => {
  try {
    const org = await getOrganizationByName(organizationName);
    if (!org?.id) {
      console.warn(`Organization not found: ${organizationName}`);
      return;
    }

    const orgDoc = doc(db, COLLECTION_NAME, org.id);
    const categoryField = `category${category}`;

    await updateDoc(orgDoc, {
      totalParticipants: increment(-1),
      [categoryField]: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error decrementing org participant stats:', error);
  }
};

/**
 * Bulk increment organization participant stats (for bulk operations)
 */
export const bulkIncrementOrgParticipantStats = async (
  organizationName: string,
  category: '3K' | '5K' | '10K',
  count: number
): Promise<void> => {
  if (count <= 0) return;

  try {
    const org = await getOrganizationByName(organizationName);
    if (!org?.id) {
      console.warn(`Organization not found: ${organizationName}`);
      return;
    }

    const orgDoc = doc(db, COLLECTION_NAME, org.id);
    const categoryField = `category${category}`;

    await updateDoc(orgDoc, {
      totalParticipants: increment(count),
      [categoryField]: increment(count),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error bulk incrementing org participant stats:', error);
  }
};

/**
 * Bulk decrement organization participant stats (for bulk operations)
 */
export const bulkDecrementOrgParticipantStats = async (
  organizationName: string,
  category: '3K' | '5K' | '10K',
  count: number
): Promise<void> => {
  if (count <= 0) return;

  try {
    const org = await getOrganizationByName(organizationName);
    if (!org?.id) {
      console.warn(`Organization not found: ${organizationName}`);
      return;
    }

    const orgDoc = doc(db, COLLECTION_NAME, org.id);
    const categoryField = `category${category}`;

    await updateDoc(orgDoc, {
      totalParticipants: increment(-count),
      [categoryField]: increment(-count),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error bulk decrementing org participant stats:', error);
  }
};


