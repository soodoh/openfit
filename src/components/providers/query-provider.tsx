import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from 'react';
import type { ReactNode } from 'react';
type QueryProviderProps = {
    children: ReactNode;
};
export function QueryProvider({ children }: QueryProviderProps): any {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Keep data fresh for 1 minute
                staleTime: 60 * 1000,
                // Cache data for 5 minutes
                gcTime: 5 * 60 * 1000,
                // Retry failed requests 3 times
                retry: 3,
                // Don't refetch on window focus in development
                refetchOnWindowFocus: import.meta.env.PROD,
            },
            mutations: {
                // Retry failed mutations once
                retry: 1,
            },
        },
    }));
    return (<QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false}/>
    </QueryClientProvider>);
}

export default QueryProvider;
