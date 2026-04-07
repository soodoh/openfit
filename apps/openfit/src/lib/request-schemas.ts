import { boolean, number, object, preprocess, string } from "zod";
import {
	ExerciseForceEnum,
	ExerciseLevelEnum,
	ExerciseMechanicEnum,
} from "@/db/schema/exercises";
import { RoleEnum, ThemeEnum } from "@/db/schema/user-data";
import { SetGroupTypeEnum, SetTypeEnum } from "@/db/schema/workouts";

const nonEmptyString = string().trim().min(1);
const nonNegativeInteger = number().int().min(0);
const nonNegativeNumber = number().min(0);
const weekdayArraySchema = nonNegativeInteger.max(6).array();

function normalizeParamString(value: unknown) {
	return typeof value === "string" ? value.trim() : value;
}

function integerQueryParam(options: {
	defaultValue?: number;
	max?: number;
	min?: number;
	optional?: boolean;
}) {
	const { defaultValue, max, min = 0, optional = false } = options;
	let schema = number().int().min(min);

	if (max !== undefined) {
		schema = schema.max(max);
	}

	if (optional) {
		return preprocess((value) => {
			const normalized = normalizeParamString(value);
			if (normalized === undefined || normalized === "") {
				return undefined;
			}
			if (typeof normalized === "string" && /^-?\d+$/.test(normalized)) {
				return Number.parseInt(normalized, 10);
			}
			return normalized;
		}, schema.optional());
	}

	return preprocess((value) => {
		const normalized = normalizeParamString(value);
		if (normalized === undefined || normalized === "") {
			return defaultValue;
		}
		if (typeof normalized === "string" && /^-?\d+$/.test(normalized)) {
			return Number.parseInt(normalized, 10);
		}
		return normalized;
	}, schema);
}

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
const exerciseLevelSchema = string()
	.trim()
	.refine(
		(value) =>
			value === ExerciseLevelEnum.beginner ||
			value === ExerciseLevelEnum.intermediate ||
			value === ExerciseLevelEnum.expert,
	);
const exerciseForceSchema = string()
	.trim()
	.refine(
		(value) =>
			value === ExerciseForceEnum.push ||
			value === ExerciseForceEnum.pull ||
			value === ExerciseForceEnum.static,
	);
const exerciseMechanicSchema = string()
	.trim()
	.refine(
		(value) =>
			value === ExerciseMechanicEnum.compound ||
			value === ExerciseMechanicEnum.isolation,
	);
const trimmedStringQueryParam = preprocess((value) => {
	const normalized = normalizeParamString(value);
	return normalized === undefined ? "" : normalized;
}, string());
const optionalNonEmptyStringQueryParam = preprocess((value) => {
	const normalized = normalizeParamString(value);
	return normalized === "" ? undefined : normalized;
}, nonEmptyString.optional());
const optionalStringArrayQueryParam = preprocess((value) => {
	if (value === undefined) {
		return undefined;
	}
	return Array.isArray(value) ? value : [value];
}, nonEmptyString.array().optional());
const optionalExerciseLevelQueryParam = preprocess((value) => {
	const normalized = normalizeParamString(value);
	return normalized === "" ? undefined : normalized;
}, exerciseLevelSchema.optional());
const optionalLookupTypeQueryParam = preprocess((value) => {
	const normalized = normalizeParamString(value);
	return normalized === "" ? undefined : normalized;
}, lookupTypeSchema.optional());
const timestampQueryParam = integerQueryParam({
	min: 0,
	optional: true,
});
const trimmedStringArraySchema = nonEmptyString.array();
const sessionTimestampSchema = number().finite().or(nonEmptyString);
const sessionImpressionSchema = number().int().min(1).max(5);

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

export const adminLookupListQuerySchema = object({
	type: optionalLookupTypeQueryParam,
	page: integerQueryParam({
		defaultValue: 1,
		min: 1,
	}),
	pageSize: integerQueryParam({
		defaultValue: 10,
		min: 1,
		max: 100,
	}),
	search: trimmedStringQueryParam,
}).refine((value) => value.type !== undefined, {
	message: "Type is required",
	path: ["type"],
});

export const adminLookupDeleteQuerySchema = object({
	type: optionalLookupTypeQueryParam,
}).refine((value) => value.type !== undefined, {
	message: "Type is required",
	path: ["type"],
});

export const adminUserListQuerySchema = object({
	page: integerQueryParam({
		defaultValue: 1,
		min: 1,
	}),
	pageSize: integerQueryParam({
		defaultValue: 10,
		min: 1,
		max: 100,
	}),
	search: trimmedStringQueryParam,
});

