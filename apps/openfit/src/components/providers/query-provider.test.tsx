import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { QueryProvider } from "./query-provider";

let devtoolsInitialIsOpen: boolean | undefined;

vi.mock("@tanstack/react-query-devtools", () => ({
	ReactQueryDevtools: ({ initialIsOpen }: { initialIsOpen: boolean }) => {
		devtoolsInitialIsOpen = initialIsOpen;
		return <div data-testid="react-query-devtools" />;
	},
}));

function QueryClientConsumer({
	onClient,
}: {
	onClient: (client: QueryClient) => void;
}) {
	const queryClient = useQueryClient();

	useEffect(() => {
		onClient(queryClient);
	}, [onClient, queryClient]);

	return <div>query client consumer</div>;
}

describe("QueryProvider", () => {
	beforeEach(() => {
		devtoolsInitialIsOpen = undefined;
	});

	it("renders children and configures query client defaults", () => {
		let capturedClient: QueryClient | undefined;

		render(
			<QueryProvider>
				<QueryClientConsumer
					onClient={(queryClient) => {
						capturedClient = queryClient;
					}}
				/>
			</QueryProvider>,
		);

		expect(screen.getByText("query client consumer")).toBeInTheDocument();
		expect(screen.getByTestId("react-query-devtools")).toBeInTheDocument();
		expect(devtoolsInitialIsOpen).toBe(false);
		expect(capturedClient).toBeDefined();
		expect(capturedClient?.getDefaultOptions().queries?.staleTime).toBe(
			60 * 1000,
		);
		expect(capturedClient?.getDefaultOptions().queries?.gcTime).toBe(
			5 * 60 * 1000,
		);
		expect(capturedClient?.getDefaultOptions().queries?.retry).toBe(3);
		expect(capturedClient?.getDefaultOptions().mutations?.retry).toBe(1);
	});

	it("keeps the same query client instance across rerenders", () => {
		const seenClients = new Set<QueryClient>();
		const onClient = (queryClient: QueryClient) => {
			seenClients.add(queryClient);
		};

		const { rerender } = render(
			<QueryProvider>
				<QueryClientConsumer onClient={onClient} />
			</QueryProvider>,
		);

		rerender(
			<QueryProvider>
				<QueryClientConsumer onClient={onClient} />
			</QueryProvider>,
		);

		expect(seenClients.size).toBe(1);
	});
});
