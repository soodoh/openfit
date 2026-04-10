import { userEvent } from "@vitest/browser/context";
import type { ReactNode } from "react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./card";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
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

	it("renders the card primitives with custom classes", async () => {
		const screen = await render(
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
		const { container } = screen;

		await expect.element(screen.getByText("Title")).toHaveClass("custom-title");
		await expect
			.element(screen.getByText("Description"))
			.toHaveClass("custom-description");
		await expect
			.element(screen.getByText("Body"))
			.toHaveClass("custom-content");
		await expect
			.element(screen.getByText("Footer"))
			.toHaveClass("custom-footer");
		await expect
			.element(container.firstElementChild)
			.toHaveClass("custom-card");
	});

	it("renders pagination controls and page size options", async () => {
		const onPageChange = vi.fn();
		const onPrevPage = vi.fn();
		const onNextPage = vi.fn();
		const onPageSizeChange = vi.fn();

		const screen = await render(
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

		await expect
			.element(screen.getByText("Showing 11-20 of 42"))
			.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "2" }));
		expect(onPageChange).toHaveBeenCalledWith(2);
		await screen.getByLabelText("Page size").fill("50");
		expect(onPageSizeChange).toHaveBeenCalledWith(50);

		await userEvent.click(
			screen.getByRole("button", { name: "Previous page" }),
		);
		await userEvent.click(screen.getByRole("button", { name: "Next page" }));
		expect(onPrevPage).toHaveBeenCalledTimes(1);
		expect(onNextPage).toHaveBeenCalledTimes(1);
	});

	it("renders compact pagination without ellipses for small page counts", async () => {
		const screen = await render(
			<Pagination
				currentPage={3}
				totalPages={4}
				startIndex={21}
				endIndex={30}
				totalItems={40}
				pageSize={10}
				onPageChange={vi.fn()}
				onPrevPage={vi.fn()}
				onNextPage={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		await expect
			.element(screen.getByRole("button", { name: "1" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "4" }))
			.toBeInTheDocument();
		await expect.element(screen.getByText("...")).not.toBeInTheDocument();
	});

	it("renders ellipses when the current page is near the end", async () => {
		const screen = await render(
			<Pagination
				currentPage={4}
				totalPages={8}
				startIndex={51}
				endIndex={60}
				totalItems={80}
				pageSize={10}
				onPageChange={vi.fn()}
				onPrevPage={vi.fn()}
				onNextPage={vi.fn()}
				onPageSizeChange={vi.fn()}
			/>,
		);

		await expect.element(screen.getByText("...")).toHaveCount(2);
		await expect
			.element(screen.getByRole("button", { name: "1" }))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "8" }))
			.toBeInTheDocument();
	});

	it("renders the no-results pagination state", async () => {
		const screen = await render(
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

		await expect.element(screen.getByText("No results")).toBeInTheDocument();
	});

	it("renders popover content through the portal wrapper", async () => {
		const screen = await render(
			<PopoverContent container={document.body} className="custom-popover">
				Popover body
			</PopoverContent>,
		);

		await expect
			.element(screen.getByText("Popover body"))
			.toHaveClass("custom-popover");
		await expect
			.element(screen.getByText("Popover body"))
			.toHaveAttribute("data-align", "center");
		await expect
			.element(screen.getByText("Popover body"))
			.toHaveAttribute("data-side-offset", "4");
	});

	it("renders sheet content with the requested side and close control", async () => {
		const screen = await render(
			<SheetContent side="left" className="custom-sheet">
				<SheetHeader>
					<SheetTitle>Sheet title</SheetTitle>
					<SheetDescription>Sheet description</SheetDescription>
				</SheetHeader>
				<SheetFooter>Actions</SheetFooter>
			</SheetContent>,
		);
		const { container } = screen;

		await expect.element(screen.getByText("Sheet title")).toBeInTheDocument();
		await expect
			.element(screen.getByText("Sheet description"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByRole("button", { name: "Close" }))
			.toBeInTheDocument();
		await expect
			.element(container.querySelector(".custom-sheet"))
			.toBeInTheDocument();
	});

	it("renders dropdown menu item variants and indicators", async () => {
		const screen = await render(
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
		const { container } = screen;

		await expect.element(screen.getByText("Label")).toHaveClass("custom-label");
		await expect.element(screen.getByText("Item")).toHaveClass("custom-item");
		await expect
			.element(screen.getByText("Checked"))
			.toHaveClass("custom-check");
		await expect.element(screen.getByText("Radio")).toHaveClass("custom-radio");
		await expect.element(screen.getByText("⌘K")).toHaveClass("custom-shortcut");
		await expect
			.element(screen.getByText("Sub trigger"))
			.toHaveClass("custom-sub-trigger");
		await expect
			.element(screen.getByText("Sub content"))
			.toHaveClass("custom-sub-content");
		await expect
			.element(screen.getByText("Content"))
			.toHaveClass("custom-content");
		expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
	});

	it("renders command dialog and command input wrappers", async () => {
		const screen = await render(
			<>
				<CommandDialog open>
					<div>Command contents</div>
				</CommandDialog>
				<CommandInput placeholder="Search" />
				<CommandItem className="custom-item">Item</CommandItem>
				<CommandShortcut className="custom-shortcut">⌘J</CommandShortcut>
			</>,
		);
		const { container } = screen;

		await expect
			.element(screen.getByText("Command contents"))
			.toBeInTheDocument();
		await expect.element(screen.getByPlaceholder("Search")).toBeInTheDocument();
		await expect.element(screen.getByText("Item")).toHaveClass("custom-item");
		await expect.element(screen.getByText("⌘J")).toHaveClass("custom-shortcut");
		await expect
			.element(container.querySelector("[data-cmdk-input-wrapper]"))
			.toBeInTheDocument();
	});

	it("renders the command list wrappers and separators", async () => {
		const screen = await render(
			<Command className="custom-command">
				<CommandInput placeholder="Search commands" />
				<CommandList className="custom-list">
					<CommandEmpty className="custom-empty">Nothing found</CommandEmpty>
					<CommandGroup className="custom-group" heading="Actions">
						<CommandItem className="custom-item">Open</CommandItem>
					</CommandGroup>
					<CommandSeparator className="custom-separator" />
				</CommandList>
				<CommandShortcut className="custom-shortcut">⌘K</CommandShortcut>
			</Command>,
		);
		const { container } = screen;

		await expect
			.element(container.firstElementChild)
			.toHaveClass("custom-command");
		await expect
			.element(screen.getByPlaceholder("Search commands"))
			.toBeInTheDocument();
		await expect
			.element(screen.getByText("Nothing found"))
			.toHaveClass("custom-empty");
		await expect
			.element(container.querySelector(".custom-group"))
			.toBeInTheDocument();
		await expect.element(screen.getByText("Open")).toHaveClass("custom-item");
		await expect.element(screen.getByText("⌘K")).toHaveClass("custom-shortcut");
		await expect
			.element(container.querySelector(".custom-list"))
			.toBeInTheDocument();
		await expect
			.element(container.querySelector(".custom-separator"))
			.toBeInTheDocument();
	});
});
