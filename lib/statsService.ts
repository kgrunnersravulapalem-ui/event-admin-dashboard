/**
 * Statistics Service
 * 
 * Manages event statistics efficiently using a single document
 * to avoid excessive Firestore reads
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

const STATS_DOC = 'stats/event_stats';

/**
 * Statistics data structure
 */
export interface EventStats {
  totalParticipants: number;
  totalOrganizations: number;
  category3K: number;
  category5K: number;
  category10K: number;
  lastUpdated: Date;
}

/**
 * Get event statistics
 */
export const getEventStats = async (): Promise<EventStats> => {
  try {
    const statsDoc = doc(db, STATS_DOC);
    const snapshot = await getDoc(statsDoc);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        totalParticipants: data.totalParticipants || 0,
        totalOrganizations: data.totalOrganizations || 0,
        category3K: data.category3K || 0,
        category5K: data.category5K || 0,
        category10K: data.category10K || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }
    
    // Initialize if doesn't exist
    const initialStats: EventStats = {
      totalParticipants: 0,
      totalOrganizations: 0,
      category3K: 0,
      category5K: 0,
      category10K: 0,
      lastUpdated: new Date(),
    };
    
    await setDoc(statsDoc, initialStats);
    return initialStats;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw new Error('Failed to fetch statistics');
  }
};

/**
 * Increment participant count when adding a participant
 */
export const incrementParticipantStats = async (category: '3K' | '5K' | '10K'): Promise<void> => {
  try {
    const statsDoc = doc(db, STATS_DOC);
    const categoryField = `category${category}`;
    
    await updateDoc(statsDoc, {
      totalParticipants: increment(1),
      [categoryField]: increment(1),
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Error incrementing participant stats:', error);
    // Don't throw error to avoid blocking participant creation
  }
};

/**
 * Decrement participant count when deleting a participant
 */
export const decrementParticipantStats = async (category: '3K' | '5K' | '10K'): Promise<void> => {
  try {
    const statsDoc = doc(db, STATS_DOC);
    const categoryField = `category${category}`;
    
    await updateDoc(statsDoc, {
      totalParticipants: increment(-1),
      [categoryField]: increment(-1),
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Error decrementing participant stats:', error);
  }
};

/**
 * Increment organization count
 */
export const incrementOrganizationStats = async (): Promise<void> => {
  try {
    const statsDoc = doc(db, STATS_DOC);
    await updateDoc(statsDoc, {
      totalOrganizations: increment(1),
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Error incrementing organization stats:', error);
  }
};

/**
 * Decrement organization count
 */
export const decrementOrganizationStats = async (): Promise<void> => {
  try {
    const statsDoc = doc(db, STATS_DOC);
    await updateDoc(statsDoc, {
      totalOrganizations: increment(-1),
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Error decrementing organization stats:', error);
  }
};

/**
 * Update category when participant category changes
 */
export const updateCategoryStats = async (
  oldCategory: '3K' | '5K' | '10K',
  newCategory: '3K' | '5K' | '10K'
): Promise<void> => {
  try {
    const statsDoc = doc(db, STATS_DOC);
    const oldCategoryField = `category${oldCategory}`;
    const newCategoryField = `category${newCategory}`;
    
    await updateDoc(statsDoc, {
      [oldCategoryField]: increment(-1),
      [newCategoryField]: increment(1),
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error('Error updating category stats:', error);
  }
};
