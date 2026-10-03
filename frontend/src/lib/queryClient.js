import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // retry network/server hiccups once; never retry 4xx (validation, auth, not found)
      retry: (count, error) => count < 1 && !(error?.status >= 400 && error?.status < 500),
    },
  },
})
