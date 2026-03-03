import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./index";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const migrationsFolder = path.join(scriptDir, "migrations");
// oxlint-disable-next-line no-console
console.log("Running migrations...");
migrate(db, { migrationsFolder });
// oxlint-disable-next-line no-console
console.log("Migrations completed successfully!");
