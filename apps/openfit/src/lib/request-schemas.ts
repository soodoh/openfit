import { boolean, number, object, string } from "zod";
import { RoleEnum, ThemeEnum } from "@/db/schema/user-data";
import { SetGroupTypeEnum, SetTypeEnum } from "@/db/schema/workouts";

const nonEmptyString = string().trim().min(1);
const nonNegativeInteger = number().int().min(0);
const nonNegativeNumber = number().min(0);
const weekdayArraySchema = nonNegativeInteger.max(6).array();

function requireAtLeastOneField<T extends Record<string, unknown>>(value: T) {
	return Object.values(value).some((field) => field !== undefined);
}

const lookupTypeSchema = string()
	.trim()
	.refine(
		(value) =>
			value === "equipment" ||
			value === "categories" ||
			value === "muscleGroups" ||
			value === "repetitionUnits" ||
			value === "weightUnits",
	);

export const adminUserRoleUpdateSchema = object({
	role: string()
		.trim()
		.pipe(
			string().refine(
				(value) => value === RoleEnum.USER || value === RoleEnum.ADMIN,
			),
		),
});

export const updateUserProfileSchema = object({
	theme: string()
		.trim()
		.refine(
			(value) =>
				value === ThemeEnum.light ||
				value === ThemeEnum.dark ||
				value === ThemeEnum.system,
		)
		.optional(),
	defaultRepetitionUnitId: nonEmptyString.optional(),
	defaultWeightUnitId: nonEmptyString.optional(),
	defaultGymId: nonEmptyString.optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const adminLookupMutationSchema = object({
	type: lookupTypeSchema,
	name: nonEmptyString,
});

export const createGymSchema = object({
	name: nonEmptyString,
	equipmentIds: nonEmptyString.array().optional(),
});

export const updateGymSchema = object({
	name: nonEmptyString.optional(),
	equipmentIds: nonEmptyString.array().optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const createRoutineSchema = object({
	name: nonEmptyString,
	description: string().max(1_000).optional(),
});

export const updateRoutineSchema = object({
	name: nonEmptyString.optional(),
	description: string().max(1_000).optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const createRoutineDaySchema = object({
	routineId: nonEmptyString,
	description: nonEmptyString,
	weekdays: weekdayArraySchema.optional(),
});

export const updateRoutineDaySchema = object({
	description: nonEmptyString.optional(),
	weekdays: weekdayArraySchema.optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const createSetGroupSchema = object({
	sessionId: nonEmptyString.optional(),
	routineDayId: nonEmptyString.optional(),
	type: string()
		.trim()
		.refine(
			(value) =>
				value === SetGroupTypeEnum.NORMAL ||
				value === SetGroupTypeEnum.SUPERSET,
		)
		.optional(),
	exerciseId: nonEmptyString,
	numSets: number().int().min(1).max(20).optional(),
}).refine((value) => Boolean(value.sessionId || value.routineDayId), {
	message: "Either sessionId or routineDayId is required",
});

export const updateSetGroupSchema = object({
	type: string()
		.trim()
		.refine(
			(value) =>
				value === SetGroupTypeEnum.NORMAL ||
				value === SetGroupTypeEnum.SUPERSET,
		)
		.optional(),
	comment: string().max(1_000).optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const replaceExerciseSchema = object({
	exerciseId: nonEmptyString,
});

export const bulkEditSetGroupSchema = object({
	reps: nonNegativeInteger.optional(),
	weight: nonNegativeNumber.optional(),
	repetitionUnitId: nonEmptyString.optional(),
	weightUnitId: nonEmptyString.optional(),
	restTime: nonNegativeInteger.optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const createSetSchema = object({
	setGroupId: nonEmptyString,
	exerciseId: nonEmptyString,
	type: string()
		.trim()
		.refine(
			(value) =>
				value === SetTypeEnum.NORMAL ||
				value === SetTypeEnum.WARMUP ||
				value === SetTypeEnum.DROPSET ||
				value === SetTypeEnum.FAILURE,
		)
		.optional(),
	reps: nonNegativeInteger.optional(),
	repetitionUnitId: nonEmptyString.optional(),
	weight: nonNegativeNumber.optional(),
	weightUnitId: nonEmptyString.optional(),
	restTime: nonNegativeInteger.optional(),
});

export const updateSetSchema = object({
	type: string()
		.trim()
		.refine(
			(value) =>
				value === SetTypeEnum.NORMAL ||
				value === SetTypeEnum.WARMUP ||
				value === SetTypeEnum.DROPSET ||
				value === SetTypeEnum.FAILURE,
		)
		.optional(),
	reps: nonNegativeInteger.optional(),
	repetitionUnitId: nonEmptyString.optional(),
	weight: nonNegativeNumber.optional(),
	weightUnitId: nonEmptyString.optional(),
	restTime: nonNegativeInteger.optional(),
	completed: boolean().optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const reorderSetGroupsSchema = object({
	setGroupIds: nonEmptyString.array().min(1),
});

export const reorderSetsSchema = object({
	setGroupId: nonEmptyString,
	setIds: nonEmptyString.array().min(1),
});
