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
 */

import { create } from 'zustand';
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
    organizations: Set<string>; // Unique organizations for filtering

    // Loading states
    isInitializing: boolean;
    isLoading: boolean;
    error: string | null;

    // Metadata
    lastSync: Date | null;
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
export const useParticipantsStore = create<ParticipantsState>((set, get) => ({
    // Initial state
    participants: [],
    organizations: new Set<string>(),
    isInitializing: false,
    isLoading: false,
    error: null,
    lastSync: null,
    listenerActive: false,

    /**
     * Initialize the real-time listener
     * Call this once when the app loads or user navigates to participants section
     */
    initialize: () => {
        // Prevent duplicate listeners
        if (get().listenerActive || globalUnsubscribe) {
            console.log('[ParticipantsStore] Listener already active, skipping initialization');
            return;
        }

        console.log('[ParticipantsStore] Initializing real-time listener...');
        set({ isInitializing: true, isLoading: true, error: null });

        try {
            const participantsRef = collection(db, 'participants');
            const q = query(participantsRef, orderBy('createdAt', 'desc'));

            // Set up real-time listener
            globalUnsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    console.log(`[ParticipantsStore] Received ${snapshot.docs.length} participants`);
                    console.log(`[REALTIME-TEST] 🔄 Snapshot received! Total docs: ${snapshot.docs.length}`);

                    // Log specific changes for testing
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            console.log("[REALTIME-TEST] ✅ New participant added:", change.doc.data().name);
                        }
                        if (change.type === "modified") {
                            console.log("[REALTIME-TEST] ✏️ Participant modified:", change.doc.data().name);
                        }
                        if (change.type === "removed") {
                            console.log("[REALTIME-TEST] 🗑️ Participant removed:", change.doc.data().name);
                        }
                    });

                    const participants = snapshot.docs.map(doc => docToParticipant(doc));

                    // Extract unique organizations
                    const orgs = new Set<string>();
                    participants.forEach(p => {
                        if (p.organization) {
                            orgs.add(p.organization);
                        }
                    });

                    set({
                        participants,
                        organizations: orgs,
                        isInitializing: false,
                        isLoading: false,
                        error: null,
                        lastSync: new Date(),
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
     * Call this when unmounting or when switching to old pagination
     */
    cleanup: () => {
        console.log('[ParticipantsStore] Cleaning up listener...');

        if (globalUnsubscribe) {
            globalUnsubscribe();
            globalUnsubscribe = null;
        }

        set({
            listenerActive: false,
            participants: [],
            organizations: new Set<string>(),
            lastSync: null,
        });

        console.log('[ParticipantsStore] Cleanup complete');
    },

    /**
     * Set error state
     */
    setError: (error: string | null) => {
        set({ error });
    },
}));

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