export const adminExerciseListQuerySchema = adminUserListQuerySchema;

export const createGymSchema = object({
	name: nonEmptyString,
	equipmentIds: nonEmptyString.array().optional(),
});

export const exercisesListQuerySchema = object({
	cursor: integerQueryParam({
		min: 0,
		optional: true,
	}),
	limit: integerQueryParam({
		defaultValue: 20,
		min: 1,
		max: 100,
	}),
	search: trimmedStringQueryParam,
	equipmentId: optionalNonEmptyStringQueryParam,
	equipmentIds: optionalStringArrayQueryParam,
	level: optionalExerciseLevelQueryParam,
	categoryId: optionalNonEmptyStringQueryParam,
	primaryMuscleId: optionalNonEmptyStringQueryParam,
});

export const exerciseSearchQuerySchema = object({
	q: trimmedStringQueryParam,
	equipmentIds: optionalStringArrayQueryParam,
	limit: integerQueryParam({
		defaultValue: 20,
		min: 1,
		max: 50,
	}),
});

export const similarExercisesQuerySchema = object({
	q: trimmedStringQueryParam,
	equipmentIds: optionalStringArrayQueryParam,
	primaryMuscleIds: optionalStringArrayQueryParam,
	exclude: optionalNonEmptyStringQueryParam,
	limit: integerQueryParam({
		defaultValue: 20,
		min: 1,
		max: 50,
	}),
});

export const routineDaysListQuerySchema = object({
	search: trimmedStringQueryParam,
	limit: integerQueryParam({
		defaultValue: 10,
		min: 1,
		max: 50,
	}),
});

export const routinesListQuerySchema = object({
	cursor: integerQueryParam({
		min: 0,
		optional: true,
	}),
	limit: integerQueryParam({
		defaultValue: 20,
		min: 1,
		max: 100,
	}),
	search: trimmedStringQueryParam,
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

export const createUserExerciseSchema = object({
	name: nonEmptyString,
	equipmentId: nonEmptyString.optional(),
	force: exerciseForceSchema.optional(),
	level: exerciseLevelSchema.optional(),
	mechanic: exerciseMechanicSchema.optional(),
	categoryId: nonEmptyString,
	primaryMuscleIds: trimmedStringArraySchema.optional(),
	secondaryMuscleIds: trimmedStringArraySchema.optional(),
	instructions: trimmedStringArraySchema.optional(),
});

export const updateUserExerciseSchema = object({
	name: nonEmptyString.optional(),
	equipmentId: nonEmptyString.optional(),
	force: exerciseForceSchema.optional(),
	level: exerciseLevelSchema.optional(),
	mechanic: exerciseMechanicSchema.optional(),
	categoryId: nonEmptyString.optional(),
	primaryMuscleIds: trimmedStringArraySchema.optional(),
	secondaryMuscleIds: trimmedStringArraySchema.optional(),
	instructions: trimmedStringArraySchema.optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const createAdminExerciseSchema = createUserExerciseSchema.extend({
	imageUrls: trimmedStringArraySchema.optional(),
});

export const updateAdminExerciseSchema = updateUserExerciseSchema
	.extend({
		imageUrls: trimmedStringArraySchema.optional(),
	})
	.refine(requireAtLeastOneField, {
		message: "At least one field must be provided",
	});

export const createSessionSchema = object({
	name: nonEmptyString.optional(),
	notes: string().max(5_000).optional(),
	startTime: sessionTimestampSchema.optional(),
	endTime: sessionTimestampSchema.optional(),
	impression: sessionImpressionSchema.optional(),
	templateId: nonEmptyString.optional(),
});

export const updateSessionSchema = object({
	name: nonEmptyString.optional(),
	notes: string().max(5_000).optional(),
	impression: sessionImpressionSchema.optional(),
	startTime: sessionTimestampSchema.optional(),
	endTime: sessionTimestampSchema.optional(),
}).refine(requireAtLeastOneField, {
	message: "At least one field must be provided",
});

export const sessionListQuerySchema = object({
	startDate: timestampQueryParam,
	endDate: timestampQueryParam,
}).refine(
	(value) =>
		(value.startDate === undefined && value.endDate === undefined) ||
		(value.startDate !== undefined && value.endDate !== undefined),
	{
		message: "startDate and endDate must be provided together",
		path: ["startDate"],
	},
);

export const uploadDeleteQuerySchema = object({
	filename: optionalNonEmptyStringQueryParam,
}).refine((value) => value.filename !== undefined, {
	message: "Filename is required",
	path: ["filename"],
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
