/**
 * useOrganizations Hook
 * 
 * Convenience hook for integrating the organizations store into components.
 * Handles initialization and cleanup automatically.
 */

import { useEffect } from 'react';
import { useOrganizationsStore } from '@/stores/useOrganizationsStore';

interface UseOrganizationsOptions {
    autoInitialize?: boolean;
}

/**
 * Hook to access organizations store with automatic lifecycle management
 */
export const useOrganizations = (options: UseOrganizationsOptions = {}) => {
    const { autoInitialize = false } = options;

    const {
        organizations,
        allOrganizations,
        isInitializing,
        isLoading,
        error,
        lastUpdated,
        listenerActive,
        initialize,
        cleanup,
    } = useOrganizationsStore();

    useEffect(() => {
        if (autoInitialize) {
            initialize();
        }

        return () => {
            // Cleanup is handled by the store globally
            // We don't call cleanup here to prevent premature disconnection
        };
    }, [autoInitialize, initialize]);

    return {
        organizations,
        allOrganizations,
        isInitializing,
        isLoading,
        error,
        lastUpdated,
        listenerActive,
        initialize,
        cleanup,
    };
};
