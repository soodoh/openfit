import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
		mockUseAdminUsersPaginated.mockReturnValue({
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
		});
		mockUseAdminExercisesPaginated.mockReturnValue({
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
				total: 1,
				page: 1,
				pageSize: 10,
			},
			isLoading: false,
		});
		mockUseAdminLookupPaginated.mockReturnValue({
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
		});
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

	it("filters and paginates users, then opens the user role modal", () => {
		render(<UserTable />);

		expect(screen.getByText("coach@example.com")).toBeInTheDocument();
		expect(screen.getByText("ADMIN")).toBeInTheDocument();
		expect(screen.getAllByText("page 1 of 2")).toHaveLength(2);

		fireEvent.change(screen.getByPlaceholderText("Search users..."), {
			target: { value: "coach" },
		});

		expect(mockUseAdminUsersPaginated).toHaveBeenLastCalledWith({
			page: 1,
			pageSize: 10,
			search: "coach",
		});

		fireEvent.click(screen.getAllByRole("button", { name: "Next page" })[0]);
		expect(mockUseAdminUsersPaginated).toHaveBeenLastCalledWith({
			page: 2,
			pageSize: 10,
			search: "coach",
		});

		fireEvent.click(
			screen
				.getByText("coach@example.com")
				.closest("div")
				?.parentElement?.parentElement?.querySelector(
					"button",
				) as HTMLButtonElement,
		);
		expect(
			screen.getByText("Role modal: coach@example.com"),
		).toBeInTheDocument();
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

		render(
			<LookupTable
				title="Equipment"
				singularTitle="Equipment"
				lookupType="equipment"
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Add Equipment" }));
		expect(screen.getByText("Create Equipment")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Submit lookup form" }));
		await waitFor(() => {
			expect(createLookupMutation).toHaveBeenCalledWith({
				type: "equipment",
				name: "Equipment created",
			});
		});

		fireEvent.click(
			screen
				.getByText("Rope")
				.parentElement?.querySelectorAll("button")[0] as HTMLButtonElement,
		);
		expect(screen.getByText("Edit Equipment: Rope")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Submit lookup form" }));
		await waitFor(() => {
			expect(updateLookupMutation).toHaveBeenCalledWith({
				id: "lookup-1",
				type: "equipment",
				name: "Rope updated",
			});
		});

		fireEvent.click(
			screen
				.getByText("Rope")
				.parentElement?.querySelectorAll("button")[1] as HTMLButtonElement,
		);
		expect(screen.getByText("Delete Equipment: Rope")).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: "Confirm delete lookup" }),
		);
		await waitFor(() => {
			expect(deleteLookupMutation).toHaveBeenCalledWith({
				id: "lookup-1",
				type: "equipment",
			});
		});
	});

	it("shows exercise details and forwards delete actions", () => {
		const deleteExerciseMutation = vi.fn();
		mockUseAdminDeleteExercise.mockReturnValue({
			mutate: deleteExerciseMutation,
		});

		render(<ExerciseTable />);

		expect(screen.getByText("Bench Press")).toBeInTheDocument();
		expect(screen.getByText("Barbell")).toBeInTheDocument();
		expect(screen.getByText("Pectorals")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Add Exercise" }));
		expect(screen.getByText("Create exercise")).toBeInTheDocument();

		fireEvent.click(
			screen
				.getByText("Bench Press")
				.parentElement?.parentElement?.parentElement?.querySelectorAll(
					"button",
				)[1] as HTMLButtonElement,
		);
		expect(
			screen.getByText("Delete exercise: Bench Press"),
		).toBeInTheDocument();

		fireEvent.click(
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

		render(<AuthProvidersTable />);

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith("/api/auth/providers");
			expect(screen.getByText("Google")).toBeInTheDocument();
			expect(screen.getByText("GitHub")).toBeInTheDocument();
			expect(screen.getByText("Discord")).toBeInTheDocument();
			expect(screen.getAllByText("Configured")).toHaveLength(2);
			expect(screen.getAllByText("Not configured")).toHaveLength(2);
		});
	});
});
