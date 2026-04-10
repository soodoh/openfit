import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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

	it("renders children and configures query client defaults", async () => {
		let capturedClient: QueryClient | undefined;

		const screen = await render(
			<QueryProvider>
				<QueryClientConsumer
					onClient={(queryClient) => {
						capturedClient = queryClient;
					}}
				/>
			</QueryProvider>,
		);

		await expect
			.element(screen.getByText("query client consumer"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByTestId("react-query-devtools"))
			.toBeInTheDocument();
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

	it("keeps the same query client instance across rerenders", async () => {
		const seenClients = new Set<QueryClient>();
		const onClient = (queryClient: QueryClient) => {
			seenClients.add(queryClient);
		};

		const { rerender } = await render(
			<QueryProvider>
				<QueryClientConsumer onClient={onClient} />
			</QueryProvider>,
		);

		await rerender(
			<QueryProvider>
				<QueryClientConsumer onClient={onClient} />
			</QueryProvider>,
		);

		expect(seenClients.size).toBe(1);
	});
});
