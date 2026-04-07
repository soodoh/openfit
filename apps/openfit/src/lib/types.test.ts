import { describe, expectTypeOf, it } from "vitest";
import type {
	AdminExerciseWithRelations,
	AdminUserWithProfile,
	DashboardRecentSession,
	DashboardStats,
	LookupItem,
	PaginatedResponse,
	UserProfileWithDefaults,
	WorkoutSessionSummary,
} from "./types";

describe("shared API types", () => {
	it("exposes dashboard and profile response shapes", () => {
		expectTypeOf<DashboardStats>().toMatchObjectType<{
			totalSessions: number;
			totalRoutines: number;
			thisWeekSessions: number;
			currentStreak: number;
		}>();
		expectTypeOf<DashboardRecentSession>().toMatchObjectType<{
			id: string;
			name: string;
			startTime: Date | string;
			endTime: Date | string | null | undefined;
			impression: number | null | undefined;
			setGroups: Array<{
				id: string;
				type: string;
				order: number;
				sets: Array<{
					id: string;
					exerciseId: string;
					exercise:
						| {
								id: string;
								name: string;
								imageUrl: string | null | undefined;
						  }
						| null
						| undefined;
				}>;
			}>;
		}>();
		expectTypeOf<UserProfileWithDefaults>().toMatchObjectType<{
			role: "USER" | "ADMIN";
			theme: "light" | "dark" | "system";
			defaultRepetitionUnit:
				| {
						id: string;
						name: string;
				  }
				| null
				| undefined;
			defaultWeightUnit:
				| {
						id: string;
						name: string;
				  }
				| null
				| undefined;
			defaultGym:
				| {
						id: string;
						name: string;
				  }
				| null
				| undefined;
		}>();
	});

	it("exposes shared admin list and pagination models", () => {
		expectTypeOf<LookupItem>().toMatchObjectType<{
			id: string;
			name: string;
		}>();
		expectTypeOf<PaginatedResponse<LookupItem>>().toMatchObjectType<{
			items: LookupItem[];
			total: number;
			page: number;
			pageSize: number;
		}>();
		expectTypeOf<AdminUserWithProfile>().toMatchObjectType<{
			id: string;
			userId: string;
			email: string;
			role: "USER" | "ADMIN";
		}>();
		expectTypeOf<AdminExerciseWithRelations>().toMatchObjectType<{
			id: string;
			name: string;
			primaryMuscles: LookupItem[];
			secondaryMuscles: LookupItem[];
			imageUrls: Array<string | null | undefined>;
		}>();
	});

	it("keeps shared session summary types reusable", () => {
		expectTypeOf<WorkoutSessionSummary>().toMatchObjectType<{
			id: string;
			name: string;
			startTime: Date | string;
			endTime: Date | string | null | undefined;
			impression: number | null | undefined;
		}>();
	});
});
