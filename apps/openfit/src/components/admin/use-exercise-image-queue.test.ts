import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useExerciseImageQueue } from "./use-exercise-image-queue";

describe("useExerciseImageQueue", () => {
	const createObjectURL = vi.fn<(object: Blob | MediaSource) => string>();
	const revokeObjectURL = vi.fn<(url: string) => void>();

	beforeEach(() => {
		createObjectURL.mockReset();
		revokeObjectURL.mockReset();
		createObjectURL
			.mockReturnValueOnce("blob:one")
			.mockReturnValueOnce("blob:two")
			.mockReturnValue("blob:fallback");

		vi.spyOn(URL, "createObjectURL").mockImplementation(createObjectURL);
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURL);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("creates previews for new files and revokes their blob URLs when resetting", () => {
		const firstFile = new File(["first"], "first.png", { type: "image/png" });
		const secondFile = new File(["second"], "second.png", {
			type: "image/png",
		});
		const { result } = renderHook(() =>
			useExerciseImageQueue({ imageUrls: ["/existing.png"] }),
		);

		act(() => {
			result.current.addFiles([firstFile, secondFile]);
		});

		expect(result.current.images).toEqual([
			{ type: "existing", url: "/existing.png" },
			{ type: "new", file: firstFile, url: "blob:one" },
			{ type: "new", file: secondFile, url: "blob:two" },
		]);
		expect(createObjectURL).toHaveBeenCalledTimes(2);

		act(() => {
			result.current.resetImages(["/replacement.png"]);
		});

		expect(revokeObjectURL).toHaveBeenCalledWith("blob:one");
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:two");
		expect(result.current.images).toEqual([
			{ type: "existing", url: "/replacement.png" },
		]);
	});

	it("revokes any remaining blob URLs on unmount", () => {
		const file = new File(["preview"], "preview.png", { type: "image/png" });
		const { result, unmount } = renderHook(() => useExerciseImageQueue());

		act(() => {
			result.current.addFiles([file]);
		});

		unmount();

		expect(revokeObjectURL).toHaveBeenCalledWith("blob:one");
	});

	it("revokes queued blob URLs when the queue is cleared by closing", () => {
		const file = new File(["preview"], "preview.png", { type: "image/png" });
		const { result, rerender } = renderHook(
			({ open }: { open: boolean }) => useExerciseImageQueue({ open }),
			{
				initialProps: { open: true },
			},
		);

		act(() => {
			result.current.addFiles([file]);
		});

		rerender({ open: false });

		expect(revokeObjectURL).toHaveBeenCalledWith("blob:one");
		expect(result.current.images).toEqual([]);
	});

	it("revokes a blob URL only for removed new images", () => {
		const file = new File(["preview"], "preview.png", { type: "image/png" });
		const { result } = renderHook(() =>
			useExerciseImageQueue({ imageUrls: ["/existing.png"] }),
		);

		act(() => {
			result.current.addFiles([file]);
		});

		act(() => {
			result.current.removeImage(0);
		});

		expect(revokeObjectURL).not.toHaveBeenCalled();

		act(() => {
			result.current.removeImage(0);
		});

		expect(revokeObjectURL).toHaveBeenCalledWith("blob:one");
	});
});
