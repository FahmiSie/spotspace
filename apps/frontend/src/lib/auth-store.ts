import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: 'member' | 'admin_space' | null;
  memberId: number | null;
  spaceOwnerId: number | null;
  namaMember: string | null;
  setAuth: (data: Partial<AuthState>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      memberId: null,
      spaceOwnerId: null,
      namaMember: null,
      setAuth: (data) => set(data),
      logout: () => set({ token: null, role: null, memberId: null, spaceOwnerId: null, namaMember: null }),
    }),
    { name: 'spotspace-auth' },
  ),
);