import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { Gym, Units, UserProfile } from "@/lib/types";
import { ProfileModal } from "./profile-modal";

const mockSetTheme = vi.fn();
const mockUpdateProfile = vi.fn();
const mockCreateGym = vi.fn();
const mockUpdateGym = vi.fn();
const mockUseUserProfile = vi.fn();
const mockUseGyms = vi.fn();
const mockUseUnits = vi.fn();

const mockProfile: UserProfile = {
	id: "profile-1",
	userId: "user-1",
	role: "USER",
	defaultGymId: "gym-1",
	defaultWeightUnitId: "weight-lb",
	defaultRepetitionUnitId: "rep-reps",
	theme: "system",
	createdAt: new Date("2026-04-01T00:00:00.000Z"),
	updatedAt: new Date("2026-04-01T00:00:00.000Z"),
};

const mockUnits: Units = {
	repetitionUnits: [{ id: "rep-reps", name: "Repetitions" }],
	weightUnits: [{ id: "weight-lb", name: "lb" }],
};

const baseGyms: Gym[] = [
	{
		id: "gym-1",
		userId: "user-1",
		name: "Home Gym",
		equipmentIds: ["rack"],
		createdAt: new Date("2026-04-01T00:00:00.000Z"),
		updatedAt: new Date("2026-04-01T00:00:00.000Z"),
	},
];
let mockGyms: Gym[] = [...baseGyms];

vi.mock("next-themes", () => ({
	useTheme: () => ({
		setTheme: mockSetTheme,
	}),
}));

vi.mock("@/hooks", () => ({
	useUserProfile: (...args: unknown[]) => mockUseUserProfile(...args),
	useGyms: (...args: unknown[]) => mockUseGyms(...args),
	useUnits: (...args: unknown[]) => mockUseUnits(...args),
	useUpdateUserProfile: () => ({
		mutateAsync: mockUpdateProfile,
	}),
	useCreateGym: () => ({
		mutateAsync: mockCreateGym,
	}),
	useUpdateGym: () => ({
		mutateAsync: mockUpdateGym,
	}),
}));

vi.mock("@/components/gyms/delete-gym-modal", () => ({
	DeleteGymModal: ({
		gym,
		onClose,
	}: {
		gym?: { name: string };
		onClose: () => void;
	}) =>
		gym ? (
			<div>
				Delete modal for {gym.name}
				<button type="button" onClick={onClose}>
					Close delete modal
				</button>
			</div>
		) : null,
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({
		children,
		open,
		onOpenChange,
	}: {
		children: ReactNode;
		open: boolean;
		onOpenChange?: () => void;
	}) =>
		open ? (
			<div>
				<button type="button" onClick={onOpenChange}>
					Close dialog
				</button>
				{children}
			</div>
		) : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<p>{children}</p>
	),
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/gyms/gym-card", () => ({
	GymCard: ({
		gym,
		onEdit,
		onDelete,
	}: {
		gym: Gym;
		onEdit: () => void;
		onDelete: () => void;
	}) => (
		<div>
			<span>{gym.name}</span>
			<button type="button" onClick={onEdit}>
				Edit {gym.name}
			</button>
			<button type="button" onClick={onDelete}>
				Delete {gym.name}
			</button>
		</div>
	),
}));

vi.mock("@/components/gyms/equipment-selector", () => ({
	EquipmentSelector: ({
		selectedIds,
		onSelectionChange,
	}: {
		selectedIds: string[];
		onSelectionChange: (ids: string[]) => void;
	}) => (
		<div>
			<div>Selected equipment: {selectedIds.join(",") || "none"}</div>
			<button type="button" onClick={() => onSelectionChange(["bench"])}>
				Choose bench
			</button>
		</div>
	),
}));

