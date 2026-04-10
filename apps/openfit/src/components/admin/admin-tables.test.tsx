import { userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AuthProvidersTable } from "./auth-providers-table";
import { ExerciseTable } from "./exercise-table";
import { LookupTable } from "./lookup-table";
import { UserTable } from "./user-table";

const mockUseAdminUsersPaginated = vi.fn();
const mockUseAdminExercisesPaginated = vi.fn();
const mockUseAdminLookupPaginated = vi.fn();
const mockUseAdminDeleteExercise = vi.fn();
const mockUseCreateLookup = vi.fn();
const mockUseUpdateLookup = vi.fn();
const mockUseDeleteLookup = vi.fn();

let usersSeed = {
	data: {
		items: [
			{
				id: "user-1",
				userId: "user-1",
				email: "coach@example.com",
				role: "ADMIN",
			},
			{
				id: "user-2",
				userId: "user-2",
				email: "athlete@example.com",
				role: "USER",
			},
		],
		total: 12,
		page: 1,
		pageSize: 10,
	},
	isLoading: false,
};

let exercisesSeed = {
	data: {
		items: [
			{
				id: "exercise-1",
				name: "Bench Press",
				level: "beginner",
				equipment: { id: "equipment-1", name: "Barbell" },
				category: { id: "category-1", name: "Chest" },
				primaryMuscles: [{ id: "muscle-1", name: "Pectorals" }],
				secondaryMuscles: [],
			},
			{
				id: "exercise-2",
				name: "Air Squat",
				level: "expert",
				equipment: undefined,
				category: undefined,
				primaryMuscles: [],
				secondaryMuscles: [],
			},
		],
		total: 2,
		page: 1,
		pageSize: 10,
	},
	isLoading: false,
};

let lookupsSeed = {
	data: {
		items: [
			{ id: "lookup-1", name: "Rope" },
			{ id: "lookup-2", name: "Machine" },
		],
		total: 2,
		page: 1,
		pageSize: 10,
	},
	isLoading: false,
};

const mockPagination = vi.fn(
	({
		currentPage,
		totalPages,
		onPrevPage,
		onNextPage,
		onPageSizeChange,
	}: {
		currentPage: number;
		totalPages: number;
		onPrevPage: () => void;
		onNextPage: () => void;
		onPageSizeChange: (size: number) => void;
	}) => (
		<div>
			<div>{`page ${currentPage} of ${totalPages}`}</div>
			<button type="button" onClick={onPrevPage}>
				Prev page
			</button>
			<button type="button" onClick={onNextPage}>
				Next page
			</button>
			<button type="button" onClick={() => onPageSizeChange(20)}>
				Page size 20
			</button>
		</div>
	),
);

vi.mock("@/components/ui/pagination", () => ({
	Pagination: (props: Parameters<typeof mockPagination>[0]) =>
		mockPagination(props),
}));

vi.mock("./user-role-modal", () => ({
	UserRoleModal: ({
		user,
		onClose,
	}: {
		user?: { email: string } | undefined;
		onClose: () => void;
	}) =>
		user ? (
			<div>
				<div>{`Role modal: ${user.email}`}</div>
				<button type="button" onClick={onClose}>
					Close role modal
				</button>
			</div>
		) : null,
}));

vi.mock("./exercise-form-modal", () => ({
	ExerciseFormModal: ({
		open,
		exercise,
		onClose,
	}: {
		open: boolean;
		exercise?: { name: string } | undefined;
		onClose: () => void;
	}) =>
		open ? (
			<div>
				<div>
					{exercise ? `Edit exercise: ${exercise.name}` : "Create exercise"}
				</div>
				<button type="button" onClick={onClose}>
					Close exercise form
				</button>
			</div>
		) : null,
}));

