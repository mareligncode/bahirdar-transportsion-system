// BahirDarTransportMobileApp\store\authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '@/types/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: true,
      error: null,
      lastLogin: null,
      
      setUser: (user: User | null) => set({ 
        user, 
        isAuthenticated: !!user,
        loading: false,
        error: null,
        lastLogin: user ? new Date().toISOString() : get().lastLogin
      }),
      
      setToken: (token: string | null) => set({ token }),
      
      setRefreshToken: (refreshToken: string | null) => set({ refreshToken }),
      
      setAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
      
      setLoading: (loading: boolean) => set({ loading }),
      
      setError: (error: string | null) => set({ error }),
      
      setLastLogin: (lastLogin: string | null) => set({ lastLogin }),
      
      clearUser: () => set({ 
        user: null, 
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: null
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        lastLogin: state.lastLogin
      }),
    }
  )
);

// ✅ Make sure this export exists
export default useAuthStore;