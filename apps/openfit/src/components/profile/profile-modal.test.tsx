import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
	DeleteGymModal: ({ gym }: { gym?: { name: string } }) =>
		gym ? <div>Delete modal for {gym.name}</div> : null,
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

	it("resets the gym draft when switching away from the equipment tab", () => {
		render(<ProfileModal open onClose={vi.fn()} />);

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Equipment" }));
		fireEvent.click(screen.getByRole("button", { name: "Edit Home Gym" }));

		const gymNameInput = screen.getByLabelText("Gym Name");
		expect(gymNameInput).toHaveValue("Home Gym");
		expect(screen.getByText("Selected equipment: rack")).toBeInTheDocument();

		fireEvent.change(gymNameInput, { target: { value: "Changed Gym Name" } });
		fireEvent.click(screen.getByRole("button", { name: "Choose bench" }));

		expect(screen.getByLabelText("Gym Name")).toHaveValue("Changed Gym Name");
		expect(screen.getByText("Selected equipment: bench")).toBeInTheDocument();

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Settings" }));
		fireEvent.mouseDown(screen.getByRole("tab", { name: "Equipment" }));

		expect(screen.queryByLabelText("Gym Name")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Add Gym" }));

		expect(
			screen.getByRole("heading", { name: "Add New Gym" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Gym Name")).toHaveValue("");
		expect(screen.getByText("Selected equipment: none")).toBeInTheDocument();
	});

	it("shows empty gym state and opens add form from first gym CTA", () => {
		mockGyms = [];
		mockUseGyms.mockReturnValue({
			data: mockGyms,
			isLoading: false,
		});

		render(<ProfileModal open onClose={vi.fn()} />);

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Equipment" }));

		expect(screen.getByText("No gyms created yet")).toBeInTheDocument();
		expect(
			screen.getByText(
				/create a gym to filter exercises by available equipment/i,
			),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Add Your First Gym" }));

		expect(
			screen.getByRole("heading", { name: "Add New Gym" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Gym Name")).toHaveValue("");
	});

	it("shows a loading indicator while the settings data is still loading", () => {
		mockUseUserProfile.mockReturnValue({
			data: undefined,
			isLoading: true,
		});
		mockUseUnits.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		render(<ProfileModal open onClose={vi.fn()} />);

		expect(document.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("shows a loading indicator for gym data on the equipment tab", () => {
		mockUseGyms.mockReturnValue({
			data: undefined,
			isLoading: true,
		});

		render(<ProfileModal open onClose={vi.fn()} />);

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Equipment" }));

		expect(document.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("opens the delete gym modal from the gym list", () => {
		render(<ProfileModal open onClose={vi.fn()} />);

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Equipment" }));
		fireEvent.click(screen.getByRole("button", { name: "Delete Home Gym" }));

		expect(screen.getByText("Delete modal for Home Gym")).toBeInTheDocument();
	});
});
