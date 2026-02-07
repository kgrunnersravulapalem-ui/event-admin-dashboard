/**
 * Registrations Firestore Service
 * 
 * Handles operations for registrations collection
 * 
 * @module registrationsService
 */

import {
  collection,
  query,
  where,
  getDocs,
  CollectionReference,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Registration {
  id?: string;
  age: number;
  amount: number;
  bloodGroup: string;
  createdAt: any; // Firestore timestamp
  dateOfBirth: string; // YYYY-MM-DD format
  email: string;
  emergencyContact: string;
  gender: 'Male' | 'Female' | 'Other';
  merchantOrderId: string;
  name: string;
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
  phone: string;
}

const COLLECTION_NAME = 'registrations';

/**
 * Get registrations collection reference
 */
const getRegistrationsCollection = (): CollectionReference<DocumentData> => {
  return collection(db, COLLECTION_NAME);
};

/**
 * Get registration by merchantOrderId
 * @param merchantOrderId - The merchant order ID to search for
 * @returns Registration document if found, null otherwise
 */
export const getRegistrationByMerchantOrderId = async (
  merchantOrderId: string
): Promise<(Registration & { id: string }) | null> => {
  try {
    const registrationsRef = getRegistrationsCollection();
    const q = query(
      registrationsRef,
      where('merchantOrderId', '==', merchantOrderId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Return the first document (should be unique)
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Registration & { id: string };
  } catch (error) {
    console.error('Error fetching registration:', error);
    throw new Error('Failed to fetch registration. Please try again.');
  }
};

/**
 * Get all registrations (for admin purposes)
 */
export const getAllRegistrations = async (): Promise<(Registration & { id: string })[]> => {
  try {
    const registrationsRef = getRegistrationsCollection();
    const querySnapshot = await getDocs(registrationsRef);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Registration & { id: string })[];
  } catch (error) {
    console.error('Error fetching registrations:', error);
    throw new Error('Failed to fetch registrations. Please try again.');
  }
};
