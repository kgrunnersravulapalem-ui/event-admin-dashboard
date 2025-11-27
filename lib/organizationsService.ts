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
  CollectionReference,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Organization } from '@/types/organization';

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
