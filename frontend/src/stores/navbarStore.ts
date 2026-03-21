import { create } from 'zustand';

interface NavbarState {
  bgClassName: string;
  setBgClassName: (bg: string) => void;
}

export const useNavbarStore = create<NavbarState>((set) => ({
  bgClassName: 'bg-background',
  setBgClassName: (bgClassName) => set({ bgClassName }),
}));
