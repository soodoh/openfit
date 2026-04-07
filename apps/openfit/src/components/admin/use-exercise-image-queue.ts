import { useEffect, useRef, useState } from "react";

export type ExerciseImageItem = {
	type: "existing" | "new";
	url?: string;
	file?: File;
};

type UseExerciseImageQueueOptions = {
	open?: boolean;
	imageUrls?: Array<string | null | undefined>;
};

const EMPTY_IMAGE_URLS: Array<string | null | undefined> = [];

function toExistingImages(
	imageUrls: Array<string | null | undefined> = [],
): ExerciseImageItem[] {
	return imageUrls.filter(Boolean).map((url) => ({
		type: "existing" as const,
		url: url ?? undefined,
	}));
}

export function useExerciseImageQueue({
	open = true,
	imageUrls,
}: UseExerciseImageQueueOptions = {}) {
	const createdObjectUrlsRef = useRef<string[]>([]);
	const previousSourceRef = useRef<{ key: string; open: boolean } | undefined>(
		undefined,
	);
	const [images, setImages] = useState<ExerciseImageItem[]>(() =>
		toExistingImages(open ? (imageUrls ?? EMPTY_IMAGE_URLS) : EMPTY_IMAGE_URLS),
	);

	useEffect(() => {
		const sourceImageUrls = open
			? (imageUrls ?? EMPTY_IMAGE_URLS)
			: EMPTY_IMAGE_URLS;
		const nextSourceKey = JSON.stringify(sourceImageUrls);
		if (
			previousSourceRef.current?.open === open &&
			previousSourceRef.current.key === nextSourceKey
		) {
			return;
		}

		previousSourceRef.current = {
			key: nextSourceKey,
			open,
		};
		for (const url of createdObjectUrlsRef.current) {
			URL.revokeObjectURL(url);
		}
		createdObjectUrlsRef.current = [];
		setImages(toExistingImages(sourceImageUrls));
	}, [open, imageUrls]);

	useEffect(
		() => () => {
			for (const url of createdObjectUrlsRef.current) {
				URL.revokeObjectURL(url);
			}
			createdObjectUrlsRef.current = [];
		},
		[],
	);

	const addFiles = (files: FileList | File[]) => {
		const nextFiles = Array.from(files);
		if (nextFiles.length === 0) {
			return;
		}

		const nextImages = nextFiles.map((file) => {
			const url = URL.createObjectURL(file);
			createdObjectUrlsRef.current.push(url);
			return {
				type: "new" as const,
				file,
				url,
			};
		});

		setImages((currentImages) => [...currentImages, ...nextImages]);
	};

	const removeImage = (index: number) => {
		setImages((currentImages) => {
			const image = currentImages[index];
			if (image?.type === "new" && image.url) {
				URL.revokeObjectURL(image.url);
				createdObjectUrlsRef.current = createdObjectUrlsRef.current.filter(
					(url) => url !== image.url,
				);
			}
			return currentImages.filter((_, currentIndex) => currentIndex !== index);
		});
	};

	const resetImages = (
		nextImageUrls: Array<string | null | undefined> = [],
	) => {
		for (const url of createdObjectUrlsRef.current) {
			URL.revokeObjectURL(url);
		}
		createdObjectUrlsRef.current = [];
		setImages(toExistingImages(nextImageUrls));
	};

	return {
		images,
		addFiles,
		removeImage,
		resetImages,
	};
}
