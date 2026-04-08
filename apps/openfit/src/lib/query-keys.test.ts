import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
	it("builds exercise query keys with expected nested segments", () => {
		const listFilters = { level: "beginner" };
		const searchFilters = { equipmentId: "eq_1" };
		const similarParams = { exerciseId: "exercise_1", limit: 4 };

		expect(queryKeys.exercises.all).toEqual(["exercises"]);
		expect(queryKeys.exercises.lists()).toEqual(["exercises", "list"]);
		expect(queryKeys.exercises.list()).toEqual(["exercises", "list", {}]);
		expect(queryKeys.exercises.list(listFilters)).toEqual([
			"exercises",
			"list",
			listFilters,
		]);
		expect(queryKeys.exercises.details()).toEqual(["exercises", "detail"]);
		expect(queryKeys.exercises.detail("exercise_1")).toEqual([
			"exercises",
			"detail",
			"exercise_1",
		]);
		expect(queryKeys.exercises.search("bench", searchFilters)).toEqual([
			"exercises",
			"search",
			"bench",
			searchFilters,
		]);
		expect(queryKeys.exercises.similar(similarParams)).toEqual([
			"exercises",
			"similar",
			similarParams,
		]);
	});

	it("builds routine, session, gym, lookup, dashboard, auth, and admin keys", () => {
		const pagination = { page: 2, pageSize: 20, search: "row" };

		expect(queryKeys.routines.all).toEqual(["routines"]);
		expect(queryKeys.routines.lists()).toEqual(["routines", "list"]);
		expect(queryKeys.routines.list()).toEqual(["routines", "list", {}]);
		expect(queryKeys.routines.detail("routine_1")).toEqual([
			"routines",
			"detail",
			"routine_1",
		]);
		expect(queryKeys.routines.search("strength")).toEqual([
			"routines",
			"search",
			"strength",
		]);

		expect(queryKeys.routineDays.all).toEqual(["routineDays"]);
		expect(queryKeys.routineDays.lists()).toEqual(["routineDays", "list"]);
		expect(queryKeys.routineDays.list()).toEqual(["routineDays", "list", {}]);
		expect(queryKeys.routineDays.detail("day_1")).toEqual([
			"routineDays",
			"detail",
			"day_1",
		]);
		expect(queryKeys.routineDays.search("push")).toEqual([
			"routineDays",
			"search",
			"push",
		]);

		expect(queryKeys.sessions.all).toEqual(["sessions"]);
		expect(queryKeys.sessions.lists()).toEqual(["sessions", "list"]);
		expect(queryKeys.sessions.list()).toEqual(["sessions", "list", {}]);
		expect(queryKeys.sessions.detail("session_1")).toEqual([
			"sessions",
			"detail",
			"session_1",
		]);
		expect(queryKeys.sessions.current()).toEqual(["sessions", "current"]);
		expect(queryKeys.sessions.byDateRange(100, 200)).toEqual([
			"sessions",
			"dateRange",
			100,
			200,
		]);

		expect(queryKeys.gyms.all).toEqual(["gyms"]);
		expect(queryKeys.gyms.lists()).toEqual(["gyms", "list"]);
		expect(queryKeys.gyms.list()).toEqual(["gyms", "list"]);
		expect(queryKeys.gyms.detail("gym_1")).toEqual(["gyms", "detail", "gym_1"]);

		expect(queryKeys.userProfile.all).toEqual(["userProfile"]);
		expect(queryKeys.userProfile.current()).toEqual(["userProfile", "current"]);

		expect(queryKeys.lookups.all).toEqual(["lookups"]);
		expect(queryKeys.lookups.equipment()).toEqual(["lookups", "equipment"]);
		expect(queryKeys.lookups.muscleGroups()).toEqual([
			"lookups",
			"muscleGroups",
		]);
		expect(queryKeys.lookups.categories()).toEqual(["lookups", "categories"]);
		expect(queryKeys.lookups.units()).toEqual(["lookups", "units"]);

		expect(queryKeys.dashboard.all).toEqual(["dashboard"]);
		expect(queryKeys.dashboard.stats()).toEqual(["dashboard", "stats"]);
		expect(queryKeys.dashboard.recentSessions()).toEqual([
			"dashboard",
			"recentSessions",
		]);

		expect(queryKeys.auth.session()).toEqual(["auth", "session"]);

		expect(queryKeys.admin.all).toEqual(["admin"]);
		expect(queryKeys.admin.users()).toEqual(["admin", "users"]);
		expect(queryKeys.admin.userList(pagination)).toEqual([
			"admin",
			"users",
			"list",
			pagination,
		]);
		expect(queryKeys.admin.exercises()).toEqual(["admin", "exercises"]);
		expect(queryKeys.admin.exerciseList(pagination)).toEqual([
			"admin",
			"exercises",
			"list",
			pagination,
		]);
		expect(queryKeys.admin.equipment()).toEqual(["admin", "equipment"]);
		expect(queryKeys.admin.equipmentList(pagination)).toEqual([
			"admin",
			"equipment",
			"list",
			pagination,
		]);
		expect(queryKeys.admin.categories()).toEqual(["admin", "categories"]);
		expect(queryKeys.admin.categoryList(pagination)).toEqual([
			"admin",
			"categories",
			"list",
			pagination,
		]);
		expect(queryKeys.admin.muscleGroups()).toEqual(["admin", "muscleGroups"]);
		expect(queryKeys.admin.muscleGroupList(pagination)).toEqual([
			"admin",
			"muscleGroups",
			"list",
			pagination,
		]);
		expect(queryKeys.admin.repetitionUnits()).toEqual([
			"admin",
			"repetitionUnits",
		]);
		expect(queryKeys.admin.repetitionUnitList(pagination)).toEqual([
			"admin",
			"repetitionUnits",
			"list",
			pagination,
		]);
		expect(queryKeys.admin.weightUnits()).toEqual(["admin", "weightUnits"]);
		expect(queryKeys.admin.weightUnitList(pagination)).toEqual([
			"admin",
			"weightUnits",
			"list",
			pagination,
		]);
	});
});
