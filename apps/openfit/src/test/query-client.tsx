import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

type TestQueryClientConfig = ConstructorParameters<typeof QueryClient>[0];

function mergeDefaultOptions(
	config: TestQueryClientConfig = {},
): TestQueryClientConfig {
	return {
		...config,
		defaultOptions: {
			...config.defaultOptions,
			queries: {
				retry: false,
				gcTime: 0,
				...config.defaultOptions?.queries,
			},
			mutations: {
				retry: false,
				...config.defaultOptions?.mutations,
			},
		},
	};
}

export function createTestQueryClient(
	config: TestQueryClientConfig = {},
): QueryClient {
	return new QueryClient(mergeDefaultOptions(config));
}

export function createTestQueryWrapper(config: TestQueryClientConfig = {}) {
	const queryClient = createTestQueryClient(config);

	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	}

	return {
		queryClient,
		wrapper: Wrapper,
	};
}
