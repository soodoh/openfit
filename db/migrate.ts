/* eslint-disable eslint(no-console) */
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { db } from "./index";

const migrationsFolder = path.join(__dirname, "migrations");

console.log("Running migrations...");
migrate(db, { migrationsFolder });
console.log("Migrations completed successfully!");
