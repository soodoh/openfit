import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { db } from "./index";
const migrationsFolder = path.join(__dirname, "migrations");
migrate(db, { migrationsFolder });
