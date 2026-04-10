import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ReplaceExerciseModal } from "./replace-exercise-modal";

const mockReplaceExercise = vi.fn();
const mockUseSimilarExercises = vi.fn();
const mockUseGym = vi.fn();
const mockUseGyms = vi.fn();
const mockUseUserProfile = vi.fn();

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
	useGym: (...args: unknown[]) => mockUseGym(...args),
	useGyms: (...args: unknown[]) => mockUseGyms(...args),
	useReplaceExercise: () => ({
		mutateAsync: mockReplaceExercise,
	}),
	useSimilarExercises: (...args: unknown[]) => mockUseSimilarExercises(...args),
	useUserProfile: (...args: unknown[]) => mockUseUserProfile(...args),
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
		mockUseGym.mockReturnValue({
			data: { equipmentIds: ["equipment-1"] },
		});
		mockUseGyms.mockReturnValue({
			data: [{ id: "gym-1", name: "Home Gym" }],
		});
		mockUseUserProfile.mockReturnValue({
			data: { defaultGymId: "gym-1" },
		});
		mockReplaceExercise.mockResolvedValue(undefined);
		mockUseSimilarExercises.mockReturnValue({
			data: [
				{
					id: "exercise-2",
					name: "Incline Press",
					primaryMuscleIds: ["chest"],
					imageUrl: "/incline.jpg",
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

		const screen = await render(
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

		await expect
			.element(screen.getAllByRole("button", { name: "Home Gym" })[0])
			.toBeInTheDocument();
		expect(mockUseSimilarExercises).toHaveBeenCalledWith(
			["chest"],
			expect.objectContaining({
				equipmentIds: ["equipment-1"],
				excludeExerciseId: "exercise-1",
			}),
		);

		await userEvent.click(
			screen.getByRole("button", { name: "All Equipment" }),
		);

		await vi.waitFor(() => {
			expect(mockUseSimilarExercises).toHaveBeenLastCalledWith(
				["chest"],
				expect.objectContaining({
					equipmentIds: undefined,
				}),
			);
		});

		await userEvent.click(
			screen.getByRole("button", { name: /Incline Press/i }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Replace" }));

		await vi.waitFor(() => {
			expect(mockReplaceExercise).toHaveBeenCalledWith({
				id: "set-group-1",
				exerciseId: "exercise-2",
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("falls back to All when the user has no default gym", async () => {
		mockUseUserProfile.mockReturnValue({ data: { defaultGymId: undefined } });
		mockUseGyms.mockReturnValue({ data: [] });
		mockUseGym.mockReturnValue({ data: undefined });

		const screen = await render(
			<ReplaceExerciseModal
				open
				onClose={vi.fn()}
				currentExercise={{
					id: "exercise-1",
					name: "Bench Press",
					primaryMuscleIds: ["chest"],
				}}
				setGroupId="set-group-1"
			/>,
		);

		await expect
			.element(screen.getByRole("button", { name: "All" }))
			.toBeInTheDocument();
		expect(mockUseSimilarExercises).toHaveBeenCalledWith(
			["chest"],
			expect.objectContaining({
				equipmentIds: undefined,
				excludeExerciseId: "exercise-1",
			}),
		);
	});

	it("resets search state on reopen and keeps replace disabled until a selection is made", async () => {
		const onClose = vi.fn();

		const screen = await render(
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

		await expect
			.element(screen.getByRole("button", { name: "Replace" }))
			.toBeDisabled();

		await userEvent.click(
			screen.getByRole("button", { name: /Incline Press/i }),
		);
		await expect
			.element(screen.getByRole("button", { name: "Replace" }))
			.not.toBeDisabled();

		await userEvent.click(screen.getByRole("button", { name: "Replace" }));
		await vi.waitFor(() => {
			expect(mockReplaceExercise).toHaveBeenCalledWith({
				id: "set-group-1",
				exerciseId: "exercise-2",
			});
		});

		screen.rerender(
			<ReplaceExerciseModal
				open={false}
				onClose={onClose}
				currentExercise={{
					id: "exercise-1",
					name: "Bench Press",
					primaryMuscleIds: ["chest"],
				}}
				setGroupId="set-group-1"
			/>,
		);
		screen.rerender(
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

		await expect
			.element(screen.getByPlaceholderText("Search exercises..."))
			.toHaveValue("");
		await expect
			.element(screen.getByRole("button", { name: "Home Gym" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Replace" }))
			.toBeDisabled();
	});

	it("shows the selected exercise thumbnail and disables the action while replacing", async () => {
		let resolveReplace: (() => void) | undefined;
		mockReplaceExercise.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					resolveReplace = resolve;
				}),
		);

		const screen = await render(
			<ReplaceExerciseModal
				open
				onClose={vi.fn()}
				currentExercise={{
					id: "exercise-1",
					name: "Bench Press",
					primaryMuscleIds: ["chest"],
				}}
				setGroupId="set-group-1"
			/>,
		);

		await expect
			.element(screen.getByRole("img", { name: "Incline Press thumbnail" }))
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: /Incline Press/i }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Replace" }));

		await expect
			.element(screen.getByRole("button", { name: "Replace" }))
			.toBeDisabled();

		resolveReplace?.();

		await vi.waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Replace" }).element().disabled,
			).toBe(false);
		});
	});

	it("switches gym filters and closes through the dialog control", async () => {
		const onClose = vi.fn();

		const screen = await render(
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

		await userEvent.click(
			screen.getByRole("button", { name: "All Equipment" }),
		);
		const homeGymButton = screen.getByRole("button", { name: "Home Gym" });
		await userEvent.click(homeGymButton);

		expect(mockUseSimilarExercises).toHaveBeenLastCalledWith(
			["chest"],
			expect.objectContaining({
				equipmentIds: ["equipment-1"],
			}),
		);

		await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
