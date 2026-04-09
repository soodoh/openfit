import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card";
import {
	CommandDialog,
	CommandInput,
	CommandItem,
	CommandShortcut,
} from "./command";
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioItem,
	DropdownMenuShortcut,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "./dropdown-menu";
import { Pagination } from "./pagination";
import { PopoverContent } from "./popover";
import {
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "./sheet";

vi.mock("@/components/ui/select", () => ({
	Select: ({
		children,
		value,
		onValueChange,
	}: {
		children: ReactNode;
		value: string;
		onValueChange: (value: string) => void;
	}) => (
		<div>
			<select
				aria-label="Page size"
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
			>
				{children}
			</select>
		</div>
	),
	SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
	SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
		<option value={value}>{children}</option>
	),
	SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
	SelectValue: () => null,
}));

vi.mock("@radix-ui/react-popover", () => ({
	Anchor: ({ children }: { children: ReactNode }) => <>{children}</>,
	Content: ({
		align,
		className,
		children,
		sideOffset,
		...props
	}: {
		align?: string;
		className?: string;
		children: ReactNode;
		sideOffset?: number;
		[key: string]: unknown;
	}) => (
		<div
			data-align={align}
			data-side-offset={sideOffset}
			className={className}
			{...props}
		>
			{children}
		</div>
	),
	Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
	Root: ({ children }: { children: ReactNode }) => <>{children}</>,
	Trigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@radix-ui/react-dialog", () => ({
	Close: ({ children }: { children: ReactNode }) => (
		<button type="button">{children}</button>
	),
	Content: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	Description: ({ children }: { children: ReactNode }) => <p>{children}</p>,
	Overlay: ({ className }: { className?: string }) => (
		<div className={className} />
	),
	Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
	Root: ({ children }: { children: ReactNode }) => <>{children}</>,
	Title: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
	Trigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@radix-ui/react-dropdown-menu", () => ({
	CheckboxItem: ({
		children,
		className,
		checked,
	}: {
		children: ReactNode;
		className?: string;
		checked?: boolean;
	}) => (
		<div className={className} data-checked={checked}>
			{children}
		</div>
	),
	Content: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	Group: ({ children }: { children: ReactNode }) => <>{children}</>,
	Item: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	ItemIndicator: ({ children }: { children: ReactNode }) => (
		<span>{children}</span>
	),
	Label: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
	RadioGroup: ({ children }: { children: ReactNode }) => <>{children}</>,
	RadioItem: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	Root: ({ children }: { children: ReactNode }) => <>{children}</>,
	Separator: ({ className }: { className?: string }) => (
		<hr className={className} />
	),
	Sub: ({ children }: { children: ReactNode }) => <>{children}</>,
	SubContent: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	SubTrigger: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
	Trigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("cmdk", () => {
	const Command = React.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ className, children, ...props }, ref) => (
		<div ref={ref} className={className} {...props}>
			{children}
		</div>
	));
	const Input = React.forwardRef<
		HTMLInputElement,
		React.InputHTMLAttributes<HTMLInputElement>
	>(({ className, ...props }, ref) => (
		<input ref={ref} className={className} {...props} />
	));
	const List = React.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ className, children, ...props }, ref) => (
		<div ref={ref} className={className} {...props}>
			{children}
		</div>
	));
	const Empty = React.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ className, children, ...props }, ref) => (
		<div ref={ref} className={className} {...props}>
			{children}
		</div>
	));
	const Group = React.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ className, children, ...props }, ref) => (
		<div ref={ref} className={className} {...props}>
			{children}
		</div>
	));
	const Separator = React.forwardRef<
		HTMLHRElement,
		React.HTMLAttributes<HTMLHRElement>
	>(({ className, ...props }, ref) => (
		<hr ref={ref} className={className} {...props} />
	));
	const Item = React.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ className, children, ...props }, ref) => (
		<div ref={ref} className={className} {...props}>
			{children}
		</div>
	));

	Object.assign(Command, {
		Empty,
		Group,
		Input,
		Item,
		List,
		Separator,
	});

	return {
		Command,
	};
});

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children }: { children: ReactNode }) => <>{children}</>,
	DialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}));

