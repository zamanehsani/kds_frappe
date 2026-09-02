import { create } from 'zustand'

interface ConnectionState {
  connected: boolean
  setConnected: (connected: boolean) => void
}

// Optimistic default (true) so the modal doesn't flash before the first
// connect attempt resolves.
export const useConnectionStore = create<ConnectionState>()((set) => ({
  connected: true,
  setConnected: (connected) => set({ connected }),
}))
