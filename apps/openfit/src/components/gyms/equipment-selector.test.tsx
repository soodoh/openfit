import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { EquipmentSelector } from "./equipment-selector";

const mockUseEquipment = vi.fn();

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		type,
		...props
	}: {
		children: ReactNode;
		onClick?: () => void;
		type?: "button" | "submit";
		[key: string]: unknown;
	}) => (
		<button type={type ?? "button"} onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

vi.mock("./autocomplete-equipment", () => ({
	AutocompleteEquipment: ({
		onSelect,
	}: {
		onSelect: (equipmentId: string) => void;
	}) => (
		<button type="button" onClick={() => onSelect("equipment-4")}>
			Add equipment
		</button>
	),
}));

vi.mock("@/hooks", () => ({
	useEquipment: (...args: unknown[]) => mockUseEquipment(...args),
}));

describe("EquipmentSelector", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseEquipment.mockReturnValue({
			data: [
				{ id: "equipment-3", name: "Kettlebell" },
				{ id: "equipment-1", name: "Barbell" },
				{ id: "equipment-2", name: "Cable Machine" },
			],
			isLoading: false,
		});
	});

	it("shows loading state while equipment is still being fetched", async () => {
		mockUseEquipment.mockReturnValueOnce({ data: undefined, isLoading: true });

		const screen = await render(
			<EquipmentSelector selectedIds={[]} onSelectionChange={vi.fn()} />,
		);

		await vi.waitFor(() => {
			expect(document.querySelector("svg")).not.toBeNull();
		});
	});

	it("sorts selected equipment and removes items", async () => {
		const onSelectionChange = vi.fn();

		const screen = await render(
			<EquipmentSelector
				selectedIds={["equipment-3", "equipment-1"]}
				onSelectionChange={onSelectionChange}
			/>,
		);

		await expect.element(screen.getByText("Barbell")).toBeInTheDocument();
		await expect.element(screen.getByText("Kettlebell")).toBeInTheDocument();
		await expect
			.element(screen.getAllByText("2 equipment selected")[0])
			.toBeInTheDocument();

		await userEvent.click(
			screen.getByRole("button", { name: "Remove Barbell" }),
		);

		expect(onSelectionChange).toHaveBeenCalledWith(["equipment-3"]);

		await userEvent.click(
			screen.getByRole("button", { name: "Add equipment" }),
		);

		expect(onSelectionChange).toHaveBeenLastCalledWith([
			"equipment-3",
			"equipment-1",
			"equipment-4",
		]);
	});
});