vi.mock("./delete-exercise-modal", () => ({
	DeleteExerciseModal: ({
		exercise,
		onClose,
		onDelete,
	}: {
		exercise?: { id: string; name: string } | undefined;
		onClose: () => void;
		onDelete: (id: string) => void;
	}) =>
		exercise ? (
			<div>
				<div>{`Delete exercise: ${exercise.name}`}</div>
				<button
					type="button"
					onClick={() => {
						onDelete(exercise.id);
						onClose();
					}}
				>
					Confirm delete exercise
				</button>
			</div>
		) : null,
}));

vi.mock("./lookup-form-modal", () => ({
	LookupFormModal: ({
		open,
		title,
		item,
		onClose,
		onSubmit,
	}: {
		open: boolean;
		title: string;
		item?: { name: string } | undefined;
		onClose: () => void;
		onSubmit: (name: string) => Promise<void>;
	}) =>
		open ? (
			<div>
				<div>{item ? `Edit ${title}: ${item.name}` : `Create ${title}`}</div>
				<button
					type="button"
					onClick={async () => {
						await onSubmit(item ? `${item.name} updated` : `${title} created`);
						onClose();
					}}
				>
					Submit lookup form
				</button>
			</div>
		) : null,
}));

vi.mock("./delete-lookup-modal", () => ({
	DeleteLookupModal: ({
		item,
		title,
		onClose,
		onDelete,
	}: {
		item?: { id: string; name: string } | undefined;
		title: string;
		onClose: () => void;
		onDelete: (item: { id: string; name: string }) => Promise<void>;
	}) =>
		item ? (
			<div>
				<div>{`Delete ${title}: ${item.name}`}</div>
				<button
					type="button"
					onClick={async () => {
						await onDelete(item);
						onClose();
					}}
				>
					Confirm delete lookup
				</button>
			</div>
		) : null,
}));

vi.mock("@/hooks", () => ({
	useAdminUsersPaginated: (...args: unknown[]) =>
		mockUseAdminUsersPaginated(...args),
	useAdminExercisesPaginated: (...args: unknown[]) =>
		mockUseAdminExercisesPaginated(...args),
	useAdminLookupPaginated: (...args: unknown[]) =>
		mockUseAdminLookupPaginated(...args),
	useAdminDeleteExercise: (...args: unknown[]) =>
		mockUseAdminDeleteExercise(...args),
	useCreateLookup: (...args: unknown[]) => mockUseCreateLookup(...args),
	useUpdateLookup: (...args: unknown[]) => mockUseUpdateLookup(...args),
	useDeleteLookup: (...args: unknown[]) => mockUseDeleteLookup(...args),
}));

