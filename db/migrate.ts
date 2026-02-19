import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { db } from "./index";

const migrationsFolder = path.join(__dirname, "migrations");
// oxlint-disable-next-line no-console
console.log("Running migrations...");
migrate(db, { migrationsFolder });
// oxlint-disable-next-line no-console
console.log("Migrations completed successfully!");
