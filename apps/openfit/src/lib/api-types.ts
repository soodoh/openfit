export type MutationSuccessResult = { success: true };
export type MutationIdResult = { id: string };

export type CursorPage<T> = {
	page: T[];
	isDone: boolean;
	continueCursor: string | undefined;
};

export type AdminPage<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
};

export type RoutineDayDto = {
	id: string;
	routineId: string;
	userId: string;
	description: string;
	createdAt: Date | string;
	updatedAt: Date | string;
	weekdays: number[];
	routine?:
		| {
				id: string;
				name: string;
		  }
		| null
		| undefined;
	setGroups?: unknown[];
};

export type RoutineDto = {
	id: string;
	userId: string;
	name: string;
	description: string | null | undefined;
	createdAt: Date | string;
	updatedAt: Date | string;
	routineDays: RoutineDayDto[];
};