describe("admin tables", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		usersSeed = {
			data: {
				items: [
					{
						id: "user-1",
						userId: "user-1",
						email: "coach@example.com",
						role: "ADMIN",
					},
					{
						id: "user-2",
						userId: "user-2",
						email: "athlete@example.com",
						role: "USER",
					},
				],
				total: 12,
				page: 1,
				pageSize: 10,
			},
			isLoading: false,
		};
		exercisesSeed = {
			data: {
				items: [
					{
						id: "exercise-1",
						name: "Bench Press",
						level: "beginner",
						equipment: { id: "equipment-1", name: "Barbell" },
						category: { id: "category-1", name: "Chest" },
						primaryMuscles: [{ id: "muscle-1", name: "Pectorals" }],
						secondaryMuscles: [],
					},
					{
						id: "exercise-2",
						name: "Air Squat",
						level: "expert",
						equipment: undefined,
						category: undefined,
						primaryMuscles: [],
						secondaryMuscles: [],
					},
				],
				total: 2,
				page: 1,
				pageSize: 10,
			},
			isLoading: false,
		};
		lookupsSeed = {
			data: {
				items: [
					{ id: "lookup-1", name: "Rope" },
					{ id: "lookup-2", name: "Machine" },
				],
				total: 2,
				page: 1,
				pageSize: 10,
			},
			isLoading: false,
		};
		mockUseAdminUsersPaginated.mockReturnValue(usersSeed);
		mockUseAdminExercisesPaginated.mockReturnValue(exercisesSeed);
		mockUseAdminLookupPaginated.mockReturnValue(lookupsSeed);
		mockUseAdminDeleteExercise.mockReturnValue({ mutate: vi.fn() });
		mockUseCreateLookup.mockReturnValue({
			mutateAsync: vi.fn(),
			isPending: false,
		});
		mockUseUpdateLookup.mockReturnValue({
			mutateAsync: vi.fn(),
			isPending: false,
		});
		mockUseDeleteLookup.mockReturnValue({
			mutateAsync: vi.fn(),
			isPending: false,
		});
		mockPagination.mockClear();
	});

	it("filters and paginates users, then opens the user role modal", async () => {
		const screen = await render(<UserTable />);

		await expect
			.element(screen.getByText("coach@example.com"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("ADMIN")).toBeInTheDocument();
		expect(screen.getByText("page 1 of 2").length).toBe(2);

		await userEvent.click(
			screen.getByRole("button", { name: "Prev page" }).nth(0),
		);
		expect(mockUseAdminUsersPaginated).toHaveBeenLastCalledWith({
			page: 1,
			pageSize: 10,
			search: undefined,
		});

		await screen.getByPlaceholder("Search users...").fill("coach");

		expect(mockUseAdminUsersPaginated).toHaveBeenLastCalledWith({
			page: 1,
			pageSize: 10,
			search: "coach",
		});

		await userEvent.click(
			screen.getByRole("button", { name: "Next page" }).nth(0),
		);
		expect(mockUseAdminUsersPaginated).toHaveBeenLastCalledWith({
			page: 2,
			pageSize: 10,
			search: "coach",
		});

		await userEvent.click(
			screen.getByRole("button", { name: "Page size 20" }).nth(0),
		);
		expect(mockUseAdminUsersPaginated).toHaveBeenLastCalledWith({
			page: 1,
			pageSize: 20,
			search: "coach",
		});

		await userEvent.click(
			screen.getByRole("button", {
				name: "Edit role for coach@example.com",
			}),
		);
		await expect
			.element(screen.getByText("Role modal: coach@example.com"))
			.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: "Close role modal" }),
		);
		await expect
			.element(screen.getByText("Role modal: coach@example.com"))
			.not.toBeInTheDocument();
	});

	it("shows loading skeletons and empty states when tables have no data", async () => {
		usersSeed = {
			data: undefined,
			isLoading: true,
		} as typeof usersSeed;
		exercisesSeed = {
			data: undefined,
			isLoading: true,
		} as typeof exercisesSeed;
		lookupsSeed = {
			data: undefined,
			isLoading: true,
		} as typeof lookupsSeed;
		mockUseAdminUsersPaginated.mockReturnValue(usersSeed);
		mockUseAdminExercisesPaginated.mockReturnValue(exercisesSeed);
		mockUseAdminLookupPaginated.mockReturnValue(lookupsSeed);

		await render(
			<div>
				<UserTable />
				<ExerciseTable />
				<LookupTable
					title="Equipment"
					singularTitle="Equipment"
					lookupType="equipment"
				/>
			</div>,
		);

		await vi.waitFor(() => {
			expect(
				document.querySelectorAll(".animate-pulse").length,
			).toBeGreaterThan(0);
		});
	});

	it("creates, updates, and deletes lookups from the table controls", async () => {
		const createLookupMutation = vi.fn();
		const updateLookupMutation = vi.fn();
		const deleteLookupMutation = vi.fn();
		mockUseCreateLookup.mockReturnValue({
			mutateAsync: createLookupMutation,
			isPending: false,
		});
		mockUseUpdateLookup.mockReturnValue({
			mutateAsync: updateLookupMutation,
			isPending: false,
		});
		mockUseDeleteLookup.mockReturnValue({
			mutateAsync: deleteLookupMutation,
			isPending: false,
		});

		const screen = await render(
			<LookupTable
				title="Equipment"
				singularTitle="Equipment"
				lookupType="equipment"
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Prev page" }).nth(0),
		);
		expect(mockUseAdminLookupPaginated).toHaveBeenLastCalledWith(
			"equipment",
			expect.objectContaining({
				page: 1,
				pageSize: 10,
			}),
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Add Equipment" }),
		);
		await expect
			.element(screen.getByText("Create Equipment"))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Submit lookup form" }),
		);
		await vi.waitFor(() => {
			expect(createLookupMutation).toHaveBeenCalledWith({
				type: "equipment",
				name: "Equipment created",
			});
		});

		await userEvent.click(
			screen.getByRole("button", { name: "Edit Equipment Rope" }),
		);
		await expect
			.element(screen.getByText("Edit Equipment: Rope"))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Submit lookup form" }),
		);
		await vi.waitFor(() => {
			expect(updateLookupMutation).toHaveBeenCalledWith({
				id: "lookup-1",
				type: "equipment",
				name: "Rope updated",
			});
		});

		await userEvent.click(
			screen.getByRole("button", { name: "Delete Equipment Rope" }),
		);
		await expect
			.element(screen.getByText("Delete Equipment: Rope"))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Confirm delete lookup" }),
		);
		await vi.waitFor(() => {
			expect(deleteLookupMutation).toHaveBeenCalledWith({
				id: "lookup-1",
				type: "equipment",
			});
		});
	});

	it("shows exercise details and forwards delete actions", async () => {
		const deleteExerciseMutation = vi.fn();
		mockUseAdminDeleteExercise.mockReturnValue({
			mutate: deleteExerciseMutation,
		});

		const screen = await render(<ExerciseTable />);

		await expect.element(screen.getByText("Bench Press")).toBeInTheDocument();
		await expect.element(screen.getByText("Barbell")).toBeInTheDocument();
		await expect.element(screen.getByText("Pectorals")).toBeInTheDocument();
		await expect.element(screen.getByText("Air Squat")).toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Prev page" }).nth(0),
		);
		expect(mockUseAdminExercisesPaginated).toHaveBeenLastCalledWith({
			page: 1,
			pageSize: 10,
			search: undefined,
		});

		await userEvent.click(screen.getByRole("button", { name: "Add Exercise" }));
		await expect
			.element(screen.getByText("Create exercise"))
			.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: "Close exercise form" }),
		);
		await expect
			.element(screen.getByText("Create exercise"))
			.not.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Delete exercise Bench Press" }),
		);
		await expect
			.element(screen.getByText("Delete exercise: Bench Press"))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Confirm delete exercise" }),
		);
		expect(deleteExerciseMutation).toHaveBeenCalledWith("exercise-1");
	});

	it("renders auth provider configuration status from the API", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			Response.json({
				google: true,
				github: false,
				discord: true,
				oidc: false,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const screen = await render(<AuthProvidersTable />);

		await vi.waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith("/api/auth/providers");
		});
		await expect
			.element(screen.getByText("Google").first())
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("GitHub").first())
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Discord").first())
			.toBeInTheDocument();
		await vi.waitFor(() => {
			expect(
				[...document.querySelectorAll("span")].filter(
					(el) => el.textContent?.trim() === "Configured",
				).length,
			).toBe(2);
		});
		expect(
			[...document.querySelectorAll("span")].filter(
				(el) => el.textContent?.trim() === "Not configured",
			).length,
		).toBe(2);
	});

	it("uses a custom OIDC provider label when the environment provides one", async () => {
		vi.stubEnv("VITE_AUTH_OIDC_PROVIDER_NAME", "Acme SSO");

		const fetchMock = vi.fn().mockResolvedValue(
			Response.json({
				google: false,
				github: false,
				discord: false,
				oidc: true,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const screen = await render(<AuthProvidersTable />);

		await vi.waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith("/api/auth/providers");
		});
		await expect.element(screen.getByText("Acme SSO")).toBeInTheDocument();
		await expect
			.element(
				screen.getByText(
					"Requires: AUTH_OIDC_CLIENT_ID, AUTH_OIDC_CLIENT_SECRET, AUTH_OIDC_ISSUER",
				),
			)
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Configured").first())
			.toBeInTheDocument();

		vi.unstubAllEnvs();
	});

	it("keeps auth providers visible when the status request fails", async () => {
		const fetchMock = vi.fn().mockRejectedValueOnce(new Error("network down"));
		vi.stubGlobal("fetch", fetchMock);

		const screen = await render(<AuthProvidersTable />);

		await vi.waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith("/api/auth/providers");
		});

		await expect
			.element(screen.getByText("Google").first())
			.toBeInTheDocument();
		expect(
			[...document.querySelectorAll("span")].filter(
				(el) => el.textContent?.trim() === "Not configured",
			).length,
		).toBe(4);
	});

	it("ignores provider status updates after the component unmounts", async () => {
		let resolveResponse: (response: Response) => void = () => undefined;
		const fetchMock = vi.fn(
			() =>
				new Promise<Response>((resolve) => {
					resolveResponse = resolve;
				}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const { unmount } = await render(<AuthProvidersTable />);
		unmount();

		resolveResponse(
			Response.json({
				google: true,
				github: true,
				discord: true,
				oidc: true,
			}),
		);

		await vi.waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith("/api/auth/providers");
		});
	});

	it("shows empty lookup results when the search returns no items", async () => {
		lookupsSeed = {
			data: {
				items: [],
				total: 0,
				page: 1,
				pageSize: 10,
			},
			isLoading: false,
		};
		mockUseAdminLookupPaginated.mockReturnValue(lookupsSeed);

		const screen = await render(
			<LookupTable
				title="Equipment"
				singularTitle="Equipment"
				lookupType="equipment"
			/>,
		);

		await screen.getByPlaceholder("Search equipment...").fill("rope");

		await expect
			.element(screen.getByText('No equipment found matching "rope"'))
			.toBeInTheDocument();
	});

	it("shows empty exercise search results when no exercises match", async () => {
		exercisesSeed = {
			data: {
				items: [],
				total: 0,
				page: 1,
				pageSize: 10,
			},
			isLoading: false,
		};
		mockUseAdminExercisesPaginated.mockReturnValue(exercisesSeed);

		const screen = await render(<ExerciseTable />);

		await screen.getByPlaceholder("Search exercises...").fill("rope");

		await expect
			.element(screen.getByText('No exercises found matching "rope"'))
			.toBeInTheDocument();
	});

	it("updates exercise search and pagination controls", async () => {
		exercisesSeed = {
			data: {
				items: [
					{
						id: "exercise-1",
						name: "Bench Press",
						level: "beginner",
						equipment: { id: "equipment-1", name: "Barbell" },
						category: { id: "category-1", name: "Chest" },
						primaryMuscles: [{ id: "muscle-1", name: "Pectorals" }],
						secondaryMuscles: [],
					},
				],
				total: 25,
				page: 1,
				pageSize: 10,
			},
			isLoading: false,
		};
		mockUseAdminExercisesPaginated.mockReturnValue(exercisesSeed);

		const screen = await render(<ExerciseTable />);

		await screen.getByPlaceholder("Search exercises...").fill("press");

		expect(mockUseAdminExercisesPaginated).toHaveBeenLastCalledWith({
			page: 1,
			pageSize: 10,
			search: "press",
		});

		await userEvent.click(
			screen.getByRole("button", { name: "Next page" }).nth(0),
		);

		expect(mockUseAdminExercisesPaginated).toHaveBeenLastCalledWith({
			page: 2,
			pageSize: 10,
			search: "press",
		});

		await userEvent.click(
			screen.getByRole("button", { name: "Page size 20" }).nth(0),
		);

		expect(mockUseAdminExercisesPaginated).toHaveBeenLastCalledWith({
			page: 1,
			pageSize: 20,
			search: "press",
		});
	});
});
