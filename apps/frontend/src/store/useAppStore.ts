import { create } from 'zustand';

interface AppState {
  lessonsCompleted: number;
  incrementLessons: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  lessonsCompleted: 0,
  incrementLessons: () => set((state) => ({ lessonsCompleted: state.lessonsCompleted + 1 })),
}));
