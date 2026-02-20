import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./index";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const rootMigrationsMetaPath = path.join(scriptDir, "meta", "_journal.json");
const nestedMigrationsPath = path.join(scriptDir, "migrations");
const migrationsFolder = fs.existsSync(rootMigrationsMetaPath)
  ? scriptDir
  : nestedMigrationsPath;
// oxlint-disable-next-line no-console
console.log("Running migrations...");
migrate(db, { migrationsFolder });
// oxlint-disable-next-line no-console
console.log("Migrations completed successfully!");
