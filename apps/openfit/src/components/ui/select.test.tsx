import { render, screen } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@radix-ui/react-select", async () => {
	const ReactModule = await import("react");

	const Root = ({ children }: { children: React.ReactNode }) => (
		<div data-testid="select-root">{children}</div>
	);

	const Group = ({ children }: { children: React.ReactNode }) => (
		<div data-testid="select-group">{children}</div>
	);

	const Value = ({ placeholder }: { placeholder?: string }) => (
		<span>{placeholder}</span>
	);

	const Trigger = ReactModule.forwardRef<
		HTMLButtonElement,
		React.ButtonHTMLAttributes<HTMLButtonElement>
	>(({ children, ...props }, ref) => (
		<button ref={ref} type="button" {...props}>
			{children}
		</button>
	));

	const Icon = ({ children }: { children: React.ReactNode }) => (
		<span data-testid="select-icon">{children}</span>
	);

	const ScrollUpButton = ReactModule.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ children, ...props }, ref) => (
		<div ref={ref} data-testid="select-scroll-up" {...props}>
			{children}
		</div>
	));

	const ScrollDownButton = ReactModule.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ children, ...props }, ref) => (
		<div ref={ref} data-testid="select-scroll-down" {...props}>
			{children}
		</div>
	));

	const Portal = ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	);

	const Content = ReactModule.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement> & { position?: string }
	>(({ children, position, ...props }, ref) => (
		<div
			ref={ref}
			data-testid="select-content"
			data-position={position}
			{...props}
		>
			{children}
		</div>
	));

	const Viewport = ({
		children,
		...props
	}: React.HTMLAttributes<HTMLDivElement>) => (
		<div data-testid="select-viewport" {...props}>
			{children}
		</div>
	);

	const Label = ReactModule.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ children, ...props }, ref) => (
		<div ref={ref} {...props}>
			{children}
		</div>
	));

	const Item = ReactModule.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement> & { value: string }
	>(({ children, value, ...props }, ref) => (
		<div ref={ref} data-value={value} {...props}>
			{children}
		</div>
	));

	const ItemIndicator = ({ children }: { children: React.ReactNode }) => (
		<span data-testid="item-indicator">{children}</span>
	);

	const ItemText = ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	);

	const Separator = ReactModule.forwardRef<
		HTMLDivElement,
		React.HTMLAttributes<HTMLDivElement>
	>(({ ...props }, ref) => (
		<div ref={ref} data-testid="select-separator" {...props} />
	));

	return {
		Content,
		Group,
		Icon,
		Item,
		ItemIndicator,
		ItemText,
		Label,
		Portal,
		Root,
		ScrollDownButton,
		ScrollUpButton,
		Separator,
		Trigger,
		Value,
		Viewport,
	};
});

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./select";

describe("Select", () => {
	it("renders wrapper subcomponents and popper-specific styles", () => {
		render(
			<Select>
				<SelectTrigger className="trigger-custom" aria-label="Exercise">
					<SelectValue placeholder="Pick exercise" />
				</SelectTrigger>
				<SelectContent className="content-custom" position="popper">
					<SelectGroup>
						<SelectLabel className="label-custom">Main lifts</SelectLabel>
						<SelectItem className="item-custom" value="squat">
							Squat
						</SelectItem>
						<SelectSeparator className="separator-custom" />
					</SelectGroup>
				</SelectContent>
			</Select>,
		);

		expect(screen.getByRole("button", { name: "Exercise" })).toHaveClass(
			"trigger-custom",
		);
		expect(screen.getByText("Pick exercise")).toBeInTheDocument();
		expect(screen.getByText("Main lifts")).toHaveClass("label-custom");
		expect(screen.getByText("Squat")).toBeInTheDocument();
		expect(screen.getByTestId("select-scroll-up")).toBeInTheDocument();
		expect(screen.getByTestId("select-scroll-down")).toBeInTheDocument();
		expect(screen.getByTestId("select-separator")).toHaveClass(
			"separator-custom",
		);

		const content = screen.getByTestId("select-content");
		expect(content).toHaveAttribute("data-position", "popper");
		expect(content).toHaveClass("content-custom");
		expect(content.className).toContain("data-[side=bottom]:translate-y-1");
		expect(screen.getByTestId("select-viewport").className).toContain(
			"h-(--radix-select-trigger-height)",
		);
	});

	it("omits popper-only classes when using non-popper positioning", () => {
		render(
			<Select>
				<SelectTrigger aria-label="Theme selector">
					<SelectValue placeholder="Pick theme" />
				</SelectTrigger>
				<SelectContent position="item-aligned">
					<SelectItem value="system">System</SelectItem>
				</SelectContent>
			</Select>,
		);

		const content = screen.getByTestId("select-content");
		expect(content).toHaveAttribute("data-position", "item-aligned");
		expect(content.className).not.toContain("data-[side=bottom]:translate-y-1");
		expect(screen.getByTestId("select-viewport").className).not.toContain(
			"h-(--radix-select-trigger-height)",
		);
	});
});
