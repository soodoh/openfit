import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
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

	it("creates previews for new files and revokes their blob URLs when resetting", async () => {
		const firstFile = new File(["first"], "first.png", { type: "image/png" });
		const secondFile = new File(["second"], "second.png", {
			type: "image/png",
		});
		const { result } = await renderHook(() =>
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

	it("revokes any remaining blob URLs on unmount", async () => {
		const file = new File(["preview"], "preview.png", { type: "image/png" });
		const { result, unmount } = await renderHook(() => useExerciseImageQueue());

		act(() => {
			result.current.addFiles([file]);
		});

		unmount();

		expect(revokeObjectURL).toHaveBeenCalledWith("blob:one");
	});

	it("revokes queued blob URLs when the queue is cleared by closing", async () => {
		const file = new File(["preview"], "preview.png", { type: "image/png" });
		const { result, rerender } = await renderHook(
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

	it("revokes a blob URL only for removed new images", async () => {
		const file = new File(["preview"], "preview.png", { type: "image/png" });
		const { result } = await renderHook(() =>
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
