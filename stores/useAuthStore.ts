/**
 * Auth Store - Zustand Store for Authentication
 * 
 * Manages login state, session timeout, and persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appConfig } from '@/lib/appConfig';

interface AuthState {
    isAuthenticated: boolean;
    loginTime: number | null;
    login: () => void;
    logout: () => void;
    checkSession: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            loginTime: null,

            login: () => {
                set({
                    isAuthenticated: true,
                    loginTime: Date.now(),
                });
            },

            logout: () => {
                set({
                    isAuthenticated: false,
                    loginTime: null,
                });
                // Clear persistence manually if needed, but setState handles it
            },

            checkSession: () => {
                const { isAuthenticated, loginTime } = get();
                if (!isAuthenticated || !loginTime) return false;

                const now = Date.now();
                const elapsed = now - loginTime;

                if (elapsed > appConfig.auth.sessionTimeout) {
                    get().logout();
                    return false;
                }

                return true;
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
