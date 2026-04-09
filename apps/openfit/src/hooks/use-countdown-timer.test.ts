import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountdownTimer } from "./use-countdown-timer";

describe("use-countdown-timer", () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("starts, counts down, and pauses without expiring", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-01T10:00:00.000Z"));
		const onExpire = vi.fn();
		const expiryTimestamp = new Date(Date.now() + 5000);
		const { result } = renderHook(() =>
			useCountdownTimer({
				expiryTimestamp,
				autoStart: false,
				onExpire,
				interval: 100,
			}),
		);

		expect(result.current.isRunning).toBe(false);
		expect(result.current.totalSeconds).toBe(5);

		act(() => {
			result.current.start();
		});
		expect(result.current.isRunning).toBe(true);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(2100);
		});
		expect(result.current.totalSeconds).toBe(3);

		act(() => {
			result.current.pause();
		});
		expect(result.current.isRunning).toBe(false);
		const pausedSeconds = result.current.totalSeconds;

		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(result.current.totalSeconds).toBe(pausedSeconds);
		expect(onExpire).not.toHaveBeenCalled();
	});

	it("expires and supports restart with and without auto start", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-01T10:00:00.000Z"));
		const onExpire = vi.fn();
		const { result } = renderHook(() =>
			useCountdownTimer({
				expiryTimestamp: new Date(Date.now() + 1000),
				autoStart: true,
				onExpire,
				interval: 50,
			}),
		);

		expect(result.current.isRunning).toBe(true);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1100);
		});
		expect(result.current.totalSeconds).toBe(0);
		expect(result.current.isRunning).toBe(false);
		expect(onExpire).toHaveBeenCalledTimes(1);

		act(() => {
			result.current.restart(new Date(Date.now() + 4000), false);
		});
		expect(result.current.totalSeconds).toBe(4);
		expect(result.current.isRunning).toBe(false);

		act(() => {
			result.current.start();
		});
		expect(result.current.isRunning).toBe(true);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(4100);
		});
		expect(result.current.totalSeconds).toBe(0);
		expect(result.current.isRunning).toBe(false);
		expect(onExpire).toHaveBeenCalledTimes(2);

		act(() => {
			result.current.restart(new Date(Date.now() + 3000));
		});
		expect(result.current.totalSeconds).toBe(3);
		expect(result.current.isRunning).toBe(true);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3100);
		});
		expect(result.current.totalSeconds).toBe(0);
		expect(result.current.isRunning).toBe(false);
		expect(onExpire).toHaveBeenCalledTimes(3);
	});

	it("cleans up its interval on unmount", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-01T10:00:00.000Z"));
		const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
		const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
		const { result, unmount } = renderHook(() =>
			useCountdownTimer({
				expiryTimestamp: new Date(Date.now() + 5000),
				autoStart: false,
				interval: 100,
			}),
		);

		act(() => {
			result.current.start();
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(100);
		});

		expect(setIntervalSpy).toHaveBeenCalledTimes(1);
		const createdIntervalId = setIntervalSpy.mock.results[0]?.value;
		expect(createdIntervalId).toBeDefined();
		const clearCallsBeforeUnmount = clearIntervalSpy.mock.calls.length;

		unmount();

		expect(clearIntervalSpy.mock.calls.length).toBe(
			clearCallsBeforeUnmount + 1,
		);
		expect(clearIntervalSpy).toHaveBeenLastCalledWith(createdIntervalId);
	});
});
