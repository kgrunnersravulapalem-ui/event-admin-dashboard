/**
 * useParticipants Hook
 * 
 * Custom hook for consuming the participants store with built-in
 * filtering, searching, and pagination utilities.
 * 
 * Features:
 * - Excel-like search across all participants
 * - Client-side filtering (organization, category, gender, swag kit)
 * - Client-side pagination
 * - Automatic initialization
 */

import { useEffect, useMemo } from 'react';
import { useParticipantsStore } from '@/stores/useParticipantsStore';
import { Participant } from '@/types';

export interface UseParticipantsFilters {
    organization?: string;
    category?: string;
    gender?: string;
    swagKitGiven?: boolean;
    searchTerm?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface UseParticipantsOptions {
    filters?: UseParticipantsFilters;
    autoInitialize?: boolean; // Auto-initialize listener on mount
    pageSize?: number;
    currentPage?: number;
}

export interface UseParticipantsReturn {
    // Data
    participants: Participant[];
    allParticipants: Participant[]; // Unfiltered
    filteredParticipants: Participant[]; // After filters, before pagination
    paginatedParticipants: Participant[]; // Final paginated results

    // Metadata
    totalCount: number;
    filteredCount: number;
    organizations: Set<string>;

    // States
    isLoading: boolean;
    isInitializing: boolean;
    error: string | null;
    lastUpdated: number | null;

    // Actions
    initialize: () => void;
    cleanup: () => void;

    // Pagination helpers
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

/**
 * Custom hook to use participants store with filtering and pagination
 */
export function useParticipants(options: UseParticipantsOptions = {}): UseParticipantsReturn {
    const {
        filters = {},
        autoInitialize = true,
        pageSize = 25,
        currentPage = 1,
    } = options;

    // Get store state
    const {
        participants: allParticipants,
        organizations,
        isInitializing,
        isLoading: isStoreLoading, // Alias store's isLoading to avoid conflict with hook's isLoading
        error,
        lastUpdated, // Renamed from lastSync
        listenerActive,
        initialize,
        cleanup,
    } = useParticipantsStore();

    // Auto-initialize on mount if enabled
    useEffect(() => {
        if (autoInitialize && !listenerActive) {
            console.log('[useParticipants] Auto-initializing store...');
            initialize();
        }

        // Cleanup on unmount (optional - store persists across pages)
        // Uncomment if you want to cleanup when component unmounts
        // return () => {
        //   cleanup();
        // };
    }, [autoInitialize, listenerActive, initialize]);

    // Apply filters
    const filteredParticipants = useMemo(() => {
        let result = [...allParticipants];

        // Organization filter
        if (filters.organization) {
            result = result.filter(p => p.organization === filters.organization);
        }

        // Category filter
        if (filters.category) {
            result = result.filter(p => p.category === filters.category);
        }

        // Gender filter
        if (filters.gender) {
            result = result.filter(p => p.gender === filters.gender);
        }

        // Swag kit filter
        if (filters.swagKitGiven !== undefined) {
            result = result.filter(p => p.swagKitGiven === filters.swagKitGiven);
        }

        // Date range filters
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            result = result.filter(p => {
                if (!p.createdAt) return false;
                const enrollDate = new Date(p.createdAt);
                enrollDate.setHours(0, 0, 0, 0);
                return enrollDate >= startDate;
            });
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            result = result.filter(p => {
                if (!p.createdAt) return false;
                return new Date(p.createdAt) <= endDate;
            });
        }

        // Search term filter (Excel-like search across ALL participants)
        if (filters.searchTerm && filters.searchTerm.trim()) {
            const term = filters.searchTerm.toLowerCase().trim();
            result = result.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.mobileNumber.includes(term) ||
                (p.bibNumber && p.bibNumber.toLowerCase().includes(term))
            );
        }

        return result;
    }, [allParticipants, filters]);

    // Apply pagination
    const paginatedParticipants = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredParticipants.slice(startIndex, endIndex);
    }, [filteredParticipants, currentPage, pageSize]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(filteredParticipants.length / pageSize);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return {
        // Data
        participants: paginatedParticipants, // Default to paginated
        allParticipants,
        filteredParticipants,
        paginatedParticipants,

        // Metadata
        totalCount: allParticipants.length,
        filteredCount: filteredParticipants.length,
        organizations,

        // States
        // States
        isLoading: isStoreLoading,
        isInitializing,
        error,
        lastUpdated,

        // Actions
        initialize,
        cleanup,

        // Pagination
        totalPages,
        hasNextPage,
        hasPrevPage,
    };
}

/**
 * Hook for simple access to all participants without filters
 */
export function useAllParticipants() {
    return useParticipants({ autoInitialize: true });
}

/**
 * Hook for searching participants (Excel-like)
 */
export function useParticipantSearch(searchTerm: string) {
    return useParticipants({
        filters: { searchTerm },
        autoInitialize: true,
    });
}