describe("ProfileModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGyms = [...baseGyms];
		mockUseUserProfile.mockReturnValue({
			data: mockProfile,
			isLoading: false,
		});
		mockUseGyms.mockReturnValue({
			data: mockGyms,
			isLoading: false,
		});
		mockUseUnits.mockReturnValue({
			data: mockUnits,
			isLoading: false,
		});
		mockUpdateProfile.mockResolvedValue({});
		mockCreateGym.mockResolvedValue({});
		mockUpdateGym.mockResolvedValue({});
	});

	it("resets the gym draft when switching away from the equipment tab", async () => {
		const screen = await render(<ProfileModal open onClose={vi.fn()} />);

		await userEvent.click(screen.getByRole("tab", { name: "Equipment" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Edit Home Gym" }),
		);

		const gymNameInput = screen.getByLabelText("Gym Name");
		await expect.element(gymNameInput).toHaveValue("Home Gym");
		await expect
			.element(screen.getByText("Selected equipment: rack"))
			.toBeInTheDocument();

		await gymNameInput.fill("Changed Gym Name");
		await userEvent.click(screen.getByRole("button", { name: "Choose bench" }));

		await expect
			.element(screen.getByLabelText("Gym Name"))
			.toHaveValue("Changed Gym Name");
		await expect
			.element(screen.getByText("Selected equipment: bench"))
			.toBeInTheDocument();

		await userEvent.click(screen.getByRole("tab", { name: "Settings" }));
		await userEvent.click(screen.getByRole("tab", { name: "Equipment" }));

		await expect
			.element(screen.getByLabelText("Gym Name"))
			.not.toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Add Gym" }));

		await expect
			.element(screen.getByRole("heading", { name: "Add New Gym" }))
			.toBeInTheDocument();
		await expect.element(screen.getByLabelText("Gym Name")).toHaveValue("");
		await expect
			.element(screen.getByText("Selected equipment: none"))
			.toBeInTheDocument();
	});

	it("shows empty gym state and opens add form from first gym CTA", async () => {
		mockGyms = [];
		mockUseGyms.mockReturnValue({
			data: mockGyms,
			isLoading: false,
		});

		const screen = await render(<ProfileModal open onClose={vi.fn()} />);

		await userEvent.click(screen.getByRole("tab", { name: "Equipment" }));

		await expect
			.element(screen.getByText("No gyms created yet"))
			.toBeInTheDocument();
		await expect
			.element(
				screen.getByText(
					/create a gym to filter exercises by available equipment/i,
				),
			)
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Add Your First Gym" }),
		);

		await expect
			.element(screen.getByRole("heading", { name: "Add New Gym" }))
			.toBeInTheDocument();
		await expect.element(screen.getByLabelText("Gym Name")).toHaveValue("");
	});

	it("shows a loading indicator while the settings data is still loading", async () => {
		mockUseUserProfile.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		mockUseUnits.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		render(<ProfileModal open onClose={vi.fn()} />);

		await vi.waitFor(() => {
			expect(document.querySelector(".animate-spin")).not.toBeNull();
		});
	});

	it("shows a loading indicator for gym data on the equipment tab", async () => {
		mockUseGyms.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		const screen = await render(<ProfileModal open onClose={vi.fn()} />);

		await userEvent.click(screen.getByRole("tab", { name: "Equipment" }));

		await vi.waitFor(() => {
			expect(document.querySelector(".animate-spin")).not.toBeNull();
		});
	});

	it("opens the delete gym modal from the gym list", async () => {
		const screen = await render(<ProfileModal open onClose={vi.fn()} />);

		await userEvent.click(screen.getByRole("tab", { name: "Equipment" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Delete Home Gym" }),
		);

		await expect
			.element(screen.getByText("Delete modal for Home Gym"))
			.toBeInTheDocument();
	});

	it("closes through the dialog and delete modal controls", async () => {
		const onClose = vi.fn();

		const screen = await render(<ProfileModal open onClose={onClose} />);

		await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));
		expect(onClose).toHaveBeenCalledTimes(1);

		await userEvent.click(screen.getByRole("tab", { name: "Equipment" }));
		await userEvent.click(
			screen.getByRole("button", { name: "Delete Home Gym" }),
		);
		await expect
			.element(screen.getByText("Delete modal for Home Gym"))
			.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", { name: "Close delete modal" }),
		);
		await expect
			.element(screen.getByText("Delete modal for Home Gym"))
			.not.toBeInTheDocument();
	});
});
