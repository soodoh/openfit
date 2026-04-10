import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
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
		const screen = await render(<GymFormModal open onClose={vi.fn()} />);

		await screen.getByLabelText("Gym Name").fill("Home Gym");
		await userEvent.click(screen.getByRole("button", { name: "Save Gym" }));

		await expect
			.element(screen.getByText("Select at least one piece of equipment"))
			.toBeInTheDocument();
		expect(mockCreateGym).not.toHaveBeenCalled();
	});

	it("submits the create flow and closes the modal", async () => {
		const onClose = vi.fn();

		const screen = await render(<GymFormModal open onClose={onClose} />);

		await screen.getByLabelText("Gym Name").fill("Garage Gym");
		await userEvent.click(
			screen.getByRole("button", { name: "Select equipment" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Save Gym" }));

		await vi.waitFor(() => {
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

		const screen = await render(
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

		await screen.getByLabelText("Gym Name").fill("Garage Gym Revamp");
		await userEvent.click(
			screen.getByRole("button", { name: "Select equipment" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await vi.waitFor(() => {
			expect(mockUpdateGym).toHaveBeenCalledWith({
				id: "gym-1",
				name: "Garage Gym Revamp",
				equipmentIds: ["equipment-1"],
			});
		});
		await expect
			.element(screen.getByText("network failed"))
			.toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("uses the fallback create error message for non-Error failures", async () => {
		mockCreateGym.mockRejectedValueOnce("boom");

		const screen = await render(<GymFormModal open onClose={vi.fn()} />);

		await screen.getByLabelText("Gym Name").fill("Garage Gym");
		await userEvent.click(
			screen.getByRole("button", { name: "Select equipment" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Save Gym" }));

		await expect
			.element(screen.getByText("Failed to create gym"))
			.toBeInTheDocument();
	});

	it("rejects whitespace-only gym names before create", async () => {
		const screen = await render(<GymFormModal open onClose={vi.fn()} />);

		await screen.getByLabelText("Gym Name").fill("   ");
		await userEvent.click(
			screen.getByRole("button", { name: "Select equipment" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Save Gym" }));

		await expect
			.element(screen.getByText("Gym name is required"))
			.toBeInTheDocument();
		expect(mockCreateGym).not.toHaveBeenCalled();
	});

	it("uses the fallback update error message for non-Error failures", async () => {
		mockUpdateGym.mockRejectedValueOnce("boom");

		const screen = await render(
			<GymFormModal
				open
				onClose={vi.fn()}
				gym={{
					id: "gym-1",
					name: "Garage Gym",
					equipmentIds: ["equipment-2"],
				}}
			/>,
		);

		await userEvent.click(
			screen.getByRole("button", { name: "Select equipment" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

		await expect
			.element(screen.getByText("Failed to update gym"))
			.toBeInTheDocument();
	});

	it("loads existing gym values and closes through the dialog control", async () => {
		const onClose = vi.fn();

		const screen = await render(
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

		await expect
			.element(screen.getByLabelText("Gym Name"))
			.toHaveValue("Garage Gym");
		await expect.element(screen.getByText("equipment-2")).toBeInTheDocument();

		await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
