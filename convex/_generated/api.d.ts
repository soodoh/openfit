/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_auth from "../lib/auth.js";
import type * as mutations_admin from "../mutations/admin.js";
import type * as mutations_authProviders from "../mutations/authProviders.js";
import type * as mutations_gyms from "../mutations/gyms.js";
import type * as mutations_routineDays from "../mutations/routineDays.js";
import type * as mutations_routines from "../mutations/routines.js";
import type * as mutations_sessions from "../mutations/sessions.js";
import type * as mutations_setGroups from "../mutations/setGroups.js";
import type * as mutations_sets from "../mutations/sets.js";
import type * as mutations_userProfiles from "../mutations/userProfiles.js";
import type * as queries_admin from "../queries/admin.js";
import type * as queries_authProviders from "../queries/authProviders.js";
import type * as queries_exercises from "../queries/exercises.js";
import type * as queries_gyms from "../queries/gyms.js";
import type * as queries_lookups from "../queries/lookups.js";
import type * as queries_routineDays from "../queries/routineDays.js";
import type * as queries_routines from "../queries/routines.js";
import type * as queries_sessions from "../queries/sessions.js";
import type * as queries_units from "../queries/units.js";
import type * as queries_userProfiles from "../queries/userProfiles.js";
import type * as seed from "../seed.js";
import type * as seedData_exercises from "../seedData/exercises.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/auth": typeof lib_auth;
  "mutations/admin": typeof mutations_admin;
  "mutations/authProviders": typeof mutations_authProviders;
  "mutations/gyms": typeof mutations_gyms;
  "mutations/routineDays": typeof mutations_routineDays;
  "mutations/routines": typeof mutations_routines;
  "mutations/sessions": typeof mutations_sessions;
  "mutations/setGroups": typeof mutations_setGroups;
  "mutations/sets": typeof mutations_sets;
  "mutations/userProfiles": typeof mutations_userProfiles;
  "queries/admin": typeof queries_admin;
  "queries/authProviders": typeof queries_authProviders;
  "queries/exercises": typeof queries_exercises;
  "queries/gyms": typeof queries_gyms;
  "queries/lookups": typeof queries_lookups;
  "queries/routineDays": typeof queries_routineDays;
  "queries/routines": typeof queries_routines;
  "queries/sessions": typeof queries_sessions;
  "queries/units": typeof queries_units;
  "queries/userProfiles": typeof queries_userProfiles;
  seed: typeof seed;
  "seedData/exercises": typeof seedData_exercises;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
