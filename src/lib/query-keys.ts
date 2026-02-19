// Query key factory for TanStack React Query
// Following the recommended pattern from TanStack docs
export const queryKeys = {
    // Exercises
    exercises: {
        all: ["exercises"] as const,
        lists: () => [...queryKeys.exercises.all, "list"] as const,
        list: (filters: Record<string, unknown> = {}) => [...queryKeys.exercises.lists(), filters] as const,
        details: () => [...queryKeys.exercises.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.exercises.details(), id] as const,
        search: (term: string, filters: Record<string, unknown> = {}) => [...queryKeys.exercises.all, "search", term, filters] as const,
        similar: (params: Record<string, unknown>) => [...queryKeys.exercises.all, "similar", params] as const,
    },
    // Routines
    routines: {
        all: ["routines"] as const,
        lists: () => [...queryKeys.routines.all, "list"] as const,
        list: (filters: Record<string, unknown> = {}) => [...queryKeys.routines.lists(), filters] as const,
        details: () => [...queryKeys.routines.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.routines.details(), id] as const,
        search: (term: string) => [...queryKeys.routines.all, "search", term] as const,
    },
    // Routine Days
    routineDays: {
        all: ["routineDays"] as const,
        lists: () => [...queryKeys.routineDays.all, "list"] as const,
        list: (filters: Record<string, unknown> = {}) => [...queryKeys.routineDays.lists(), filters] as const,
        details: () => [...queryKeys.routineDays.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.routineDays.details(), id] as const,
        search: (term: string) => [...queryKeys.routineDays.all, "search", term] as const,
    },
    // Workout Sessions
    sessions: {
        all: ["sessions"] as const,
        lists: () => [...queryKeys.sessions.all, "list"] as const,
        list: (filters: Record<string, unknown> = {}) => [...queryKeys.sessions.lists(), filters] as const,
        details: () => [...queryKeys.sessions.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.sessions.details(), id] as const,
        current: () => [...queryKeys.sessions.all, "current"] as const,
        byDateRange: (startDate: number, endDate: number) => [...queryKeys.sessions.all, "dateRange", startDate, endDate] as const,
    },
    // Gyms
    gyms: {
        all: ["gyms"] as const,
        lists: () => [...queryKeys.gyms.all, "list"] as const,
        list: () => [...queryKeys.gyms.lists()] as const,
        details: () => [...queryKeys.gyms.all, "detail"] as const,
        detail: (id: string) => [...queryKeys.gyms.details(), id] as const,
    },
    // User Profile
    userProfile: {
        all: ["userProfile"] as const,
        current: () => [...queryKeys.userProfile.all, "current"] as const,
    },
    // Lookup Tables
    lookups: {
        all: ["lookups"] as const,
        equipment: () => [...queryKeys.lookups.all, "equipment"] as const,
        muscleGroups: () => [...queryKeys.lookups.all, "muscleGroups"] as const,
        categories: () => [...queryKeys.lookups.all, "categories"] as const,
        units: () => [...queryKeys.lookups.all, "units"] as const,
    },
    // Dashboard
    dashboard: {
        all: ["dashboard"] as const,
        stats: () => [...queryKeys.dashboard.all, "stats"] as const,
        recentSessions: () => [...queryKeys.dashboard.all, "recentSessions"] as const,
    },
    // Auth
    auth: {
        session: () => ["auth", "session"] as const,
    },
    // Admin
    admin: {
        all: ["admin"] as const,
        users: () => [...queryKeys.admin.all, "users"] as const,
        userList: (params: {
            page: number;
            pageSize: number;
            search?: string;
        }) => [...queryKeys.admin.users(), "list", params] as const,
        exercises: () => [...queryKeys.admin.all, "exercises"] as const,
        exerciseList: (params: {
            page: number;
            pageSize: number;
            search?: string;
        }) => [...queryKeys.admin.exercises(), "list", params] as const,
        equipment: () => [...queryKeys.admin.all, "equipment"] as const,
        equipmentList: (params: {
            page: number;
            pageSize: number;
            search?: string;
        }) => [...queryKeys.admin.equipment(), "list", params] as const,
        categories: () => [...queryKeys.admin.all, "categories"] as const,
        categoryList: (params: {
            page: number;
            pageSize: number;
            search?: string;
        }) => [...queryKeys.admin.categories(), "list", params] as const,
        muscleGroups: () => [...queryKeys.admin.all, "muscleGroups"] as const,
        muscleGroupList: (params: {
            page: number;
            pageSize: number;
            search?: string;
        }) => [...queryKeys.admin.muscleGroups(), "list", params] as const,
        repetitionUnits: () => [...queryKeys.admin.all, "repetitionUnits"] as const,
        repetitionUnitList: (params: {
            page: number;
            pageSize: number;
            search?: string;
        }) => [...queryKeys.admin.repetitionUnits(), "list", params] as const,
        weightUnits: () => [...queryKeys.admin.all, "weightUnits"] as const,
        weightUnitList: (params: {
            page: number;
            pageSize: number;
            search?: string;
        }) => [...queryKeys.admin.weightUnits(), "list", params] as const,
    },
};

export default queryKeys;
