import { userEvent } from "@vitest/browser/context";
import {
	cloneElement,
	createContext,
	isValidElement,
	type ReactNode,
	useContext,
} from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { WorkoutSessionWithData } from "@/lib/types";
import { EditNamePopover } from "./edit-name-popover";

const mockUpdateSession = vi.fn();

type PopoverContextValue = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

vi.mock("@/hooks", () => ({
	useUpdateSession: () => ({
		mutateAsync: mockUpdateSession,
	}),
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({
		children,
		open,
		onOpenChange,
	}: {
		children: ReactNode;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}) => (
		<PopoverContext.Provider value={{ open, onOpenChange }}>
			{children}
		</PopoverContext.Provider>
	),
	PopoverTrigger: ({ children }: { children: ReactNode }) => {
		const context = useContext(PopoverContext);
		if (!context || !isValidElement(children)) {
			return <>{children}</>;
		}

		return cloneElement(children, {
			onClick: () => context.onOpenChange(true),
		});
	},
	PopoverContent: ({ children }: { children: ReactNode }) => {
		const context = useContext(PopoverContext);
		return context?.open ? <div>{children}</div> : null;
	},
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		...props
	}: {
		children: ReactNode;
		[key: string]: unknown;
	}) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
	Input: ({
		value,
		onChange,
		id,
		placeholder,
	}: {
		value: string;
		onChange: (event: { target: { value: string } }) => void;
		id?: string;
		placeholder?: string;
	}) => (
		<input
			id={id}
			value={value}
			placeholder={placeholder}
			onChange={(event) => onChange({ target: { value: event.target.value } })}
		/>
	),
}));

vi.mock("@/components/ui/label", () => ({
	Label: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
		<label htmlFor={htmlFor}>{children}</label>
	),
}));

const session = {
	id: "session-1",
	userId: "user-1",
	name: "Upper Body",
	notes: null,
	impression: null,
	startTime: new Date("2026-04-08T08:00:00.000Z"),
	endTime: new Date("2026-04-08T09:00:00.000Z"),
	templateId: null,
	createdAt: new Date("2026-04-08T08:00:00.000Z"),
	updatedAt: new Date("2026-04-08T08:00:00.000Z"),
	setGroups: [],
} satisfies WorkoutSessionWithData;

describe("EditNamePopover", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUpdateSession.mockResolvedValue({});
	});

	it("reopens with the latest session name after closing the popover", async () => {
		const screen = await render(<EditNamePopover session={session} />);

		await userEvent.click(screen.getByRole("button"));
		await expect
			.element(screen.getByLabelText("Session Name"))
			.toHaveValue("Upper Body");

		await screen.getByLabelText("Session Name").fill("Updated Name");
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		await expect
			.element(screen.getByLabelText("Session Name"))
			.not.toBeInTheDocument();

		screen.rerender(
			<EditNamePopover session={{ ...session, name: "Push Day" }} />,
		);
		await userEvent.click(screen.getByRole("button"));

		await expect
			.element(screen.getByLabelText("Session Name"))
			.toHaveValue("Push Day");

		await userEvent.click(screen.getByRole("button", { name: "Save" }));

		await vi.waitFor(() => {
			expect(mockUpdateSession).toHaveBeenCalledWith({
				id: "session-1",
				name: "Push Day",
			});
		});
	});
});
