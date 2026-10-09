import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const keys = {
  me: ['auth', 'me'] as const,
  dashboard: ['learning', 'dashboard'] as const,
  rules: ['learning', 'rules'] as const,
  recordings: ['learning', 'recordings'] as const,
  admin: ['learning', 'admin'] as const,
  session: (id: string) => ['learning', 'session', id] as const,
  reading: (id: string) => ['learning', 'reading', id] as const,
};
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
    },
    mutations: { retry: false },
  },
});
