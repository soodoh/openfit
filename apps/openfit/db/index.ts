import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import fs from "node:fs";
import path from "node:path";
import { schema } from "./schema";

const dbPath =
  process.env.DATABASE_URL?.replace("file:", "") ||
  path.join(process.cwd(), "data", "openfit.db");

// Lazy initialization for the database connection
let _db: BunSQLiteDatabase<typeof schema> | undefined = undefined;

function getDb(): BunSQLiteDatabase<typeof schema> {
  if (!_db) {
    // Ensure the database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const sqlite = new Database(dbPath);
    sqlite.exec("PRAGMA journal_mode = WAL");
    sqlite.exec("PRAGMA foreign_keys = ON");
    sqlite.exec("PRAGMA busy_timeout = 5000"); // Wait up to 5 seconds if database is locked
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as BunSQLiteDatabase<typeof schema>, {
  get(_: BunSQLiteDatabase<typeof schema>, prop: string | symbol): unknown {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type { BunSQLiteDatabase as Database };
