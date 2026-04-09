import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInView } from "./use-in-view";

class MockIntersectionObserver {
	static instances: MockIntersectionObserver[] = [];

	readonly observe = vi.fn<(target: Element) => void>((target) => {
		this.observedTarget = target;
		this.isConnected = true;
	});
	readonly disconnect = vi.fn<() => void>(() => {
		this.isConnected = false;
	});
	readonly options: IntersectionObserverInit | undefined;
	private readonly callback: IntersectionObserverCallback;
	private isConnected = false;
	private observedTarget: Element | undefined;

	constructor(
		callback: IntersectionObserverCallback,
		options?: IntersectionObserverInit,
	) {
		this.callback = callback;
		this.options = options;
		MockIntersectionObserver.instances.push(this);
	}

	trigger(
		entry: Partial<IntersectionObserverEntry> &
			Pick<IntersectionObserverEntry, "isIntersecting">,
	) {
		if (!this.isConnected) {
			return;
		}

		const entryTarget = entry.target;
		if (
			entryTarget !== undefined &&
			this.observedTarget !== undefined &&
			entryTarget !== this.observedTarget
		) {
			return;
		}

		const nextEntry = {
			boundingClientRect: {} as DOMRectReadOnly,
			intersectionRatio: entry.isIntersecting ? 1 : 0,
			intersectionRect: {} as DOMRectReadOnly,
			isIntersecting: false,
			rootBounds: null,
			target: document.createElement("div"),
			time: 0,
			...entry,
		} satisfies IntersectionObserverEntry;

		this.callback([nextEntry], this as unknown as IntersectionObserver);
	}
}

const originalIntersectionObserver = globalThis.IntersectionObserver;

describe("use-in-view", () => {
	beforeEach(() => {
		MockIntersectionObserver.instances = [];
		vi.stubGlobal(
			"IntersectionObserver",
			MockIntersectionObserver as unknown as typeof IntersectionObserver,
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		expect(globalThis.IntersectionObserver).toBe(originalIntersectionObserver);
	});

	it("creates an observer for a node and updates inView from observer entries", () => {
		const { result } = renderHook(() =>
			useInView({
				rootMargin: "16px",
				threshold: 0.25,
			}),
		);
		const node = document.createElement("div");

		act(() => {
			result.current.ref(node);
		});

		expect(MockIntersectionObserver.instances).toHaveLength(1);
		const observer = MockIntersectionObserver.instances[0];
		expect(observer.observe).toHaveBeenCalledWith(node);
		expect(observer.options).toEqual({
			root: undefined,
			rootMargin: "16px",
			threshold: 0.25,
		});

		act(() => {
			observer.trigger({ target: node, isIntersecting: true });
		});
		expect(result.current.inView).toBe(true);

		act(() => {
			observer.trigger({ target: node, isIntersecting: false });
		});
		expect(result.current.inView).toBe(false);
	});

	it("disconnects on ref changes and resets inView when ref receives null", () => {
		const { result } = renderHook(() => useInView());
		const firstNode = document.createElement("div");
		const secondNode = document.createElement("div");

		act(() => {
			result.current.ref(firstNode);
		});

		expect(MockIntersectionObserver.instances).toHaveLength(1);
		const firstObserver = MockIntersectionObserver.instances[0];
		expect(firstObserver.options).toEqual({
			root: undefined,
			rootMargin: "200px",
			threshold: undefined,
		});

		act(() => {
			firstObserver.trigger({ target: firstNode, isIntersecting: true });
		});
		expect(result.current.inView).toBe(true);

		act(() => {
			result.current.ref(secondNode);
		});

		expect(firstObserver.disconnect).toHaveBeenCalledTimes(1);
		expect(MockIntersectionObserver.instances).toHaveLength(2);
		const secondObserver = MockIntersectionObserver.instances[1];
		expect(secondObserver.observe).toHaveBeenCalledWith(secondNode);
		expect(result.current.inView).toBe(true);

		act(() => {
			firstObserver.trigger({ target: firstNode, isIntersecting: false });
		});
		expect(result.current.inView).toBe(true);

		act(() => {
			result.current.ref(null);
		});

		expect(secondObserver.disconnect).toHaveBeenCalledTimes(1);
		expect(MockIntersectionObserver.instances).toHaveLength(2);
		expect(result.current.inView).toBe(false);

		act(() => {
			secondObserver.trigger({ target: secondNode, isIntersecting: true });
		});
		expect(result.current.inView).toBe(false);
	});
});
