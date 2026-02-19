import Database from "better-sqlite3";
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import fs from "node:fs";
import path from "node:path";
import { schema } from "./schema";
const dbPath = process.env.DATABASE_URL?.replace("file:", "") ||
    path.join(process.cwd(), "data", "openfit.db");
// Lazy initialization for the database connection
let _db: BetterSQLite3Database<typeof schema> | undefined = null;
function getDb(): BetterSQLite3Database<typeof schema> {
    if (!_db) {
        // Ensure the database directory exists
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        const sqlite = new Database(dbPath);
        sqlite.pragma("journal_mode = WAL");
        sqlite.pragma("foreign_keys = ON");
        sqlite.pragma("busy_timeout = 5000"); // Wait up to 5 seconds if database is locked
        _db = drizzle(sqlite, { schema });
    }
    return _db;
}
// Export a proxy that lazily initializes the database
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
    get(_: BetterSQLite3Database<typeof schema>, prop: string | symbol): unknown {
        return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
export type Database = BetterSQLite3Database<typeof schema>;
