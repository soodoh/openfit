import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReplaceExerciseModal } from "./replace-exercise-modal";

const mockReplaceExercise = vi.fn();
const mockUseSimilarExercises = vi.fn();

vi.mock("@unpic/react", () => ({
	Image: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		disabled,
		onClick,
		type,
	}: {
		children: ReactNode;
		disabled?: boolean;
		onClick?: () => void;
		type?: "button" | "submit";
		variant?: string;
	}) => (
		<button type={type ?? "button"} disabled={disabled} onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/command", () => ({
	Command: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	CommandEmpty: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandGroup: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	CommandItem: ({
		children,
		onSelect,
	}: {
		children: ReactNode;
		onSelect?: () => void;
	}) => (
		<button type="button" onClick={onSelect}>
			{children}
		</button>
	),
	CommandList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
		open ? <div>{children}</div> : null,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<p>{children}</p>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuItem: ({
		children,
		onClick,
	}: {
		children: ReactNode;
		onClick?: () => void;
	}) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
		<>{children}</>
	),
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({
		value,
		onChange,
		placeholder,
	}: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input placeholder={placeholder} value={value} onChange={onChange} />
	),
}));

vi.mock("@/hooks", () => ({
	useGym: () => ({
		data: { equipmentIds: ["equipment-1"] },
	}),
	useGyms: () => ({
		data: [{ id: "gym-1", name: "Home Gym" }],
	}),
	useReplaceExercise: () => ({
		mutateAsync: mockReplaceExercise,
	}),
	useSimilarExercises: (...args: unknown[]) => mockUseSimilarExercises(...args),
	useUserProfile: () => ({
		data: { defaultGymId: "gym-1" },
	}),
}));

vi.mock("@/lib/use-exercise-lookups", () => ({
	useExerciseLookups: () => ({
		getMuscleGroupNames: (ids: string[] | undefined) =>
			(ids ?? []).map((id) => id.toUpperCase()),
	}),
}));

describe("ReplaceExerciseModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockReplaceExercise.mockResolvedValue(undefined);
		mockUseSimilarExercises.mockReturnValue({
			data: [
				{
					id: "exercise-2",
					name: "Incline Press",
					primaryMuscleIds: ["chest"],
				},
				{
					id: "exercise-3",
					name: "Dumbbell Fly",
					primaryMuscleIds: ["chest"],
				},
			],
			isLoading: false,
		});
	});

	it("defaults to the profile gym, allows switching filters, and replaces the selected exercise", async () => {
		const onClose = vi.fn();

		render(
			<ReplaceExerciseModal
				open
				onClose={onClose}
				currentExercise={{
					id: "exercise-1",
					name: "Bench Press",
					primaryMuscleIds: ["chest"],
				}}
				setGroupId="set-group-1"
			/>,
		);

		expect(
			screen.getAllByRole("button", { name: "Home Gym" })[0],
		).toBeInTheDocument();
		expect(mockUseSimilarExercises).toHaveBeenCalledWith(
			["chest"],
			expect.objectContaining({
				equipmentIds: ["equipment-1"],
				excludeExerciseId: "exercise-1",
			}),
		);

		fireEvent.click(screen.getByRole("button", { name: "All Equipment" }));

		await waitFor(() => {
			expect(mockUseSimilarExercises).toHaveBeenLastCalledWith(
				["chest"],
				expect.objectContaining({
					equipmentIds: undefined,
				}),
			);
		});

		fireEvent.click(screen.getByRole("button", { name: /Incline Press/i }));
		fireEvent.click(screen.getByRole("button", { name: "Replace" }));

		await waitFor(() => {
			expect(mockReplaceExercise).toHaveBeenCalledWith({
				id: "set-group-1",
				exerciseId: "exercise-2",
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
