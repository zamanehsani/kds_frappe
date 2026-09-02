import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FrappeUser {
  name: string
  fullName: string
  email: string
}

interface AuthState {
  user: FrappeUser | null
  sessionToken: string | null
  company: string | null
  isAuthenticated: boolean
  setSession: (user: FrappeUser, sessionToken: string | null, company: string | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      company: null,
      isAuthenticated: false,
      setSession: (user, sessionToken, company) =>
        set({ user, sessionToken, company, isAuthenticated: true }),
      clearSession: () =>
        set({ user: null, sessionToken: null, company: null, isAuthenticated: false }),
    }),
    { name: 'kds-auth' },
  ),
)
