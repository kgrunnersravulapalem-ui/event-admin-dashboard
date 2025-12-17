/**
 * Participants Store - Real-time Zustand Store
 * 
 * Global state management for participants with Firebase onSnapshot listener.
 * Provides real-time synchronization across all pages without prop drilling.
 * 
 * Features:
 * - Real-time sync with Firestore
 * - Single source of truth for all participants
 * - Automatic reconnection on network issues
 * - Memory-efficient caching
 * - Excel-like search across all participants
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
import { Participant } from '@/types';

/**
 * Store State Interface
 */
interface ParticipantsState {
    // Data
    participants: Participant[];
    allParticipants: Participant[]; // Cache of all participants
    organizations: Set<string>; // Unique organizations for filtering

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
        isPaid: data.isPaid || false,
        dateOfBirth: data.dateOfBirth ?? '',
        email: data.email ?? '',
        bloodGroup: data.bloodGroup ?? '',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
    };
};

/**
 * Global listener reference (outside store to prevent duplicates)
 */
let globalUnsubscribe: Unsubscribe | null = null;

/**
 * Participants Store
 */
export const useParticipantsStore = create<ParticipantsState>()(
    persist(
        (set, get) => ({
            // Initial state
            participants: [],
            allParticipants: [],
            organizations: new Set<string>(),
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
                    console.log('[ParticipantsStore] Listener already active, skipping initialization');
                    return;
                }

                // If we have persisted data, we can show it immediately
                // Only show loading if we have NO data
                if (get().allParticipants.length === 0) {
                    set({ isInitializing: true, isLoading: true, error: null });
                } else {
                    // Background sync
                    set({ isInitializing: true, isLoading: false, error: null });
                }

                console.log('[ParticipantsStore] Initializing real-time listener...');

                try {
                    const participantsRef = collection(db, 'participants');
                    const q = query(participantsRef, orderBy('createdAt', 'desc'));

                    // Set up real-time listener
                    globalUnsubscribe = onSnapshot(
                        q,
                        (snapshot) => {
                            console.log(`[ParticipantsStore] Received ${snapshot.docs.length} participants`);

                            const participants = snapshot.docs.map(doc => docToParticipant(doc));

                            // Extract unique organizations
                            const orgs = new Set<string>();
                            participants.forEach(p => {
                                if (p.organization) {
                                    orgs.add(p.organization);
                                }
                            });

                            set({
                                participants, // Initially show all
                                allParticipants: participants,
                                organizations: orgs,
                                isInitializing: false,
                                isLoading: false,
                                error: null,
                                lastUpdated: Date.now(),
                                listenerActive: true,
                            });

                            console.log(`[ParticipantsStore] Synced ${participants.length} participants, ${orgs.size} organizations`);
                        },
                        (error) => {
                            console.error('[ParticipantsStore] Listener error:', error);
                            set({
                                isInitializing: false,
                                isLoading: false,
                                error: error.message || 'Failed to sync participants',
                                listenerActive: false,
                            });
                        }
                    );

                    console.log('[ParticipantsStore] Listener attached successfully');
                } catch (error) {
                    console.error('[ParticipantsStore] Failed to initialize:', error);
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
                console.log('[ParticipantsStore] Cleaning up listener...');

                if (globalUnsubscribe) {
                    globalUnsubscribe();
                    globalUnsubscribe = null;
                }

                set({ listenerActive: false });
                console.log('[ParticipantsStore] Cleanup complete');
            },

            /**
             * Set error state
             */
            setError: (error: string | null) => {
                set({ error });
            },
        }),
        {
            name: 'participants-storage', // unique name
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
            partialize: (state) => ({
                // Only persist these fields
                allParticipants: state.allParticipants,
                participants: state.participants,
                organizations: Array.from(state.organizations), // Convert Set to Array for JSON
                lastUpdated: state.lastUpdated
            }),
            onRehydrateStorage: () => (state) => {
                // Convert Array back to Set after rehydration
                if (state && state.organizations) {
                    // @ts-ignore - we know it comes back as array from JSON
                    state.organizations = new Set(state.organizations);
                }
            }
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