describe("shared ui wrappers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the card primitives with custom classes", () => {
		const { container } = render(
			<Card className="custom-card">
				<CardHeader className="custom-header">
					<CardTitle className="custom-title">Title</CardTitle>
					<CardDescription className="custom-description">
						Description
					</CardDescription>
				</CardHeader>
				<CardContent className="custom-content">Body</CardContent>
				<CardFooter className="custom-footer">Footer</CardFooter>
			</Card>,
		);

		expect(screen.getByText("Title")).toHaveClass("custom-title");
		expect(screen.getByText("Description")).toHaveClass("custom-description");
		expect(screen.getByText("Body")).toHaveClass("custom-content");
		expect(screen.getByText("Footer")).toHaveClass("custom-footer");
		expect(container.firstElementChild).toHaveClass("custom-card");
	});

	it("renders pagination controls and page size options", () => {
		const onPageChange = vi.fn();
		const onPrevPage = vi.fn();
		const onNextPage = vi.fn();
		const onPageSizeChange = vi.fn();

		render(
			<Pagination
				currentPage={2}
				totalPages={7}
				startIndex={11}
				endIndex={20}
				totalItems={42}
				pageSize={20}
				onPageChange={onPageChange}
				onPrevPage={onPrevPage}
				onNextPage={onNextPage}
				onPageSizeChange={onPageSizeChange}
			/>,
		);

		expect(screen.getByText("Showing 11-20 of 42")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "2" }));
		expect(onPageChange).toHaveBeenCalledWith(2);
		fireEvent.change(screen.getByLabelText("Page size"), {
			target: { value: "50" },
		});
		expect(onPageSizeChange).toHaveBeenCalledWith(50);
	});

	it("renders the no-results pagination state", () => {
		render(
			<Pagination
				currentPage={1}
				totalPages={1}
				startIndex={0}
				endIndex={0}
				totalItems={0}
				pageSize={10}
				onPageChange={vi.fn()}
				onPrevPage={vi.fn()}
				onNextPage={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("No results")).toBeInTheDocument();
	});

	it("renders popover content through the portal wrapper", () => {
		render(
			<PopoverContent container={document.body} className="custom-popover">
				Popover body
			</PopoverContent>,
		);

		expect(screen.getByText("Popover body")).toHaveClass("custom-popover");
		expect(screen.getByText("Popover body")).toHaveAttribute(
			"data-align",
			"center",
		);
		expect(screen.getByText("Popover body")).toHaveAttribute(
			"data-side-offset",
			"4",
		);
	});

	it("renders sheet content with the requested side and close control", () => {
		const { container } = render(
			<SheetContent side="left" className="custom-sheet">
				<SheetHeader>
					<SheetTitle>Sheet title</SheetTitle>
					<SheetDescription>Sheet description</SheetDescription>
				</SheetHeader>
				<SheetFooter>Actions</SheetFooter>
			</SheetContent>,
		);

		expect(screen.getByText("Sheet title")).toBeInTheDocument();
		expect(screen.getByText("Sheet description")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
		expect(container.querySelector(".custom-sheet")).toBeInTheDocument();
	});

	it("renders dropdown menu item variants and indicators", () => {
		const { container } = render(
			<div>
				<DropdownMenuLabel inset className="custom-label">
					Label
				</DropdownMenuLabel>
				<DropdownMenuItem inset className="custom-item">
					Item
				</DropdownMenuItem>
				<DropdownMenuCheckboxItem checked className="custom-check">
					Checked
				</DropdownMenuCheckboxItem>
				<DropdownMenuRadioItem className="custom-radio">
					Radio
				</DropdownMenuRadioItem>
				<DropdownMenuShortcut className="custom-shortcut">
					⌘K
				</DropdownMenuShortcut>
				<DropdownMenuSubTrigger inset className="custom-sub-trigger">
					Sub trigger
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className="custom-sub-content">
					Sub content
				</DropdownMenuSubContent>
				<DropdownMenuContent className="custom-content">
					Content
				</DropdownMenuContent>
			</div>,
		);

		expect(screen.getByText("Label")).toHaveClass("custom-label");
		expect(screen.getByText("Item")).toHaveClass("custom-item");
		expect(screen.getByText("Checked")).toHaveClass("custom-check");
		expect(screen.getByText("Radio")).toHaveClass("custom-radio");
		expect(screen.getByText("⌘K")).toHaveClass("custom-shortcut");
		expect(screen.getByText("Sub trigger")).toHaveClass("custom-sub-trigger");
		expect(screen.getByText("Sub content")).toHaveClass("custom-sub-content");
		expect(screen.getByText("Content")).toHaveClass("custom-content");
		expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
	});

	it("renders command dialog and command input wrappers", () => {
		const { container } = render(
			<>
				<CommandDialog open>
					<div>Command contents</div>
				</CommandDialog>
				<CommandInput placeholder="Search" />
				<CommandItem className="custom-item">Item</CommandItem>
				<CommandShortcut className="custom-shortcut">⌘J</CommandShortcut>
			</>,
		);

		expect(screen.getByText("Command contents")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
		expect(screen.getByText("Item")).toHaveClass("custom-item");
		expect(screen.getByText("⌘J")).toHaveClass("custom-shortcut");
		expect(
			container.querySelector("[data-cmdk-input-wrapper]"),
		).toBeInTheDocument();
	});
});
