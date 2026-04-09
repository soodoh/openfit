import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GymFormModal } from "./gym-form-modal";

const mockCreateGym = vi.fn();
const mockUpdateGym = vi.fn();

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
	}) => (
		<button type={type ?? "button"} disabled={disabled} onClick={onClick}>
			{children}
		</button>
	),
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
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({
		value,
		onChange,
		placeholder,
		id,
	}: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input
			id={id}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
		/>
	),
}));

vi.mock("@/components/ui/label", () => ({
	Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
		<label htmlFor={htmlFor}>{children}</label>
	),
}));

vi.mock("./equipment-selector", () => ({
	EquipmentSelector: ({
		onSelectionChange,
		selectedIds,
	}: {
		onSelectionChange: (ids: string[]) => void;
		selectedIds: string[];
	}) => (
		<div>
			<span>{selectedIds.join(",")}</span>
			<button type="button" onClick={() => onSelectionChange(["equipment-1"])}>
				Select equipment
			</button>
			<button type="button" onClick={() => onSelectionChange([])}>
				Clear equipment
			</button>
		</div>
	),
}));

vi.mock("@/hooks", () => ({
	useCreateGym: () => ({
		mutateAsync: mockCreateGym,
	}),
	useUpdateGym: () => ({
		mutateAsync: mockUpdateGym,
	}),
}));

describe("GymFormModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateGym.mockResolvedValue(undefined);
		mockUpdateGym.mockResolvedValue(undefined);
	});

	it("shows validation errors before a submit can proceed", async () => {
		render(<GymFormModal open onClose={vi.fn()} />);

		fireEvent.change(screen.getByLabelText("Gym Name"), {
			target: { value: "Home Gym" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save Gym" }));

		expect(
			await screen.findByText("Select at least one piece of equipment"),
		).toBeInTheDocument();
		expect(mockCreateGym).not.toHaveBeenCalled();
	});

	it("submits the create flow and closes the modal", async () => {
		const onClose = vi.fn();

		render(<GymFormModal open onClose={onClose} />);

		fireEvent.change(screen.getByLabelText("Gym Name"), {
			target: { value: "Garage Gym" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Select equipment" }));
		fireEvent.click(screen.getByRole("button", { name: "Save Gym" }));

		await waitFor(() => {
			expect(mockCreateGym).toHaveBeenCalledWith({
				name: "Garage Gym",
				equipmentIds: ["equipment-1"],
			});
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("submits the update flow and shows mutation errors", async () => {
		mockUpdateGym.mockRejectedValueOnce(new Error("network failed"));
		const onClose = vi.fn();

		render(
			<GymFormModal
				open
				onClose={onClose}
				gym={{
					id: "gym-1",
					name: "Garage Gym",
					equipmentIds: ["equipment-2"],
				}}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Gym Name"), {
			target: { value: "Garage Gym Revamp" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Select equipment" }));
		fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await waitFor(() => {
			expect(mockUpdateGym).toHaveBeenCalledWith({
				id: "gym-1",
				name: "Garage Gym Revamp",
				equipmentIds: ["equipment-1"],
			});
		});
		expect(await screen.findByText("network failed")).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("uses the fallback create error message for non-Error failures", async () => {
		mockCreateGym.mockRejectedValueOnce("boom");

		render(<GymFormModal open onClose={vi.fn()} />);

		fireEvent.change(screen.getByLabelText("Gym Name"), {
			target: { value: "Garage Gym" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Select equipment" }));
		fireEvent.click(screen.getByRole("button", { name: "Save Gym" }));

		expect(await screen.findByText("Failed to create gym")).toBeInTheDocument();
	});
});
