/**
 * Organizations Store - Real-time Zustand Store
 * 
 * Global state management for organizations with Firebase onSnapshot listener.
 * Provides real-time synchronization across all pages without prop drilling.
 * 
 * Features:
 * - Real-time sync with Firestore
 * - Single source of truth for all organizations
 * - Automatic reconnection on network issues
 * - Memory-efficient caching
 * - Local Storage Persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    QueryDocumentSnapshot,
    DocumentData,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Organization } from '@/types';

/**
 * Store State Interface
 */
interface OrganizationsState {
    // Data
    organizations: Organization[];
    allOrganizations: Organization[]; // Cache of all organizations

    // Loading states
    isInitializing: boolean;
    isLoading: boolean;
    error: string | null;

    // Metadata
    lastUpdated: number | null;
    listenerActive: boolean;

    // Actions
    initialize: () => void;
    cleanup: () => void;
    setError: (error: string | null) => void;
}

/**
 * Convert Firestore document to Organization
 */
const docToOrganization = (doc: QueryDocumentSnapshot<DocumentData>): Organization => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        code: data.code,
        totalParticipants: data.totalParticipants || 0,
        category3K: data.category3K || 0,
        category5K: data.category5K || 0,
        category10K: data.category10K || 0,
        stats: data.stats,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
    };
};

/**
 * Global listener reference (outside store to prevent duplicates)
 */
let globalUnsubscribe: Unsubscribe | null = null;

/**
 * Organizations Store
 */
export const useOrganizationsStore = create<OrganizationsState>()(
    persist(
        (set, get) => ({
            // Initial state
            organizations: [],
            allOrganizations: [],
            isInitializing: false,
            isLoading: false,
            error: null,
            lastUpdated: null,
            listenerActive: false,

            /**
             * Initialize the real-time listener
             */
            initialize: () => {
                // Prevent duplicate listeners
                if (get().listenerActive || globalUnsubscribe) {
                    console.log('[OrganizationsStore] Listener already active, skipping initialization');
                    return;
                }

                // If we have persisted data, we can show it immediately
                // Only show loading if we have NO data
                if (get().allOrganizations.length === 0) {
                    set({ isInitializing: true, isLoading: true, error: null });
                } else {
                    // Background sync
                    set({ isInitializing: true, isLoading: false, error: null });
                }

                console.log('[OrganizationsStore] Initializing real-time listener...');

                try {
                    const organizationsRef = collection(db, 'organizations');
                    const q = query(organizationsRef, orderBy('name', 'asc'));

                    // Set up real-time listener
                    globalUnsubscribe = onSnapshot(
                        q,
                        (snapshot) => {
                            console.log(`[OrganizationsStore] Received ${snapshot.docs.length} organizations`);

                            const organizations = snapshot.docs.map(doc => docToOrganization(doc));

                            set({
                                organizations, // Initially show all
                                allOrganizations: organizations,
                                isInitializing: false,
                                isLoading: false,
                                error: null,
                                lastUpdated: Date.now(),
                                listenerActive: true,
                            });

                            console.log(`[OrganizationsStore] Synced ${organizations.length} organizations`);
                        },
                        (error) => {
                            console.error('[OrganizationsStore] Listener error:', error);
                            set({
                                isInitializing: false,
                                isLoading: false,
                                error: error.message || 'Failed to sync organizations',
                                listenerActive: false,
                            });
                        }
                    );

                    console.log('[OrganizationsStore] Listener attached successfully');
                } catch (error) {
                    console.error('[OrganizationsStore] Failed to initialize:', error);
                    set({
                        isInitializing: false,
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to initialize',
                        listenerActive: false,
                    });
                }
            },

            /**
             * Cleanup the listener
             */
            cleanup: () => {
                console.log('[OrganizationsStore] Cleaning up listener...');

                if (globalUnsubscribe) {
                    globalUnsubscribe();
                    globalUnsubscribe = null;
                }

                set({ listenerActive: false });
                console.log('[OrganizationsStore] Cleanup complete');
            },

            /**
             * Set error state
             */
            setError: (error: string | null) => {
                set({ error });
            },
        }),
        {
            name: 'organizations-storage', // unique name
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist these fields
                allOrganizations: state.allOrganizations,
                organizations: state.organizations,
                lastUpdated: state.lastUpdated
            }),
        }
    )
);

/**
 * Cleanup on window unload (optional, browser handles this)
 */
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (globalUnsubscribe) {
            globalUnsubscribe();
            globalUnsubscribe = null;
        }
    });
}
